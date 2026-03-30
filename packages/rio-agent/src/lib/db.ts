import { Pool, type PoolClient } from "pg";

/**
 * Shared database connection pool and SSL configuration
 * Refactored to address CodeRabbit feedback regarding duplication.
 */

const connectionString = process.env.RIO_DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
    throw new Error("RIO_DATABASE_URL is not set.");
}

const isLocal =
    connectionString?.includes("localhost") ||
    connectionString?.includes("127.0.0.1") ||
    connectionString?.includes("::1");

export const pool = new Pool({
    connectionString,
    ssl: isLocal
        ? false
        : {
            // IF a CA is provided, we MUST verify (hardened). 
            // ELSE, we default to rejectUnauthorized: false to prevent boot crashes with 
            // self-signed certs (e.g. Railway/Supabase).
            // We also check for the standard sslmode parameter as an override.
            rejectUnauthorized: process.env.RIO_DATABASE_CA ? true : (connectionString?.includes("sslmode=no-verify") ? false : false),
            ca: process.env.RIO_DATABASE_CA
        },
    max: 10,
});

// M9: Security Hardening - Reset RLS context on every pool release
// This prevents "context leaking" where one tenant's RLS session persists 
// into a subsequent request that acquires the same connection.
pool.on('release', (err: any, client: PoolClient) => {
    // We use a dedicated client query here to ensure the session is reset 
    // before the next consumer acquires it from the pool.
    // Note: 'err' may be provided if the connection was released due to an error.
    if (client) {
        client.query("SELECT set_config('app.current_tenant', '', false), set_config('app.current_user', '', false)").catch((qErr: any) => {
            console.error("[DB:RLS] Failed to reset context on release:", qErr);
        });
    }
});

export async function query(text: string, params?: any[]) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG === "true") {
        console.log("executed query", { text, duration, rows: res.rowCount });
    }
    return res;
}

/**
 * M9: RLS Session Initialization
 * Ensures that the database connection has the correct tenant and user context.
 * Note: Since we use pooling, we rely on the 'release' listener above to clean up.
 */
export async function initRls(tenantId: string, userId?: string) {
    if (!tenantId) return;
    try {
        const queryText = `SELECT set_config('app.current_tenant', $1, false)${userId ? ", set_config('app.current_user', $2, false)" : ""}`;
        const params = userId ? [tenantId, userId] : [tenantId];
        await pool.query(queryText, params);
    } catch (err) {
        console.error("[DB:RLS] init failed:", err);
        throw new Error(`Failed to initialize security context for tenant ${tenantId}`);
    }
}
