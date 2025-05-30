-- Supabase table schema for the collaborative editor
-- Run this in your Supabase SQL editor to create the required table

-- Create the documents table
CREATE TABLE IF NOT EXISTS public.document (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT DEFAULT 'Untitled Document',
    content JSONB DEFAULT '[{"children":[{"text":""}]}]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.document ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access for demo purposes
-- Note: In production, you should implement proper user authentication and policies
CREATE POLICY "Allow all operations on documents" ON public.document
    FOR ALL USING (true)
    WITH CHECK (true);

-- Create an index on updated_at for better performance
CREATE INDEX IF NOT EXISTS idx_document_updated_at ON public.document(updated_at DESC);

-- Grant necessary permissions
GRANT ALL ON public.document TO anon;
GRANT ALL ON public.document TO authenticated;

-- Enable Realtime for the document table
-- This is required for postgres_changes to work
ALTER publication supabase_realtime ADD TABLE public.document;

-- Sample document for testing
INSERT INTO public.document (id, title, content) 
VALUES (
    '20a86998-441e-4ec3-b919-beeec9facc0f',
    'Sample Document',
    '[{"children":[{"text":"Welcome to the collaborative editor! Start typing to see the magic happen."}]}]'::jsonb
) ON CONFLICT (id) DO NOTHING;
