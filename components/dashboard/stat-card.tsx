'use client';

import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: LucideIcon;
  data: Array<{ name: string; value: number }>;
  color: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  data,
  color,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-3xl border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300">
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5" style={{ backgroundColor: color }} />

      <div className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>

        {/* Chart */}
        <div className="h-16 mb-4 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span
            className={`text-sm font-medium ${
              changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {changeType === 'increase' ? '↑' : '↓'} {change}
          </span>
          <span className="text-xs text-slate-500">vs last month</span>
        </div>
      </div>
    </Card>
  );
}
