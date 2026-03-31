import { pool } from "./src/lib/db";

async function terminateZombies() {
    console.log("Terminating zombie connections...");
    try {
        const res = await pool.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE pid <> pg_backend_pid()
            AND state in ('idle', 'idle in transaction', 'idle in transaction (aborted)')
            AND usename = current_user;
        `);
        console.log(`Terminated ${res.rowCount} zombie connections.`);
    } catch (e: any) {
        console.error("Failed to terminate:", e.message);
    } finally {
        await pool.end();
    }
}
terminateZombies();
