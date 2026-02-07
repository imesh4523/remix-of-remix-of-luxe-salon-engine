-- Add slug column to salons table
ALTER TABLE public.salons ADD COLUMN slug TEXT UNIQUE;

-- Generate slugs for existing salons from their names
UPDATE public.salons SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE public.salons ALTER COLUMN slug SET NOT NULL;