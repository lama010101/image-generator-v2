# Historify Image Generator

## Project Overview

This project is an AI image generation application that integrates with the Runware API for creating AI-generated images based on text prompts. The application includes a fallback demo mode when API keys are not configured, making it suitable for both development and production environments.

**URL**: https://lovable.dev/projects/f4f9351b-4257-43c7-8f9a-48b4afea8294

## Features

- **AI Image Generation**: Generate images from text prompts using the Runware API
- **Fallback Demo Mode**: Automatically uses placeholder images when API keys are not available
- **Environment Configuration**: Easy setup with .env.local template
- **Project Management**: Track development progress and environment health
- **Type-Safe Settings**: Runtime-safe environment variable access

## Environment Setup

To use the image generation features, you need to set up your environment variables:

1. Create a `.env.local` file in the project root (or copy from the template)
2. Add your Runware API key:
   ```
   VITE_RUNWARE_API_KEY=your_api_key_here
   ```
3. Add your Supabase configuration:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_URL=your_supabase_url
   ```

## API Integration

The application uses the following services:

- **Runware API**: For AI image generation
- **Supabase**: For storing image metadata and project tasks

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f4f9351b-4257-43c7-8f9a-48b4afea8294) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (for backend storage)
- Axios (for API requests)
- Zod (for runtime type validation)
- React Query (for data fetching and caching)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f4f9351b-4257-43c7-8f9a-48b4afea8294) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
