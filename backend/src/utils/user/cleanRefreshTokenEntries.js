
const cleanRefreshTokenEntries = (entries, secret, maxTokens = 4) => {
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    const seen = new Set();
    const valid = [];

    for (const entry of entries) {
        if (entry.exp > now && !seen.has(entry.jti)) {
            seen.add(entry.jti);
            valid.push(entry);
        }
    }

    // Sort by iat, keep last N
    return valid
        .sort((a, b) => a.iat - b.iat)
        .slice(-maxTokens);
};


export default cleanRefreshTokenEntries;