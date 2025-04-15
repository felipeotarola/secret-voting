-- Add is_private column to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Create poll_access table for managing private poll access
CREATE TABLE IF NOT EXISTS poll_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_poll_access_poll_id ON poll_access(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_access_user_id ON poll_access(user_id);
