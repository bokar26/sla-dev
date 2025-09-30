import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";

type Tip = { title: string; impactPct: number; desc?: string };

const suggestions: Tip[] = [
  {
    title: "Shift CN→EU lanes with ≥10d slack from sea to rail",
    impactPct: 4,
    desc: "Applies to 27% of current CN→EU orders with margin to spare.",
  },
  {
    title: "Consolidate Vietnam suppliers into 2 primary hubs",
    impactPct: 3,
    desc: "Cuts handoffs, improves pickup windows.",
  },
  {
    title: "Enable pre-booked air for urgent SKUs in Q4",
    impactPct: 2,
    desc: "Locks capacity for spikes; use only for top 10 SKUs.",
  },
];

export default function SLASuggestionsCard() {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-base md:text-lg font-semibold">SLA suggestions</h3>
        </div>
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li key={s.title} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                {s.desc && <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>}
              </div>
              <Badge className="shrink-0 bg-green-600 hover:bg-green-600/90 text-white">
                +{s.impactPct}% toward Q4 goal
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
