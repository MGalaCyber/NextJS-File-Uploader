import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Config } from "@/config";

export async function POST(request: NextRequest) {
    // Set CORS headers
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400, headers });
        }

        // Check file size (50MB limit)
        if (file.size > Config.MaxFileSize) {
            return NextResponse.json({ success: false, error: `File size exceeds ${(Config.MaxFileSize / 1024 / 1024).toFixed(1)}MB limit` }, { status: 400, headers });
        }

        const now = Date.now();
        const expireInMs = Config.ExpireInMs;
        const expireAt = now + expireInMs;

        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${now}-${expireAt}-${sanitizedName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage.from(Config.BucketName as string).upload(fileName, file);

        if (error) {
            console.error("Upload error:", error);
            return NextResponse.json({ success: false, error: "Upload failed: " + error.message }, { status: 500, headers });
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from(Config.BucketName as string).getPublicUrl(fileName);

        // Determine file type for preview
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        const isMedia = isImage || isVideo;
        const host = request.headers.get("host");
        const protocol = request.nextUrl.protocol;
        const origin = host ? `${protocol}//${host}` : Config.BaseUrl;

        const response = {
            success: true,
            file: {
                id: fileName,
                name: file.name,
                size: file.size,
                type: file.type,
                url: publicUrl, // Supabase public URL
                previewUrl: `${Config.CdnUrl || origin}/file/${fileName}`, // Local preview URL
                fileName: fileName,
                isMedia,
                isImage,
                isVideo,
                uploadedAt: new Date().toISOString(),
            },
        };

        return NextResponse.json(response, { status: 200, headers });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") }, { status: 500, headers });
    }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
