
export interface EnhancedPrompt {
  id: string;
  text: string;
}

export interface GenerateImageParams {
  positivePrompt: string;
  negativePrompt?: string;
  scheduler?: string;
  model?: string;
  steps?: number;
  CFGScale?: number;
  seed?: number | null;
  aspectRatio?: string;
  width?: number;
  height?: number;
  outputFormat?: string;
  promptWeighting?: string | number; // Changed to accept both string and number
  numberResults?: number;
}

export interface GeneratedImage {
  // Core fields
  imageUUID: string;
  imageURL: string;
  optimizedImageURL?: string;
  thumbnailImageURL?: string;
  mobileImageURL?: string;
  desktopImageURL?: string;
  
  // Generation parameters
  positivePrompt: string;
  negativePrompt?: string;
  model: string;
  scheduler: string;
  steps: number;
  CFGScale: number;
  seed: number;
  width: number;
  height: number;
  cost: number;
  
  // Timestamps
  createdAt: Date | string;
  updatedAt?: Date | string;
  
  // Status flags
  readyForProduction?: boolean;
  NSFWContent: boolean;
  trueEvent: boolean;
  
  // Prompt metadata (directly map to DB columns)
  promptText?: string;
  key_elements?: string;
  theme?: string;
  celebrity: boolean;
  approx_people_count?: number;
  confidence?: number;
  source_citation?: string;
  
  // Hierarchical metadata (database fields in snake_case)
  '1_where_continent'?: string;
  '1_when_century'?: string;
  '2_where_landmark'?: string;
  '2_where_landmark_km'?: number;
  '2_when_event'?: string;
  '2_when_event_years'?: string;
  '3_where_region'?: string;
  '3_when_decade'?: string;
  '4_where_landmark'?: string;
  '4_where_landmark_km'?: number;
  '4_when_event'?: string;
  '4_when_event_years'?: number;
  
  // Location data
  gpsLocation?: {
    latitude: number;
    longitude: number;
    locationName?: string;
    country?: string;
  };
  
  // Image metadata
  mobileSizeKB?: number;
  desktopSizeKB?: number;
  originalSizeKB?: number;
  
  // System fields
  userId?: string;
  prompt_id?: string | null;
  exact_date?: string | null;
  year?: number;
  
  // Backward compatibility (to be removed)
  title?: string;
  description?: string;
  
  // Computed fields (not in DB)
  hasFullHints?: boolean;
  contentHash?: string;
  
  // Deprecated fields (keep for backward compatibility)
  keyElements?: string;
  approxPeopleCount?: number;
  sourceCitation?: string;
  has_full_hints?: boolean;  // DB field
}
