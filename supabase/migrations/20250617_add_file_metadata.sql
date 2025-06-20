-- Add file metadata columns to conversations table
ALTER TABLE conversations 
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_type TEXT,
ADD COLUMN file_size INTEGER;

-- Create index for querying conversations with files
CREATE INDEX idx_conversations_file_url ON conversations(file_url) WHERE file_url IS NOT NULL;

-- Add comment to describe the file columns
COMMENT ON COLUMN conversations.file_url IS 'URL to the uploaded file in Supabase Storage';
COMMENT ON COLUMN conversations.file_name IS 'Original filename of the uploaded file';
COMMENT ON COLUMN conversations.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN conversations.file_size IS 'Size of the uploaded file in bytes';