EXISTING TABLES

PROMPTS

TABLE public.prompts (
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NULL,
  description text NULL,
  prompt text NOT NULL,
  negative_prompt text NULL,
  date text NULL,
  year integer NULL,
  country text NULL,
  location text NULL,
  gps_coordinates text NULL,

  -- Geo fields
  latitude numeric GENERATED ALWAYS AS (nullif(split_part(gps_coordinates, ',', 1), '')::numeric) STORED,
  longitude numeric GENERATED ALWAYS AS (nullif(split_part(gps_coordinates, ',', 2), '')::numeric) STORED,

  -- Hint fields (quoted)
  "1_where_continent" text NULL,
  "1_when_century" text NULL,
  "2_where_landmark" text NULL,
  "2_where_landmark_km" numeric NULL,
  "2_when_event" text NULL,
  "2_when_event_years" text NULL,
  "3_where_region" text NULL,
  "3_when_decade" text NULL,
  "4_where_landmark" text NULL,
  "4_where_landmark_km" numeric NULL,
  "4_when_event" text NULL,
  "4_when_event_years" numeric NULL,
  "5_when_clues" text NULL,
  "5_where_clues" text NULL,

  ai_generated boolean NULL DEFAULT true,
  real_event boolean NULL DEFAULT true,
  key_elements text NULL,
  theme text NULL,
  celebrity boolean NULL DEFAULT false,
  approx_people_count integer NULL,
  confidence integer CHECK (confidence BETWEEN 0 AND 100),
  last_verified timestamp with time zone NULL,

  has_full_hints boolean GENERATED ALWAYS AS (
    ("1_where_continent" IS NOT NULL AND
     "1_when_century" IS NOT NULL AND
     "2_where_landmark" IS NOT NULL AND
     "2_where_landmark_km" IS NOT NULL AND
     "2_when_event" IS NOT NULL AND
     "2_when_event_years" IS NOT NULL AND
     "3_where_region" IS NOT NULL AND
     "3_when_decade" IS NOT NULL AND
     "4_where_landmark" IS NOT NULL AND
     "4_where_landmark_km" IS NOT NULL AND
     "4_when_event" IS NOT NULL AND
     "4_when_event_years" IS NOT NULL AND
     "5_when_clues" IS NOT NULL AND
     "5_where_clues" IS NOT NULL)
  ) STORED,

  source_citation text NULL,

  CONSTRAINT prompts_pkey PRIMARY KEY (id),
  CONSTRAINT prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS prompts_user_id_idx ON public.prompts (user_id);
CREATE INDEX IF NOT EXISTS prompts_created_at_idx ON public.prompts (created_at DESC);
CREATE INDEX IF NOT EXISTS prompts_confidence_idx ON public.prompts (confidence);
CREATE INDEX IF NOT EXISTS prompts_last_verified_idx ON public.prompts (last_verified);
CREATE INDEX IF NOT EXISTS prompts_id_full_hints_idx ON public.prompts (id) WHERE has_full_hints = true;

IMAGES

 TABLE public.images (
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NULL,
  description text NULL,
  prompt text NOT NULL,
  negative_prompt text NULL,
  date text NULL,
  year integer NULL,
  country text NULL,
  location text NULL,
  gps_coordinates text NULL,
  latitude numeric NULL,
  longitude numeric NULL,

  "1_where_continent" text NULL,
  "1_when_century" text NULL,
  "2_where_landmark" text NULL,
  "2_where_landmark_km" numeric NULL,
  "2_when_event" text NULL,
  "2_when_event_years" text NULL,
  "3_where_region" text NULL,
  "3_when_decade" text NULL,
  "4_where_landmark" text NULL,
  "4_where_landmark_km" numeric NULL,
  "4_when_event" text NULL,
  "4_when_event_years" numeric NULL,
  "5_when_clues" text NULL,
  "5_where_clues" text NULL,

  ai_generated boolean NULL DEFAULT true,
  real_event boolean NULL DEFAULT true,
  key_elements text NULL,
  theme text NULL,
  celebrity boolean NULL DEFAULT false,
  approx_people_count integer NULL,
  confidence integer CHECK (confidence BETWEEN 0 AND 100),
  last_verified timestamp with time zone NULL,

  has_full_hints boolean GENERATED ALWAYS AS (
    ("1_where_continent" IS NOT NULL AND
     "1_when_century" IS NOT NULL AND
     "2_where_landmark" IS NOT NULL AND
     "2_where_landmark_km" IS NOT NULL AND
     "2_when_event" IS NOT NULL AND
     "2_when_event_years" IS NOT NULL AND
     "3_where_region" IS NOT NULL AND
     "3_when_decade" IS NOT NULL AND
     "4_where_landmark" IS NOT NULL AND
     "4_where_landmark_km" IS NOT NULL AND
     "4_when_event" IS NOT NULL AND
     "4_when_event_years" IS NOT NULL AND
     "5_when_clues" IS NOT NULL AND
     "5_where_clues" IS NOT NULL)
  ) STORED,

  source_citation text NULL,
  image_url text NULL,
  optimized_image_url text NULL,
  thumbnail_image_url text NULL,
  mobile_image_url text NULL,
  desktop_image_url text NULL,
  positive_prompt text NULL,
  model text NULL,
  width integer NULL,
  height integer NULL,
  seed integer NULL,
  cfg_scale numeric NULL DEFAULT 30,
  steps integer NULL,
  scheduler text NULL,
  aspect_ratio text NULL,
  output_format text NULL,
  cost numeric NULL DEFAULT 0,
  ready boolean NULL DEFAULT true,
  mature_content boolean NULL DEFAULT false,
  accuracy_score jsonb NULL,
  mobile_size_kb integer NULL DEFAULT 0,
  desktop_size_kb integer NULL DEFAULT 0,
  original_size_kb integer NULL DEFAULT 0,
  content_hash text NULL,
  exact_date text NULL,
  prompt_id uuid NULL,
  location_name text NULL DEFAULT 'Unknown Location',

  CONSTRAINT images_pkey PRIMARY KEY (id),
  CONSTRAINT images_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ✅ Indexes
CREATE INDEX IF NOT EXISTS images_user_id_idx ON public.images (user_id);
CREATE INDEX IF NOT EXISTS images_created_at_idx ON public.images (created_at DESC);
CREATE INDEX IF NOT EXISTS images_confidence_idx ON public.images (confidence);
CREATE INDEX IF NOT EXISTS images_last_verified_idx ON public.images (last_verified);
CREATE INDEX IF NOT EXISTS images_id_full_hints_idx ON public.images (id) WHERE has_full_hints = true;
CREATE INDEX IF NOT EXISTS images_ready_idx ON public.images (ready);
CREATE INDEX IF NOT EXISTS images_model_idx ON public.images (model);
CREATE INDEX IF NOT EXISTS images_content_hash_idx ON public.images (content_hash);
