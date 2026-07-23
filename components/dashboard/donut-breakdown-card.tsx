"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Slice {
  name: string;
  value: number;
  color: string;
}

export function DonutBreakdownCard({
  title,
  icon: Icon,
  data,
}: {
  title: string;
  icon?: LucideIcon;
  data: Slice[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 pb-3">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4 pt-2">
        <div className="size-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={34} outerRadius={52} paddingAngle={3} strokeWidth={0}>
                {data.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(value, name) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {data.map((slice) => (
            <div key={slice.name} className="flex items-center gap-2 text-xs">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.name}</span>
              <span className="shrink-0 font-semibold">{slice.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
