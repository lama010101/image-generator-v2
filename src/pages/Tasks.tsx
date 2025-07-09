
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ProjectTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  owner: string;
  depends_on?: string;
}

// Mock data for now since we don't have the project_tasks table yet
const mockTasks: ProjectTask[] = [
  { id: 'BOOT-01', title: 'Scaffold Next.js 14 + Tailwind project', status: 'completed', owner: 'Dev' },
  { id: 'PM-01', title: 'Read-only Project Management Page (/tasks)', status: 'in_progress', owner: 'FE Dev', depends_on: 'BOOT-01' },
  { id: 'CFG-01', title: 'Verify .env.local is present & implement settings loader', status: 'pending', owner: 'Dev', depends_on: 'BOOT-01' },
  { id: 'API-01', title: 'Implement providerService.ts (RunDiffusion)', status: 'pending', owner: 'BE Dev', depends_on: 'BOOT-01' },
  { id: 'UI-01', title: 'Prompt List Page with Generate button', status: 'pending', owner: 'FE Dev', depends_on: 'API-06' },
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
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Project Management</h1>
          <p className="text-muted-foreground">Track MVP development progress</p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
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
              {mockTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-mono text-sm">{task.id}</TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.owner}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {task.depends_on || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
