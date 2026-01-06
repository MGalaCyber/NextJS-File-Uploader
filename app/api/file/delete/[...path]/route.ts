import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Config } from "@/config";

export async function DELETE(request: NextRequest, params: { path: string[] }) {
    try {
        const filePath = params.path.join("/");
        console.log("Deleting file:", filePath);

        // Validate file path
        if (!filePath || filePath.trim() === "") {
            return NextResponse.json({ success: false, error: "Invalid file path" }, { status: 400 });
        }

        // Check if file exists before deleting
        const { data: fileList, error: listError } = await supabase.storage.from(Config.BucketName as string).list("", {
            search: filePath.split("/").pop(),
        });

        if (listError) {
            console.error("Error checking file existence:", listError);
            return NextResponse.json({ success: false, error: "Error checking file existence" }, { status: 500 });
        }

        const fileName = filePath.split("/").pop();
        const fileExists = fileList?.some(file => file.name === fileName);

        if (!fileExists) {
            return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
        }

        // Delete file from Supabase Storage
        const { error } = await supabase.storage.from(Config.BucketName as string).remove([filePath]);

        if (error) {
            console.error("Delete error:", error);
            return NextResponse.json({ success: false, error: "Failed to delete file: " + error.message }, { status: 500 });
        }

        return NextResponse.json(
            {
                success: true,
                message: "File deleted successfully",
                deletedPath: filePath,
            },
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error("Delete API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
    }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
