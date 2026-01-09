
/**
 * Simple hash function for frame verification.
 * Not cryptographically secure, but good enough for determinism checks.
 * Returns a hex string.
 */
export function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Async SHA-256 for more robust checks (e.g. golden images)
 */
export async function sha256(str: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
