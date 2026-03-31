/**
 * lib/ai/config.ts
 * Centralized configuration for Rio AI services.
 */

export function getAgentBaseUrl(): string {
    const railwayUrl = process.env.RIO_RAILWAY_URL;
    const agentUrl = process.env.RIO_AGENT_URL;
    const nodeEnv = process.env.NODE_ENV;

    // 1. Prioritize Railway (Production) or explicit Agent URL
    if (railwayUrl) return railwayUrl;
    if (agentUrl) return agentUrl;

    // 2. Local fallback ONLY in development
    if (nodeEnv === 'development') {
        return 'http://localhost:3001';
    }

    // 3. Fail closed in production/other environments to prevent silent misconfiguration
    throw new Error(
        "[RIO-CONFIG] AI Agent URL is not configured. " +
        "Please set RIO_RAILWAY_URL or RIO_AGENT_URL in your environment variables."
    );
}

function requireAgentKey(): string {
    const key = process.env.RIO_AGENT_KEY;
    if (!key) {
        throw new Error(
            "[RIO-CONFIG] RIO_AGENT_KEY is not configured. Please set RIO_AGENT_KEY in your environment variables."
        );
    }
    return key;
}

export const RIO_AGENT_KEY = requireAgentKey();
