import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";
import { BaseProcessor, type ProcessInputArgs, type ProcessInputResult, type ProcessInputStepArgs, type ProcessInputStepResult } from "@mastra/core/processors";
import { pool } from "./db.js";
import { embeddingModel } from "./embeddings.js";

/**
 * M6: TokenLimiter Processor
 * Simple implementation to prevent context window overflow (50k tokens).
 * Extends BaseProcessor for Mastra v1.x compatibility.
 */
export class TokenLimiter extends BaseProcessor<"token-limiter"> {
    readonly id = "token-limiter";
    readonly name = "TokenLimiter";
    private threshold: number;

    constructor({ threshold = 50000 }: { threshold?: number } = {}) {
        super();
        this.threshold = threshold;
    }

    /**
     * Secondary guard for total token count including RAG results.
     * M6: Iterative pruning and single-message truncation.
     */
    async processInput(args: ProcessInputArgs): Promise<ProcessInputResult> {
        return {
            messages: this.pruneMessages(args.messages),
            systemMessages: args.systemMessages
        };
    }

    /**
     * M6: Support for multi-step tool calls.
     */
    async processInputStep({ messages }: ProcessInputStepArgs): Promise<ProcessInputStepResult> {
        return { messages: this.pruneMessages(messages) };
    }

    private pruneMessages(messages: any[]): any[] {
        if (!messages || messages.length === 0) return messages;

        let currentMessages = [...messages];

        while (currentMessages.length > 0) {
            const totalText = currentMessages.map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content))).join(' ');
            const estimatedTokens = totalText.split(/\s+/).length * 1.5;

            if (estimatedTokens <= this.threshold) {
                break;
            }

            if (currentMessages.length > 1) {
                console.warn(`[RIO-MEMORY] Pruning oldest message to fit threshold (${Math.round(estimatedTokens)} tokens)`);
                currentMessages.shift();
            } else {
                console.warn(`[RIO-MEMORY] Single message exceeds threshold. Truncating.`);
                const singleMsg = currentMessages[0];
                if (typeof singleMsg.content === 'string') {
                    // Truncate to half the character limit estimate to be safe
                    const charLimit = (this.threshold / 1.5) * 4;
                    singleMsg.content = singleMsg.content.slice(-Math.floor(charLimit / 2));
                }
                break;
            }
        }

        return currentMessages;
    }
}

export const storage = new PostgresStore({
    id: "rio-memory-store",
    pool,
});

const vectorConnectionString = process.env.RIO_DATABASE_URL;
if (!vectorConnectionString && process.env.NODE_ENV === 'production') {
    throw new Error("RIO_DATABASE_URL required for PgVector in production");
}

export const vectorStore = new PgVector({
    id: "rio-vector-store",
    connectionString: vectorConnectionString || "",
});

/**
 * M5: Configure Mastra Memory options
 * M7: resourceId = userId (enforced at call-time in index.ts or agent call)
 * Mastra v1.x SemanticRecall options: topK, messageRange (required), scope, threshold.
 */
export const memory = new Memory({
    storage,
    vector: vectorStore,
    embedder: embeddingModel,
    options: {
        lastMessages: 10,
        generateTitle: true,
        workingMemory: {
            enabled: true,
            scope: "resource",
        },
        semanticRecall: {
            topK: 5,
            messageRange: 2,
            scope: "resource",
            threshold: 0.75,
        },
    },
});
