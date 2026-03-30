import { test, expect } from "@playwright/test";

/**
 * Smoke Test: Río Chat Hydration & Continuity
 * Verifies that the client correctly hydrates messages from the server on open.
 */
test.describe("Río Chat Hydration", () => {
    test("should fetch and display previous messages on mount", async ({ page }) => {
        // Mock the active thread endpoint
        await page.route("**/api/v1/ai/threads/active*", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ threadId: "test-thread-123" })
            });
        });

        // Mock the message hydration endpoint
        await page.route("**/api/v1/ai/threads/messages*", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    messages: [
                        { id: "msg-1", role: "user", content: "Hello Río", createdAt: new Date().toISOString() },
                        { id: "msg-2", role: "assistant", content: "Hello! How can I help you today?", createdAt: new Date().toISOString() }
                    ]
                })
            });
        });

        // 1. Initial State: No messages
        // (Assuming we navigate to a page where RioChatSheet is used)
        await page.goto("/t/ecovilla/dashboard");

        // 2. Open Chat
        await page.click("button[aria-label='Open Rio Assistant']");

        // 3. Verify Hydration
        const userMsg = page.locator("text='Hello Río'");
        const assistantMsg = page.locator("text='Hello! How can I help you today?'");

        await expect(userMsg).toBeVisible({ timeout: 5000 });
        await expect(assistantMsg).toBeVisible({ timeout: 5000 });
    });
});
