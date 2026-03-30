/**
 * Masks a UUID or similar identifier for safe logging.
 * Example: "12345678-..." -> "1234...5678"
 */
export function maskId(id: string | null | undefined): string {
    if (!id) return "null";
    if (id.length < 8) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
}
