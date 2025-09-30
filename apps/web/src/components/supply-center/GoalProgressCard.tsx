import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Props = {
  goalLabel: string;
  current: number; // e.g., 6
  target: number;  // e.g., 18
};

export default function GoalProgressCard({ goalLabel, current, target }: Props) {
  const pct = Math.max(0, Math.min(100, (current / target) * 100));
  
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <h3 className="text-base md:text-lg font-semibold">{goalLabel}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs md:text-sm text-muted-foreground">Target</p>
            <p className="text-sm md:text-base font-medium">+{target}%</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={pct} />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress: +{current}%</span>
            <span>{Math.round(pct)}% of goal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
