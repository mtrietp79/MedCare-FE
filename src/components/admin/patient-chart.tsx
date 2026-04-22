'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { monthlyPatientData } from '@/lib/mock-data'

export function PatientChart() {
  // Gradient colors from light to dark blue
  const chartColors = [
    '#e0f2fe', // sky-100
    '#bae6fd', // sky-200
    '#7dd3fc', // sky-300
    '#38bdf8', // sky-400
    '#0ea5e9', // sky-500
    '#0284c7', // sky-600
    '#0369a1', // sky-700
    '#075985', // sky-800
    '#082f49', // sky-900
    '#0c4a6e', // sky-950
    '#082f49', // back to sky-900
    '#0a3e62', // custom dark blue
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Số lượng bệnh nhân theo tháng</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer
          config={{
            patients: {
              label: 'Bệnh nhân',
              color: '#0ea5e9',
            },
          }}
          className="h-80 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyPatientData}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#9ca3af" 
                style={{ fontSize: '11px' }}
                tick={{ fill: '#6b7280' }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value) => [`${value} bệnh nhân`, 'Số lượng']}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
              />
              <Bar
                dataKey="patients"
                name="Bệnh nhân"
                radius={[6, 6, 0, 0]}
                fill="#0ea5e9"
              >
                {monthlyPatientData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
