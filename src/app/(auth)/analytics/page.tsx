// src/app/(auth)/analytics/page.tsx
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Target,
  DollarSign
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Pie,
} from 'recharts';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS } from '@/constants/dashboard';
import { useDashboard } from '@/contexts/DashboardContext';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('total');

  const {
    expenseData,
    loading,
    metrics,
    totalBalance,
    refreshing,
  } = useDashboard();

  if (!user) return null;

  // Transform expense data for charts
  const getMonthlyTrends = () => {
    const monthlyData: Record<string, any> = {};
    
    expenseData.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          food: 0,
          shopping: 0,
          travelling: 0,
          entertainment: 0,
          total: 0
        };
      }
      
      monthlyData[monthKey].food += expense.food;
      monthlyData[monthKey].shopping += expense.shopping;
      monthlyData[monthKey].travelling += expense.travelling;
      monthlyData[monthKey].entertainment += expense.entertainment;
      monthlyData[monthKey].total += expense.food + expense.shopping + expense.travelling + expense.entertainment;
    });
    
    return Object.values(monthlyData).slice(-6); // Last 6 months
  };

  const monthlyTrends = getMonthlyTrends();

  const categoryData = [
    { name: 'Food', value: metrics.categoryTotals.food, color: CATEGORY_COLORS.food },
    { name: 'Shopping', value: metrics.categoryTotals.shopping, color: CATEGORY_COLORS.shopping },
    { name: 'Travelling', value: metrics.categoryTotals.travelling, color: CATEGORY_COLORS.travelling },
    { name: 'Entertainment', value: metrics.categoryTotals.entertainment, color: CATEGORY_COLORS.entertainment },
  ];

  // Calculate insights
  const currentMonth = monthlyTrends[monthlyTrends.length - 1] || { total: 0 };
  const previousMonth = monthlyTrends[monthlyTrends.length - 2] || { total: 0 };
  const monthlyChange = previousMonth.total > 0 
    ? ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100 
    : 0;
  
  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.value, 0);
  const averageMonthly = monthlyTrends.reduce((sum, month) => sum + month.total, 0) / Math.max(monthlyTrends.length, 1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights into your spending patterns</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Average</p>
                <p className="text-2xl font-bold">{formatCurrency(averageMonthly)}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Used</p>
                <p className="text-2xl font-bold">
                  {((totalSpent / totalBalance) * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Change</p>
                <p className={cn(
                  "text-2xl font-bold",
                  monthlyChange > 0 ? "text-red-600" : "text-green-600"
                )}>
                  {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
                </p>
              </div>
              {monthlyChange > 0 ? (
                <TrendingUp className="h-8 w-8 text-red-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="food" stroke={CATEGORY_COLORS.food} />
                    <Line type="monotone" dataKey="shopping" stroke={CATEGORY_COLORS.shopping} />
                    <Line type="monotone" dataKey="travelling" stroke={CATEGORY_COLORS.travelling} />
                    <Line type="monotone" dataKey="entertainment" stroke={CATEGORY_COLORS.entertainment} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category) => {
                    const percentage = (category.value / totalSpent) * 100;
                    return (
                      <div key={category.name}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(category.value)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: category.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="food" fill={CATEGORY_COLORS.food} />
                    <Bar dataKey="shopping" fill={CATEGORY_COLORS.shopping} />
                    <Bar dataKey="travelling" fill={CATEGORY_COLORS.travelling} />
                    <Bar dataKey="entertainment" fill={CATEGORY_COLORS.entertainment} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}