-- Add file checksum tracking to avoid re-ingesting identical files
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll handle this in the application layer
-- For now, we'll assume the column exists or will be added manually

-- Create index (this will fail if column doesn't exist, which is expected)
CREATE INDEX IF NOT EXISTS idx_uploads_file_sha ON uploads(file_sha256);
