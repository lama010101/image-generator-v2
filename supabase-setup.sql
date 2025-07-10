-- Supabase Setup Script for Historify Image Generator
-- Run this script in the Supabase SQL Editor to create required tables

-- Create images table
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    prompt_id TEXT,
    prompt TEXT,
    title TEXT,
    description TEXT,
    user_id UUID,
    image_url TEXT,
    optimized_image_url TEXT,
    width INTEGER,
    height INTEGER,
    model TEXT,
    ready BOOLEAN DEFAULT false,
    ai_generated BOOLEAN DEFAULT true
);

-- Add comment to images table
COMMENT ON TABLE public.images IS 'Stores generated image metadata and URLs';

-- Ensure user_id column is nullable and not bound to foreign key
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_user_id_fkey;
ALTER TABLE public.images ALTER COLUMN user_id DROP NOT NULL;

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    owner TEXT NOT NULL,
    depends_on TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment to project_tasks table
COMMENT ON TABLE public.project_tasks IS 'Tracks project development tasks and status';

-- Insert default project tasks
INSERT INTO public.project_tasks (id, title, status, owner, depends_on)
VALUES
    ('BOOT-01', 'Scaffold Next.js 14 + Tailwind project', 'completed', 'Dev', NULL),
    ('PM-01', 'Read-only Project Management Page (/tasks)', 'completed', 'FE Dev', 'BOOT-01'),
    ('CFG-01', 'Verify .env.local is present & implement settings loader', 'completed', 'Dev', 'BOOT-01'),
    ('API-01', 'Implement providerService.ts (RunDiffusion)', 'completed', 'BE Dev', 'BOOT-01'),
    ('UI-01', 'Prompt List Page with Generate button', 'completed', 'FE Dev', 'API-01')
ON CONFLICT (id) DO UPDATE
SET 
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    owner = EXCLUDED.owner,
    depends_on = EXCLUDED.depends_on;

-- Set up Row Level Security (RLS)
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Public read access for images"
    ON public.images FOR SELECT
    USING (true);

CREATE POLICY "Public insert access for images"
    ON public.images FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public update access for images"
    ON public.images FOR UPDATE
    USING (true);

CREATE POLICY "Public read access for project_tasks"
    ON public.project_tasks FOR SELECT
    USING (true);
