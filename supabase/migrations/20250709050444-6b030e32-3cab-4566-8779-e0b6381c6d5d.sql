
-- Update RLS policies for prompts table to allow public access
DROP POLICY IF EXISTS "Authenticated users can SELECT their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Authenticated users can INSERT prompts" ON public.prompts;
DROP POLICY IF EXISTS "Authenticated users can UPDATE their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Authenticated users can DELETE their own prompts" ON public.prompts;

-- Create new public access policies
CREATE POLICY "Allow public read access to prompts" ON public.prompts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to prompts" ON public.prompts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to prompts" ON public.prompts
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to prompts" ON public.prompts
  FOR DELETE USING (true);

-- Also update images table for consistency
DROP POLICY IF EXISTS "Authenticated users can SELECT their own images" ON public.images;
DROP POLICY IF EXISTS "Authenticated users can INSERT images" ON public.images;
DROP POLICY IF EXISTS "Authenticated users can UPDATE their own images" ON public.images;
DROP POLICY IF EXISTS "Authenticated users can DELETE their own images" ON public.images;

CREATE POLICY "Allow public read access to images" ON public.images
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to images" ON public.images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to images" ON public.images
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to images" ON public.images
  FOR DELETE USING (true);
