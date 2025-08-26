// src/components/dashboard/DashboardCharts.tsx
"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3, Activity } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ExpenseEntry, 
  CategoryTotals,
  ChartDataPoint,
  PieChartDataPoint, 
  DashboardChartsProps
} from "@/types/dashboard";
import { 
  CATEGORY_COLORS,
  CATEGORY_NAMES,
} from "@/constants/dashboard";
import { 
  formatCurrency,
  prepareChartData,
  preparePieChartData,
} from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">
          {format(new Date(label), 'MMM dd, yyyy')}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{CATEGORY_NAMES[entry.dataKey as keyof typeof CATEGORY_NAMES]}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
        <div className="border-t pt-2 mt-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Total:</span>
            <span>{formatCurrency(payload.reduce((sum: number, entry: any) => sum + entry.value, 0))}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium">{data.name}</span>
        </div>
        <p className="text-sm text-gray-600">
          Amount: <span className="font-medium">{formatCurrency(data.value)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Percentage: <span className="font-medium">{data.percentage?.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  expenses,
  categoryTotals,
  dateRange,
  onDateRangeChange,
  loading = false,
  className,
}) => {
  const chartData = useMemo(() => prepareChartData(expenses), [expenses]);
  const pieChartData = useMemo(() => preparePieChartData(categoryTotals), [categoryTotals]);
  const totalExpenses = useMemo(() => Object.values(categoryTotals).reduce((sum, val) => sum + val, 0), [categoryTotals]);

  // Calculate trends
  const trendData = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const recent = chartData.slice(-7); // Last 7 days
    const previous = chartData.slice(-14, -7); // Previous 7 days
    
    const recentTotal = recent.reduce((sum, day) => sum + (day.total || 0), 0);
    const previousTotal = previous.reduce((sum, day) => sum + (day.total || 0), 0);
    
    const change = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;
    
    return {
      change,
      isPositive: change > 0,
      recentTotal,
      previousTotal,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="trends" className="space-y-4">
        {/* Tab Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Breakdown</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
          </TabsList>
          
          <DatePickerWithRange
            value={dateRange}
            onChange={onDateRangeChange}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Expense Trends
                </CardTitle>
                {trendData && (
                  <Badge variant={trendData.isPositive ? "destructive" : "secondary"}>
                    {trendData.isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(trendData.change).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                      <linearGradient key={category} id={`gradient-${category}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    stroke="#666"
                  />
                  <YAxis stroke="#666" tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                    <Area
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={color}
                      fill={`url(#gradient-${category})`}
                      strokeWidth={2}
                      name={CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-500" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ percentage }) => `${percentage?.toFixed(1)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(item.value)}</div>
                      <div className="text-sm text-gray-500">{item.percentage?.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
                
                {pieChartData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No expense data for the selected period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Category Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={Object.entries(categoryTotals).map(([key, value]) => ({
                  category: CATEGORY_NAMES[key as keyof typeof CATEGORY_NAMES],
                  amount: value,
                  color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" stroke="#666" />
                  <YAxis stroke="#666" tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    labelStyle={{ color: '#333' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {Object.entries(categoryTotals).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(CATEGORY_COLORS)[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-medium">Total Spending</span>
                    <span className="text-blue-900 font-bold">{formatCurrency(totalExpenses)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Average per Day</span>
                    <span className="text-green-900 font-bold">
                      {formatCurrency(chartData.length > 0 ? totalExpenses / chartData.length : 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-700 font-medium">Highest Category</span>
                    <span className="text-purple-900 font-bold">
                      {pieChartData.length > 0 ? pieChartData[0].name : 'None'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-700 font-medium">Active Days</span>
                    <span className="text-orange-900 font-bold">
                      {chartData.filter(day => (day.total || 0) > 0).length} of {chartData.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {pieChartData.length > 0 && pieChartData[0].percentage && pieChartData[0].percentage > 50 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                        <div>
                          <p className="font-medium text-yellow-800">High {pieChartData[0].name} Spending</p>
                          <p className="text-sm text-yellow-700">
                            {pieChartData[0].name} accounts for {pieChartData[0].percentage.toFixed(1)}% of your spending. 
                            Consider reviewing these expenses.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {trendData && trendData.isPositive && trendData.change > 20 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                        <div>
                          <p className="font-medium text-red-800">Spending Increase</p>
                          <p className="text-sm text-red-700">
                            Your spending increased by {trendData.change.toFixed(1)}% compared to the previous period.
                            Consider setting spending limits.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {chartData.length > 0 && chartData.filter(day => (day.total || 0) > 0).length < chartData.length * 0.5 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        <div>
                          <p className="font-medium text-blue-800">Inconsistent Tracking</p>
                          <p className="text-sm text-blue-700">
                            You have expenses recorded on less than half the days. 
                            Try to log expenses daily for better insights.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {totalExpenses === 0 && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2" />
                        <div>
                          <p className="font-medium text-gray-800">No Data</p>
                          <p className="text-sm text-gray-700">
                            Start tracking your expenses to see insights and recommendations here.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!trendData && totalExpenses > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                        <div>
                          <p className="font-medium text-green-800">Good Start!</p>
                          <p className="text-sm text-green-700">
                            You're tracking your expenses. Keep logging for a few more days to see trends and get personalized insights.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};