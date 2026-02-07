-- Create storage bucket for salon images
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-assets', 'salon-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for salon owners to upload images
CREATE POLICY "Salon owners can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'salon-assets' AND
  auth.uid()::text IS NOT NULL
);

-- Create policy for public read access
CREATE POLICY "Public can view salon images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'salon-assets');

-- Create policy for salon owners to update their images
CREATE POLICY "Salon owners can update their images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'salon-assets' AND auth.uid()::text IS NOT NULL);

-- Create policy for salon owners to delete their images
CREATE POLICY "Salon owners can delete their images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'salon-assets' AND auth.uid()::text IS NOT NULL);