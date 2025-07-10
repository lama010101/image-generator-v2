# Historify Image Generator - Technical Documentation

## Overview

This document provides technical details about the Historify Image Generator application, including architecture, implementation details, and usage instructions for developers.

## Architecture

The application follows a modern React architecture with the following key components:

### Frontend
- **React + TypeScript**: Core UI framework
- **Vite**: Build tool and development server
- **Tailwind CSS + shadcn-ui**: Styling and UI components
- **React Query**: Data fetching, caching, and state management

### Backend Services
- **Supabase**: Database and storage for images and project data
- **Runware API**: External AI image generation service

## Key Components

### 1. Image Generation Service

Located in `src/services/imageGeneration.ts`, this service:
- Handles image generation requests
- Integrates with Runware API when available
- Falls back to placeholder images when API keys are not configured
- Stores image metadata in Supabase

```typescript
// Usage example
import { generateImage } from "@/services/imageGeneration";

const result = await generateImage({
  promptId: "unique-prompt-id",
  prompt: "A beautiful sunset over mountains",
  width: 800,
  height: 600
});
```

### 2. Runware Service

Located in `src/services/runwareService.ts`, this service:
- Handles direct communication with the Runware API
- Manages API key authentication
- Processes API responses and errors

### 3. Settings Loader

Located in `src/lib/settings.ts`, this utility:
- Provides type-safe access to environment variables
- Uses Zod for runtime validation
- Centralizes environment configuration

```typescript
// Usage example
import { settings } from "@/lib/settings";

if (settings.VITE_RUNWARE_API_KEY) {
  // API key is available
}
```

### 4. Project Tasks Hook

Located in `src/hooks/useProjectTasks.ts`, this hook:
- Fetches project tasks from Supabase
- Provides loading and error states
- Falls back to predefined tasks if the backend is unavailable

## Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following variables:

```
# Runware API
VITE_RUNWARE_API_KEY=your_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
```

### Supabase Setup

The application expects the following tables in Supabase:

1. `images` - Stores generated image metadata
   - `id`: UUID (primary key)
   - `created_at`: Timestamp
   - `prompt_id`: String
   - `prompt`: Text
   - `url`: String
   - `user_id`: String
   - `width`: Integer
   - `height`: Integer
   - `model`: String
   - `ready`: Boolean

2. `project_tasks` - Stores project management tasks
   - `id`: String (primary key, e.g., "BOOT-01")
   - `title`: String
   - `status`: String (e.g., "completed", "in_progress", "pending")
   - `owner`: String
   - `depends_on`: String (optional)

## Implementation Notes

### UUID Generation

The application uses `crypto.randomUUID()` to generate stable anonymous user IDs for image generation records, replacing the previous hard-coded "public-user" value.

### API Fallback Mechanism

The image generation service automatically detects if the Runware API key is available:
- If available, it uses the Runware API to generate images
- If unavailable, it falls back to placeholder images
- The UI reflects the current mode (API or demo)

### Environment Health Monitoring

The Tasks page displays environment health indicators for:
- Runware API key
- Supabase configuration

This helps developers quickly identify configuration issues.

## Troubleshooting

### Common Issues

1. **Image Generation Fails**
   - Check that your Runware API key is correctly set in `.env.local`
   - Verify network connectivity to the Runware API

2. **Tasks Not Loading**
   - Ensure Supabase configuration is correct
   - Check that the `project_tasks` table exists in your Supabase project

3. **Type Errors**
   - The application uses TypeScript for type safety
   - Some Supabase tables may require type casting if not defined in the schema

## Future Enhancements

Potential areas for future development:

1. User authentication and personalized galleries
2. Additional AI image providers
3. Image editing and manipulation features
4. Enhanced project management with task creation and editing
