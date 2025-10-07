-- Add binary column for storing inline image data
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS binary text;

-- Move data URLs into binary column
UPDATE public.images
SET binary = optimized_image_url
WHERE optimized_image_url LIKE 'data:image%';

UPDATE public.images
SET binary = COALESCE(binary, image_url)
WHERE image_url LIKE 'data:image%';

UPDATE public.images
SET binary = COALESCE(binary, desktop_image_url)
WHERE desktop_image_url LIKE 'data:image%';

UPDATE public.images
SET binary = COALESCE(binary, mobile_image_url)
WHERE mobile_image_url LIKE 'data:image%';

UPDATE public.images
SET binary = COALESCE(binary, thumbnail_image_url)
WHERE thumbnail_image_url LIKE 'data:image%';

-- Prefer Runware URLs in optimized_image_url
UPDATE public.images
SET optimized_image_url = CASE
  WHEN image_url LIKE 'https://im.runware.ai/%' THEN image_url
  WHEN desktop_image_url LIKE 'https://im.runware.ai/%' THEN desktop_image_url
  WHEN mobile_image_url LIKE 'https://im.runware.ai/%' THEN mobile_image_url
  WHEN thumbnail_image_url LIKE 'https://im.runware.ai/%' THEN thumbnail_image_url
  ELSE optimized_image_url
END
WHERE optimized_image_url LIKE 'data:image%';

-- Clear data URLs from URL columns
UPDATE public.images
SET optimized_image_url = NULL
WHERE optimized_image_url LIKE 'data:image%';

UPDATE public.images
SET image_url = NULL
WHERE image_url LIKE 'data:image%';

UPDATE public.images
SET desktop_image_url = NULL
WHERE desktop_image_url LIKE 'data:image%';

UPDATE public.images
SET mobile_image_url = NULL
WHERE mobile_image_url LIKE 'data:image%';

UPDATE public.images
SET thumbnail_image_url = NULL
WHERE thumbnail_image_url LIKE 'data:image%';
