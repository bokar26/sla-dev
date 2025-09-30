import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Slice = { name: string; value: number };

const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#64748b"];

export default function VendorRegionPieCard() {
  const [data, setData] = useState<Slice[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Try real API if available
        const res = await fetch("/api/metrics/vendors/regions");
        if (res.ok) {
          const json = await res.json(); // [{name: "Mainland China", value: 3205}, ...]
          // Normalize to top 6 + "Other"
          const sorted = [...json].sort((a, b) => b.value - a.value);
          const top = sorted.slice(0, 6);
          const other = sorted.slice(6).reduce((acc, s) => acc + s.value, 0);
          const chart = other > 0 ? [...top, { name: "Other", value: other }] : top;
          setData(chart);
        } else {
          // Fallback to aesthetic static sample (replace later)
          setData([
            { name: "Mainland China", value: 42 },
            { name: "Bangladesh", value: 13 },
            { name: "Türkiye", value: 10 },
            { name: "China (CN)", value: 9 },
            { name: "India", value: 7 },
            { name: "Vietnam", value: 4 },
            { name: "Other", value: 15 },
          ]);
        }
      } catch {
        setData([
          { name: "Mainland China", value: 42 },
          { name: "Bangladesh", value: 13 },
          { name: "Türkiye", value: 10 },
          { name: "China (CN)", value: 9 },
          { name: "India", value: 7 },
          { name: "Vietnam", value: 4 },
          { name: "Other", value: 15 },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card>
      <CardContent className="p-4 md:p-6 h-full">
        <h3 className="text-base md:text-lg font-semibold mb-4">Vendor regional breakdown</h3>
        {loading ? (
          <div className="h-64 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data!} 
                  dataKey="value" 
                  nameKey="name" 
                  innerRadius={55} 
                  outerRadius={85} 
                  paddingAngle={2}
                >
                  {data!.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
