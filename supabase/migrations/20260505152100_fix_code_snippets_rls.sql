-- Fix RLS + grants for public.code_snippets
-- This resolves: "new row violates row-level security policy for table code_snippets"

-- Ensure roles can access schema/table
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.code_snippets TO anon, authenticated;

-- Recreate policies with explicit roles and proper WITH CHECK
DROP POLICY IF EXISTS "Anyone can view code snippets" ON public.code_snippets;
DROP POLICY IF EXISTS "Anyone can create code snippets" ON public.code_snippets;
DROP POLICY IF EXISTS "Anyone can update code snippets" ON public.code_snippets;

CREATE POLICY "Anyone can view code snippets"
ON public.code_snippets
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can create code snippets"
ON public.code_snippets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update code snippets"
ON public.code_snippets
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

