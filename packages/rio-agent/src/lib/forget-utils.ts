import { pool, initRls } from "./db";
import { maskId } from "./id-utils";

/**
 * Redacts a specific fact from historical conversation data.
 * This is used when a resident deletes a memory from their working memory.
 */
export async function redactHistoricalFact(fact: string, userId: string, tenantId: string): Promise<{
    messagesRedacted: number;
    semanticChunksDeleted: number;
}> {
    if (!fact || !userId || !tenantId) return { messagesRedacted: 0, semanticChunksDeleted: 0 };

    console.log(`[RIO-AGENT] Pruning historical records for user: ${maskId(userId)}`);

    try {
        // Escaping regex special characters to prevent injection
        const escapedFact = fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Ensure RLS context for this pooled connection
        await initRls(tenantId, userId);

        // 1. Redact Chat History (mastra_messages)
        const historyResult = await pool.query(
            `UPDATE mastra_messages 
             SET content = regexp_replace(content, $1, '[REDACTED]', 'gi')
             WHERE tenant_id = $2 AND user_id = $3
             AND content ~* $1`,
            [escapedFact, tenantId, userId]
        );

        // 2. Delete Semantic Recall (memory_messages)
        // M12: Fix: memory_messages doesn't have reliable user_id/tenant_id columns in all versions,
        // so we filter by resourceId in metadata which is mapped to userId.
        const vectorResult = await pool.query(
            `DELETE FROM memory_messages 
             WHERE metadata->>'resourceId' = $1
             AND metadata->>'content' ~* $2`,
            [userId, escapedFact]
        );

        const messagesRedacted = historyResult.rowCount || 0;
        const semanticChunksDeleted = vectorResult.rowCount || 0;

        console.log(`[RIO-AGENT] Pruning complete: ${messagesRedacted} messages redacted, ${semanticChunksDeleted} semantic chunks deleted.`);

        return { messagesRedacted, semanticChunksDeleted };
    } catch (error) {
        console.error(`[RIO-AGENT] Error during historical fact pruning:`, error);
        return { messagesRedacted: 0, semanticChunksDeleted: 0 };
    }
}
