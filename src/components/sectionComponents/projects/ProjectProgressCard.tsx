'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Project } from '@/types/project';

interface ProjectProgressCardProps {
  project: Project;
}

export function ProjectProgressCard({ project }: ProjectProgressCardProps) {
  const completion = project.completionPercentage || 0;
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const estimatedEndDate = project.estimatedEndDate ? new Date(project.estimatedEndDate) : null;
  const actualEndDate = project.actualEndDate ? new Date(project.actualEndDate) : null;
  const today = new Date();

  // Calculate days
  let daysElapsed = 0;
  let totalDays = 0;
  let daysRemaining = 0;
  let isOverdue = false;

  if (startDate && estimatedEndDate) {
    totalDays = Math.ceil((estimatedEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = Math.ceil((estimatedEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    isOverdue = daysRemaining < 0 && project.status !== 'completed';
  }

  const timeProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
  const isBehindSchedule = timeProgress > completion && project.status !== 'completed';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Project Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <Progress value={completion} />
        </div>

        {startDate && estimatedEndDate && (
          <>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Start Date
                </p>
                <p className="text-sm font-semibold">{startDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {actualEndDate ? 'Completed' : 'Est. End Date'}
                </p>
                <p className="text-sm font-semibold">
                  {actualEndDate ? actualEndDate.toLocaleDateString() : estimatedEndDate.toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Days Elapsed
                </p>
                <p className="text-sm font-semibold">{Math.max(0, daysElapsed)} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Days Remaining
                </p>
                <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                  {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${Math.max(0, daysRemaining)} days`}
                </p>
              </div>
            </div>
          </>
        )}

        {isOverdue ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-600">Project Overdue</p>
              <p className="text-xs text-red-600">
                Deadline has passed
              </p>
            </div>
          </div>
        ) : isBehindSchedule ? (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-yellow-600">Behind Schedule</p>
              <p className="text-xs text-yellow-600">
                Progress is slower than expected timeline
              </p>
            </div>
          </div>
        ) : project.status === 'completed' ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-600">Project Completed</p>
              <p className="text-xs text-green-600">
                {actualEndDate && estimatedEndDate && actualEndDate <= estimatedEndDate
                  ? 'Completed on time'
                  : 'Project finished'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-600">On Track</p>
              <p className="text-xs text-blue-600">
                Project is progressing as planned
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
