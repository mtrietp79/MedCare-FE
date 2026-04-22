'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { patientsBySpecialty } from '@/lib/mock-data'

export function SpecialtyChart() {
  // Medical specialty colors - each has unique color
  const COLORS = [
    '#ef4444', // Nội khoa - Red (general medicine)
    '#f97316', // Tim mạch - Orange (cardiology)
    '#eab308', // Nhi khoa - Yellow (pediatrics)
    '#22c55e', // Sản phụ khoa - Green (obstetrics)
    '#06b6d4', // Da liễu - Cyan (dermatology)
    '#3b82f6', // Chấn thương - Blue (orthopedics)
    '#8b5cf6', // Thần kinh - Purple (neurology)
    '#ec4899', // Mắt - Pink (ophthalmology)
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Số lượng bệnh nhân theo chuyên khoa</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex justify-center items-center">
        <ChartContainer
          config={{
            patients: {
              label: 'Bệnh nhân',
            },
          }}
          className="h-80 w-full flex justify-center"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
                formatter={(value) => `${value} bệnh nhân`}
              />
              <Pie
                data={patientsBySpecialty}
                cx="50%"
                cy="45%"
                labelLine={true}
                label={({ specialty, patients }) => `${specialty}: ${patients}`}
                outerRadius={90}
                fill="#0ea5e9"
                dataKey="patients"
                labelPosition="outer"
              >
                {patientsBySpecialty.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={20}
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
