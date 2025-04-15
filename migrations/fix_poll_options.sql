-- Fix any polls with invalid options
UPDATE polls
SET options = '[]'::jsonb
WHERE options IS NULL OR options = 'null' OR options = '';

-- Ensure options is a valid JSONB array
ALTER TABLE polls
ALTER COLUMN options SET DEFAULT '[]'::jsonb;
