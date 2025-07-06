-- Create the files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES (process.env.BUCKET_NAME as string, process.env.BUCKET_NAME as string, true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the files bucket
CREATE POLICY "Anyone can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = process.env.BUCKET_NAME as string);

CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT USING (bucket_id = process.env.BUCKET_NAME as string);

CREATE POLICY "Anyone can delete files" ON storage.objects
FOR DELETE USING (bucket_id = process.env.BUCKET_NAME as string);
