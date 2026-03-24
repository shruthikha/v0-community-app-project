import { Pool } from "pg";

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
        : process.env.NODE_ENV === "production"
            ? { ca: process.env.RIO_DATABASE_CA_CERT, rejectUnauthorized: true }
            : { rejectUnauthorized: false },
    max: 10,
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
