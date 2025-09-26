import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface ChartCardProps {
  title: string;
  data: any[];
  dataKey1?: string;
  dataKey2?: string;
  action?: React.ReactNode;
  className?: string;
  delay?: number;
  chartType?: "line" | "area" | "bar" | "pie";
}

export default function ChartCard({ title, data, dataKey1 = "count", dataKey2 = "quotes", action, className = "", delay = 0, chartType = "area" }: ChartCardProps) {
  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            />
            <Bar dataKey={dataKey1} fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={data || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage?.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey1}
            >
              {(data || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            />
          </PieChart>
        );
      case "line":
        return (
          <LineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            />
            <Line type="monotone" dataKey={dataKey1} stroke="#10b981" strokeWidth={3} />
            {dataKey2 && <Line type="monotone" dataKey={dataKey2} stroke="#3b82f6" strokeWidth={3} />}
          </LineChart>
        );
      default: // area
        return (
          <AreaChart data={data || []}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey1}
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#colorCount)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey={dataKey2}
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorQuotes)"
              fillOpacity={1}
            />
          </AreaChart>
        );
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-6 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)] transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {action}
      </div>
      <div className="h-80">
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}