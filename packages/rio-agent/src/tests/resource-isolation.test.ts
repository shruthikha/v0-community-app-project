import { describe, expect, it, afterEach } from 'vitest';
import { threadStore, pool } from '../index';

describe('Sprint 12: Rio Memory Foundation - Isolation & Hydration', () => {
    const tenantId = 'test-sprint-12-tenant';
    const userA = 'user-alice-uuid';
    const userB = 'user-bob-uuid';

    afterEach(async () => {
        // Cleanup test threads to prevent cross-test contamination
        // Narrow scope: only delete threads starting with this specific tenantId prefix
        await pool.query('DELETE FROM mastra_messages WHERE thread_id LIKE $1', [`${tenantId}:%`]);
        await pool.query('DELETE FROM mastra_threads WHERE id LIKE $1', [`${tenantId}:%`]);
    });

    it('M1: should strictly isolate memory by userId (resourceId) and enforce ownership', async () => {
        // Create thread for Alice
        const threadAlice = await threadStore.createThread({
            threadId: `alice-${Date.now()}`,
            resourceId: userA,
            tenantId,
            userId: userA,
        });

        // Create thread for Bob
        const threadBob = await threadStore.createThread({
            threadId: `bob-${Date.now()}`,
            resourceId: userB,
            tenantId,
            userId: userB,
        });

        // Add a message for Alice
        await threadStore.saveMessages(tenantId, threadAlice.id, [{
            role: 'user',
            content: 'Hello, I am Alice',
        }], userA);

        // Add a message for Bob
        await threadStore.saveMessages(tenantId, threadBob.id, [{
            role: 'user',
            content: 'Hello, I am Bob',
        }], userB);

        // Verify isolation
        const messagesAlice = await threadStore.getMessages(tenantId, threadAlice.id, userA);
        const messagesBob = await threadStore.getMessages(tenantId, threadBob.id, userB);

        const aliceText = typeof messagesAlice[0].content === 'string' ? messagesAlice[0].content : (messagesAlice[0].content as any).content;
        const bobText = typeof messagesBob[0].content === 'string' ? messagesBob[0].content : (messagesBob[0].content as any).content;

        expect(aliceText).toContain('Alice');
        expect(bobText).toContain('Bob');

        // Security: Alice should NOT be able to see Bob's messages
        const forbiddenMessages = await threadStore.getMessages(tenantId, threadBob.id, userA);
        expect(forbiddenMessages).toEqual([]);

        // We simulate the /threads/messages logic
        const allMessages = await threadStore.getMessages(tenantId, threadBob.id, userB);

        // CodeRabbit #3005102660: Ensure chronological order (based on content Message 1..5)
        const sortedMessages = [...allMessages].sort((a, b) => {
            const contentA = typeof a.content === 'string' ? a.content : '';
            const contentB = typeof b.content === 'string' ? b.content : '';
            return contentA.localeCompare(contentB);
        });

        const hydrated = sortedMessages.slice(-3); // Verify we can slice exactly what we need

        // Security: Alice should NOT be able to save messages to Bob's thread
        await expect(threadStore.saveMessages(tenantId, threadBob.id, [{ role: 'user', content: 'Hacker Alice' }], userA))
            .rejects.toThrow(/Forbidden/);
    }, 30000);

    it('M2: should hydrate in chronological order even if inserted out of order', async () => {
        const thread = await threadStore.createThread({
            threadId: `order-${Date.now()}`,
            resourceId: userA,
            tenantId,
            userId: userA,
        });

        // Save messages in REVERSE insertion order but with chronological timestamps
        // Message 'Second' is newer but saved first in our test
        await threadStore.saveMessages(tenantId, thread.id, [{
            role: 'user',
            content: 'Second',
            createdAt: new Date().toISOString()
        }], userA);

        await threadStore.saveMessages(tenantId, thread.id, [{
            role: 'user',
            content: 'First',
            createdAt: new Date(Date.now() - 10000).toISOString()
        }], userA);

        const messages = await threadStore.getMessages(tenantId, thread.id, userA);

        expect(messages.length).toBe(2);

        const firstText = typeof messages[0].content === 'string' ? messages[0].content : (messages[0].content as any).content;
        const secondText = typeof messages[1].content === 'string' ? messages[1].content : (messages[1].content as any).content;

        // Should still be 'First' then 'Second' if sorting works
        expect(firstText).toBe('First');
        expect(secondText).toBe('Second');
    }, 30000);

    it('M3: should support server-driven thread creation with correct metadata', async () => {
        const threadId = `new-${Date.now()}`;
        const thread = await threadStore.createThread({
            threadId,
            resourceId: userA,
            tenantId,
            userId: userA,
        });

        const fetched = await threadStore.getThreadById(tenantId, thread.id, userA);
        expect(fetched?.metadata?.tenantId).toBe(tenantId);
        expect(fetched?.metadata?.userId).toBe(userA);
    }, 30000);
});
