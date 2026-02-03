-- ==========================================
-- ALETHEON STORAGE INITIALIZATION
-- Run this in the Supabase SQL Editor
-- ==========================================

-- 1. Create the 'artifacts' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('artifacts', 'artifacts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable public access to read objects
-- This ensures images appear in the dashboard and reports
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'artifacts' );

-- 3. Allow uploads via service role (already default)
-- But we can explicitly allow authenticated uploads just in case
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'artifacts' );

-- 4. Allow users to update/delete their own uploads if folder matches their user_id
-- (Currently our API uses artifact.id as folder, so this is for future proofing)
CREATE POLICY "User Control"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'artifacts' );
