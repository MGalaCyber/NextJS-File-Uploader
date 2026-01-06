import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Config } from "@/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        // Get a list of files from the "temp-files" bucket
        const { data: files, error: listError } = await supabase.storage.from(Config.BucketName as string).list("", {
            limit: 1000, //maximum files for one call
            offset: 0,
        });

        if (listError) {
            console.error("Error listing files:", listError);
            return NextResponse.json({ success: false, error: "Failed to list files" }, { status: 500 });
        }

        const now = Date.now();
        const expiredFiles: string[] = [];

        for (const file of files || []) {
            const fileName = file.name;

            // Check if fileName follows the format: {uploadAt}-{expireAt}-{sanitizedName}
            const parts = fileName.split("-");
            if (parts.length < 3) continue; // skip if format doesn't match

            const expireAt = Number(parts[1]);
            if (isNaN(expireAt)) continue;

            if (now > expireAt) {
                expiredFiles.push(fileName);
            }
        }

        // Delete all expired files
        if (expiredFiles.length > 0) {
            const { data: deleted, error: deleteError } = await supabase.storage.from(Config.BucketName as string).remove(expiredFiles);

            if (deleteError) {
                console.error("Error deleting files:", deleteError);
                return NextResponse.json({ success: false, error: "Failed to delete some files" }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                deleted: deleted,
                count: deleted.length,
            });
        }

        return NextResponse.json({
            success: true,
            message: "No expired files to delete",
        });
    } catch (err) {
        console.error("Unexpected error in cronjob:", err);
        return NextResponse.json({ success: false, error: "Unexpected server error" }, { status: 500 });
    }
}
