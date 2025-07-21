
// This file is now obsolete and can be deleted.
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useProjectTasks, ProjectTask } from "@/hooks/useProjectTasks";


// Fallback tasks if backend table is empty
const fallbackTasks: ProjectTask[] = [
  { id: 'BOOT-01', title: 'Scaffold Next.js 14 + Tailwind project', status: 'completed', owner: 'Dev' },
  { id: 'PM-01', title: 'Read-only Project Management Page (/tasks)', status: 'completed', owner: 'FE Dev', depends_on: 'BOOT-01' },
  { id: 'CFG-01', title: 'Verify .env.local is present & implement settings loader', status: 'completed', owner: 'Dev', depends_on: 'BOOT-01' },
  { id: 'API-01', title: 'Implement providerService.ts (RunDiffusion)', status: 'completed', owner: 'BE Dev', depends_on: 'BOOT-01' },
  { id: 'UI-01', title: 'Prompt List Page with Generate button', status: 'completed', owner: 'FE Dev', depends_on: 'API-01' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'blocked': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const Tasks = () => {
  const { data: tasks, isLoading, error } = useProjectTasks();

  const taskList: ProjectTask[] = tasks && tasks.length ? tasks : fallbackTasks;

  const envChecks = [
    { key: "VITE_RUNWARE_API_KEY", label: "Runware API" },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase Anon" },
    { key: "SUPABASE_URL", label: "Supabase URL" },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Project Management</h1>
          <p className="text-muted-foreground">Track MVP development progress &amp; environment setup</p>
        </div>

        {/* Environment setup status */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h2 className="font-medium mb-3">Environment Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {envChecks.map((item) => {
              const present = !!import.meta.env[item.key as keyof ImportMetaEnv];
              const Icon = present ? CheckCircle : XCircle;
              return (
                <div
                  key={item.key}
                  className="flex items-center space-x-2 text-sm"
                >
                  <Icon
                    className={present ? "h-4 w-4 text-green-500" : "h-4 w-4 text-red-500"}
                  />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks table */}
        <div className="bg-card rounded-lg border shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Task ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-24">Owner</TableHead>
                  <TableHead className="w-32">Depends On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskList.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono text-sm">{task.id}</TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.owner}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {task.depends_on || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {error && (
            <p className="p-4 text-destructive text-sm">Failed to load tasks: {error.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
