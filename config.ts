function parseFileSize(size: string) {
    const match = size.match(/^(\d+)(KB|MB|GB)?$/i);
    if (!match) return Number(size);
    const value = Number(match[1]);
    const unit = match[2]?.toUpperCase();

    switch (unit) {
        case "KB": return value * 1024;
        case "MB": return value * 1024 * 1024;
        case "GB": return value * 1024 * 1024 * 1024;
        default: return value;
    }
}

function parseExpireTime(expire: string) {
    const match = expire.match(/^(\d+)([dhms])?$/i);
    if (!match) return Number(expire);
    const value = Number(match[1]);
    const unit = match[2]?.toLowerCase();

    switch (unit) {
        case "s": return value * 1000;
        case "m": return value * 60 * 1000;
        case "h": return value * 60 * 60 * 1000;
        case "d": return value * 24 * 60 * 60 * 1000;
        default: return value;
    }
}

export const Config = {
    MaxFileSize: parseFileSize(process.env.MAX_FILE_SIZE || "50MB"), // Default to 50MB
    ExpireInMs: parseExpireTime(process.env.EXPIRE_IN || "7d"), // Default to 7 days

    BucketName: process.env.BUCKET_NAME || "temp-files",
    SupabaseUrl: process.env.SUPABASE_URL || "",
    SupabaseAnonymousKey: process.env.SUPABASE_ANON_KEY || "",

    BaseUrl: process.env.BASE_URL || "http://localhost:3000",
    CdnUrl: process.env.CDN_URL?.replace(/\/$/, "") || "", // Optional, if you have a CDN in front of Supabase Storage
}