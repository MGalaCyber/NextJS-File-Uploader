import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  // Set CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400, headers })
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400, headers })
    }

    const now = Date.now()
    const expireInMs = 7 * 24 * 60 * 60 * 1000 // 1 minggu
    const expireAt = now + expireInMs

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${now}-${expireAt}-${sanitizedName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(process.env.BUCKET_NAME as string).upload(fileName, file)

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500, headers })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(process.env.BUCKET_NAME as string).getPublicUrl(fileName)

    // Determine file type for preview
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const isMedia = isImage || isVideo

    const response = {
      success: true,
      file: {
        id: fileName,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl, // Supabase public URL
        previewUrl: `/api/file/${fileName}`, // Local preview URL
        fileName: fileName,
        isMedia,
        isImage,
        isVideo,
        uploadedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, { status: 200, headers })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500, headers },
    )
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
  })
}
