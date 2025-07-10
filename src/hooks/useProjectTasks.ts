import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectTask {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  owner: string;
  depends_on?: string;
}

/**
 * Fetch project tasks from Supabase `project_tasks` table.
 * If the table does not exist or returns an error, gracefully fall back to an empty array.
 */
export const useProjectTasks = () => {
  return useQuery<ProjectTask[]>({
    queryKey: ["project_tasks"],
    queryFn: async () => {
      try {
        // Using `any` to bypass TypeScript table-name constraint since `project_tasks` is not yet in the generated types
        const { data, error } = await (supabase.from as any)("project_tasks").select("*");
        if (error) {
          console.warn("project_tasks fetch error", error.message);
          // Return empty array on error - fallback tasks will be used
          return [];
        }
        return (data as unknown as ProjectTask[]) ?? [];
      } catch (e) {
        console.warn("Error fetching project tasks:", e);
        // Return empty array on any exception - fallback tasks will be used
        return [];
      }
    },
    // staleTime to avoid refetching too frequently
    staleTime: 60_000,
    // Don't retry on 404 errors (table doesn't exist)
    retry: false,
  });
};
