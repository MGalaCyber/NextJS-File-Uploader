# 🗂️ Temp File Uploader

A simple and secure file uploader built with **Next.js App Router** and **Supabase Storage**.  
This tool allows users to upload files and share them temporarily — all files are automatically deleted after **7 days**.

---

## 🚀 Features

- 🔐 Upload files securely to Supabase Storage
- 📎 Get public & local preview links instantly
- 🗑️ Automatic file cleanup after 7 days
- 🖼️ Supports image & video preview detection
- 🧩 Built with Next.js 15+ App Router (API Routes)

---

## 🛠️ Environment Configuration

Create a `.env` file in the root directory and add your Supabase credentials:

```env
BUCKET_NAME=files
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
BASE_URL=https://domain.com
CDN_URL=https://cdn.domain.com
```

🔍 How to get these values:
You can find them in your Supabase dashboard:
- 🔗 [Go to Supabase Project Settings → API](https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets/temp-files?showConnect=true)
    - SUPABASE_URL → Found under "Project URL"
    - SUPABASE_ANON_KEY → Found under "anon public" in "Project API Keys"
- 🔗 [Go to Supabase Storage → Buckets](https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api-keys)
    - BUCKET_NAME → Choose or create a bucket (e.g., `files`, `temp-files`)
    - BUCKET_POLICIES → Select `New policy > For full customization > Select All (Allowed operation section)`

Make sure your bucket's public access is enabled, or adjust RLS policies accordingly.
