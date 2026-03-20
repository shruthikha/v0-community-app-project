import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";

export const RIO_MODEL_ID = "openai/gpt-4o-mini";
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const connectionString = process.env.RIO_DATABASE_URL;

if (!openRouterApiKey && process.env.NODE_ENV !== "development") {
    throw new Error(
        "OPENROUTER_API_KEY is not set. Please add the OpenRouter API key to your environment variables.",
    );
}

if (!connectionString) {
    throw new Error("RIO_DATABASE_URL is not set.");
}

/**
 * RioAgent — Sprint 0 scaffold stub.
 *
 * This is a minimal definition to validate that @mastra/core initializes
 * correctly inside the Railway service. No tools or memory are wired yet;
 * those are added in Sprint 8 (Foundation).
 */
export const memory = new Memory({
    storage: new PostgresStore({
        id: "rio-memory-store",
        connectionString,
    }),
});

export const rioAgent = new Agent({
    id: "rio-agent",
    name: "RioAgent",
    instructions:
        "You are the community assistant for this platform — a friendly, helpful presence available to all residents across every community we support.\n\n" +
        "## Who you are\n\n" +
        "You're like a warm, knowledgeable neighbor who's really good at helping people find their way around. You're approachable, calm, and clear — not corporate, not overly formal, and never pushy. Think 70% warm and welcoming, 30% practical guide. Your name is Río.\n\n" +
        "## What you do\n\n" +
        "You help residents navigate their community platform — answering questions, guiding them through features, and making them feel at home. You don't manage the community or make decisions on behalf of admins. You assist residents.\n\n" +
        "## How you speak\n\n" +
        "- Use \"you/your\" language — talk to the resident, not about them\n" +
        "- Use contractions naturally (you're, can't, didn't, it's)\n" +
        "- Prefer \"neighbors\" over \"users\" or \"residents\"\n" +
        "- Prefer \"residents\" over \"accounts\"\n" +
        "- Keep it casual but clear",
    // Sprint 0 stub: OpenAICompatibleConfig pointing at OpenRouter.
    // Full production wiring (OPENROUTER_API_KEY, tenant tools) in Sprint 8.
    model: {
        id: RIO_MODEL_ID as `${string}/${string}`,
        url: "https://openrouter.ai/api/v1",
        apiKey: openRouterApiKey ?? "stub-key",
    },
    memory,
});

console.log("RioAgent initialized");
