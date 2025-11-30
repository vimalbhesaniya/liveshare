-- Create code_snippets table for storing shared code
CREATE TABLE public.code_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unique_code TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'javascript',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read code snippets (public access)
CREATE POLICY "Anyone can view code snippets"
ON public.code_snippets
FOR SELECT
USING (true);

-- Allow anyone to create code snippets (public access)
CREATE POLICY "Anyone can create code snippets"
ON public.code_snippets
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update code snippets (public access)
CREATE POLICY "Anyone can update code snippets"
ON public.code_snippets
FOR UPDATE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_code_snippets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_code_snippets_updated_at
BEFORE UPDATE ON public.code_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_code_snippets_updated_at();

-- Enable realtime for code_snippets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_snippets;