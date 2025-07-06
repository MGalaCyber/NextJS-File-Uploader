"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Upload, File, X, CheckCircle, AlertCircle, Download, ImageIcon, Video, FileText, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  fileName: string
  isMedia: boolean
  isImage: boolean
  isVideo: boolean
  uploadedAt: Date
}

interface UploadingFile {
  id: string
  name: string
  size: number
  progress: number
  status: "uploading" | "success" | "error"
  error?: string
}

export default function FileUploader() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substring(7)

    // Add to uploading files
    const uploadingFile: UploadingFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading",
    }

    setUploadingFiles((prev) => [...prev, uploadingFile])

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Use fetch with progress simulation
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15
        if (progress > 90) progress = 90
        setUploadingFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Check content type
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Invalid content type:", contentType)
        console.error("Response text:", await response.text())
        throw new Error("Server returned invalid response format")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Upload failed")
      }

      // Update progress to 100%
      setUploadingFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 100 } : f)))

      // Update status to success
      setTimeout(() => {
        setUploadingFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "success" as const } : f)))
      }, 300)

      // Add to uploaded files
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: result.file.name,
        size: result.file.size,
        type: result.file.type,
        url: result.file.url,
        fileName: result.file.fileName,
        isMedia: result.file.isMedia,
        isImage: result.file.isImage,
        isVideo: result.file.isVideo,
        uploadedAt: new Date(result.file.uploadedAt),
      }

      setUploadedFiles((prev) => [...prev, uploadedFile])

      // Remove from uploading files after a delay
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId))
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as const,
                progress: 0,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f,
        ),
      )
    }
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach((file) => {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert(`File ${file.name} melebihi batas ukuran 50MB`)
        return
      }
      uploadFile(file)
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click()
  }

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const removeUploadedFile = async (file: UploadedFile) => {
    try {
      // Encode the file path to handle special characters
      const encodedFileName = encodeURIComponent(file.fileName)
      const response = await fetch(`/api/file/delete/${encodedFileName}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete file")
      }

      const result = await response.json()
      console.log("Delete result:", result)

      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))

      // Show success toast
      const toast = document.createElement("div")
      toast.textContent = "File deleted successfully!"
      toast.className =
        "fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg z-50 shadow-lg animate-in slide-in-from-right duration-300"
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.className += " animate-out slide-out-to-right duration-300"
        setTimeout(() => document.body.removeChild(toast), 300)
      }, 2000)
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete file: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const getPreviewUrl = (file: UploadedFile) => {
    // Check if file is actually previewable (image, video, or audio)
    const isPreviewable =
      file.isImage ||
      file.isVideo ||
      file.type.startsWith("audio/") ||
      file.name.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)

    if (isPreviewable) {
      // Encode the file name to handle special characters and spaces
      const encodedFileName = encodeURIComponent(file.fileName)
      return `${window.location.origin}/api/file/${encodedFileName}`
    }
    return null
  }

  const getDirectFileUrl = (file: UploadedFile) => {
    // Encode the file name to handle special characters and spaces
    const encodedFileName = encodeURIComponent(file.fileName)
    return `${window.location.origin}/api/file/${encodedFileName}`
  }

  const getFileIcon = (file: UploadedFile) => {
    if (file.isImage) return <ImageIcon className="w-8 h-8 text-blue-400" />
    if (file.isVideo) return <Video className="w-8 h-8 text-purple-400" />
    if (file.type.startsWith("audio/")) return <div className="w-8 h-8 text-green-400 text-2xl">🎵</div>
    return <FileText className="w-8 h-8 text-gray-400" />
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Simple toast notification
      const toast = document.createElement("div")
      toast.textContent = "URL copied to clipboard!"
      toast.className =
        "fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 shadow-lg animate-in slide-in-from-right duration-300"
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.className += " animate-out slide-out-to-right duration-300"
        setTimeout(() => document.body.removeChild(toast), 300)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        alert("URL copied to clipboard!")
      } catch (fallbackErr) {
        console.error("Fallback copy failed: ", fallbackErr)
        alert("Failed to copy URL")
      }
      document.body.removeChild(textArea)
    }
  }

  const isPreviewable = (file: UploadedFile) => {
    return (
      file.isImage ||
      file.isVideo ||
      file.type.startsWith("audio/") ||
      file.name.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-purple-900/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-800/5 to-transparent" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">File Uploader</h1>
          <p className="text-gray-400 text-lg">Upload your files securely to the cloud</p>
        </div>

        {/* Upload Area - Matching the provided design */}
        <Card className="border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="space-y-4">
              {/* Upload File Header */}
              <div className="flex items-center gap-3 text-white">
                <Upload className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Upload File</h2>
              </div>
              <p className="text-gray-400 text-sm">
                Drag and drop file atau klik untuk memilih file (Max. 50MB per file)
              </p>

              {/* Upload Area */}
              <div
                className={`relative overflow-hidden rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300 ${
                  isDragOver
                    ? "border-blue-400 bg-blue-500/5 scale-[1.02]"
                    : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/20"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleUploadAreaClick}
              >
                {/* Subtle gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-700/10" />

                {/* Content */}
                <div className="relative p-16 text-center space-y-6">
                  <div className="mx-auto w-16 h-16 text-gray-400 transition-transform duration-300 hover:scale-110">
                    <Upload className="w-full h-full" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-white mb-4">Drop file di sini atau klik untuk upload</h3>
                    <p className="text-gray-400 text-sm">Mendukung semua jenis file (maksimal 50MB per file)</p>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUploadAreaClick()
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-all duration-200 hover:scale-105"
                  >
                    Pilih File
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploading Files with Enhanced Animation */}
        {uploadingFiles.length > 0 && (
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm animate-in slide-in-from-bottom duration-300">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Uploading Files</h3>
              <div className="space-y-4">
                {uploadingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg animate-in slide-in-from-left duration-300"
                  >
                    <div className="flex-shrink-0">
                      {file.status === "uploading" && (
                        <div className="relative w-8 h-8">
                          <div className="w-8 h-8 border-2 border-blue-500/30 rounded-full" />
                          <div className="absolute inset-0 w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {file.status === "success" && (
                        <CheckCircle className="w-8 h-8 text-green-500 animate-in zoom-in duration-300" />
                      )}
                      {file.status === "error" && <AlertCircle className="w-8 h-8 text-red-500" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium truncate">{file.name}</p>
                        <span className="text-gray-400 text-sm">{formatFileSize(file.size)}</span>
                      </div>

                      {file.status === "uploading" && (
                        <div className="space-y-1">
                          <Progress value={file.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{Math.round(file.progress)}%</span>
                            <span className="animate-pulse">Uploading...</span>
                          </div>
                        </div>
                      )}

                      {file.status === "success" && (
                        <p className="text-green-400 text-sm animate-pulse">Upload completed!</p>
                      )}

                      {file.status === "error" && <p className="text-red-400 text-sm">{file.error}</p>}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadingFile(file.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Uploaded Files with Preview Support */}
        {uploadedFiles.length > 0 && (
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Uploaded Files</h3>
              <div className="grid gap-4">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-all duration-200 animate-in slide-in-from-bottom"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {getFileIcon(file)}

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.uploadedAt.toLocaleDateString()}</span>
                        {isPreviewable(file) && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">Preview Available</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPreviewable(file) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(getPreviewUrl(file)!, "_blank")}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getPreviewUrl(file)!)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Copy preview URL"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getDirectFileUrl(file), "_blank")}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadedFile(file)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete file"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {uploadedFiles.length === 0 && uploadingFiles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center">
              <File className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500">No files uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
