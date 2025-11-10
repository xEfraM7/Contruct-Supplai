'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { Project } from '@/types/project';

interface ProjectBudgetCardProps {
  project: Project;
}

export function ProjectBudgetCard({ project }: ProjectBudgetCardProps) {
  const estimatedBudget = project.estimatedBudget || 0;
  const actualCost = project.actual_cost || 0;
  const remaining = estimatedBudget - actualCost;
  const percentageUsed = estimatedBudget > 0 ? (actualCost / estimatedBudget) * 100 : 0;
  const isOverBudget = actualCost > estimatedBudget;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Budget Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Estimated</p>
            <p className="text-2xl font-bold">${estimatedBudget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actual Cost</p>
            <p className="text-2xl font-bold">${actualCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(remaining).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget Used</span>
            <span className="font-semibold">{percentageUsed.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(percentageUsed, 100)} 
            className={isOverBudget ? 'bg-red-100' : ''}
          />
        </div>

        {isOverBudget ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-600">Over Budget</p>
              <p className="text-xs text-red-600">
                ${(actualCost - estimatedBudget).toLocaleString()} over estimated budget
              </p>
            </div>
          </div>
        ) : remaining < estimatedBudget * 0.1 && estimatedBudget > 0 ? (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-yellow-600">Budget Warning</p>
              <p className="text-xs text-yellow-600">
                Less than 10% of budget remaining
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-600">On Track</p>
              <p className="text-xs text-green-600">
                Budget is within expected range
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
