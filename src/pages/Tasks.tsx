
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle, Settings, Zap, Database, Image, Code } from "lucide-react";
import { EnvSetup } from "@/components/EnvSetup";

const Tasks = () => {
  const [showEnvSetup, setShowEnvSetup] = useState(false);

  const tasks = [
    {
      id: 1,
      title: "Database Setup",
      description: "Configure Supabase database with prompts and images tables",
      status: "completed",
      progress: 100,
      icon: Database,
      category: "Infrastructure"
    },
    {
      id: 2,
      title: "UI Components",
      description: "Build prompt library, gallery, and navigation components",
      status: "completed",
      progress: 100,
      icon: Code,
      category: "Frontend"
    },
    {
      id: 3,
      title: "Environment Configuration",
      description: "Set up API keys for Runware, Firebase, and other services",
      status: "pending",
      progress: 0,
      icon: Settings,
      category: "Configuration"
    },
    {
      id: 4,
      title: "Image Generation Pipeline",
      description: "Integrate Runware API for real image generation",
      status: "in-progress",
      progress: 60,
      icon: Zap,
      category: "API Integration"
    },
    {
      id: 5,
      title: "File Storage Integration",
      description: "Connect Firebase Storage for image uploads and optimization",
      status: "pending",
      progress: 0,
      icon: Image,
      category: "Storage"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'in-progress': return Clock;
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const overallProgress = (completedTasks / totalTasks) * 100;

  if (showEnvSetup) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowEnvSetup(false)}
              className="mb-4"
            >
              ← Back to Tasks
            </Button>
          </div>
          <EnvSetup />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Project Tasks</h1>
          <p className="text-muted-foreground">
            Track the progress of building your AI Image Generator
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Overall Progress
            </CardTitle>
            <CardDescription>
              {completedTasks} of {totalTasks} tasks completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status);
            const TaskIcon = task.icon;

            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <TaskIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {task.description}
                        </CardDescription>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {task.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${getStatusColor(task.status)}`}>
                        <StatusIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{task.status.replace('-', ' ')}</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                    
                    {task.id === 3 && task.status === 'pending' && (
                      <Button
                        onClick={() => setShowEnvSetup(true)}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Environment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common development tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => setShowEnvSetup(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Environment Setup
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Supabase Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://runware.ai/dashboard', '_blank')}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Runware Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tasks;
