'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface CourierChartProps {
  data: { courier: string; disputes: number }[]
}

export function CourierChart({ data }: CourierChartProps) {
  const barColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Disputes by Courier</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
              <XAxis
                dataKey="courier"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                interval={0}
                minTickGap={16}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="disputes" radius={[6, 6, 0, 0]} name="Disputes">
                {data.map((entry, index) => (
                  <Cell key={`bar-${entry.courier}-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function CourierChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-75 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  )
}
