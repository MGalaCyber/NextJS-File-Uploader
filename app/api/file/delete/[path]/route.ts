import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest, params: { path: string }) {
  try {
    const filePath = params.path
    console.log("Deleting file:", filePath)

    // Delete file from Supabase Storage
    const { error } = await supabase.storage.from("temp-files").remove([filePath])

    if (error) {
      console.error("Delete error:", error)
      return NextResponse.json({ error: "Failed to delete file: " + error.message }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, message: "File deleted successfully" },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Delete API error:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
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
  })
}
