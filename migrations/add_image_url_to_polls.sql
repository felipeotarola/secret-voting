-- Add image_url column to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS image_url TEXT;
