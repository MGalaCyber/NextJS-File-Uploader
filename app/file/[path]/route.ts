import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Config } from "@/config";

export async function GET(request: NextRequest) {
    try {
        const filePath = request.nextUrl.pathname.split("/file/")[1];

        if (!filePath) {
            return NextResponse.json({ success: false, error: "File path not provided" }, { status: 400 });
        }

        const { data, error } = await supabase.storage.from(Config.BucketName as string).download(filePath);

        if (error || !data) {
            return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
        }

        // Convert ReadableStream to ArrayBuffer (or Uint8Array)
        const fileBuffer = await data.arrayBuffer();

        // Get mime-type from filename (optional, or you can store it in metadata if you want to be more precise)
        const mimeType = getMimeType(filePath) || "application/octet-stream";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": mimeType,
                "Content-Disposition": `inline; filename="${filePath}"`, // to render not download
            },
        });
    } catch (error) {
        console.error("API route error:", error);
        return NextResponse.json({ success: false, error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
    }
}

// Simple helper function for MIME detection based on extension
function getMimeType(filePath: string): string | undefined {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "gif":
            return "image/gif";
        case "webp":
            return "image/webp";
        case "pdf":
            return "application/pdf";
        case "txt":
            return "text/plain";
        case "mp4":
            return "video/mp4";
        case "webm":
            return "video/webm";
        default:
            return undefined;
    }
}
