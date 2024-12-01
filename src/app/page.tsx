"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mockData from "@/data/mockData";
import Navigation from "@/components/navigation/navBar";
import ExpenseSummary from "@/components/expenseSummary/summary";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { endOfWeek, startOfWeek } from "date-fns";

// Mock expense data (replace with actual data source)
const mockExpenseData = mockData;

// Category colors
const CATEGORY_COLORS = {
  food: "#FF6384",
  shopping: "#36A2EB",
  travelling: "#FFCE56",
  entertainment: "#4BC0C0",
};

const ExpenseDashboard = () => {
  // const [timeframe, setTimeframe] = useState("weekly");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 }); // Saturday
  setDateRange({from: startOfCurrentWeek,
    to: endOfCurrentWeek,})

  }, [])

  // Filter expense data based on selected date range
  const filteredExpenseData = useMemo(() => {
    console.log('da', dateRange)
    if (!dateRange || !dateRange.from || !dateRange.to) return [];

    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    return mockExpenseData?.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }, [dateRange]);

  // Calculate total expenses for each category
  const categoryTotals = useMemo(() => {
    const totals = { food: 0, shopping: 0, travelling: 0, entertainment: 0 };
    filteredExpenseData.forEach((entry) => {
      Object.keys(totals).forEach((category) => {
        totals[category] += entry[category] || 0;
      });
    });
    return totals;
  }, [filteredExpenseData]);

  // Calculate total expenses
  const totalExpenses = useMemo(
    () => Object.values(categoryTotals).reduce((sum, value) => sum + value, 0),
    [categoryTotals]
  );

  // Calculate average spending
  const averageSpending = useMemo(
    () => totalExpenses / (filteredExpenseData.length || 1),
    [totalExpenses, filteredExpenseData]
  );

  // Calculate budget remaining
  const budgetRemaining = 10068.11 - totalExpenses;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto p-6">
        <ExpenseSummary
          totalExpenses={totalExpenses}
          averageSpending={averageSpending}
          budgetRemaining={budgetRemaining}
          timeFrame={"daily"}
        />

        {/* Category Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(categoryTotals).map(([category, total]) => (
            <Card key={category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold"
                  style={{ color: CATEGORY_COLORS[category] }}
                >
                  ${total.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Expense Categories Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Trends</CardTitle>
            <div className="flex items-center space-x-2">
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
                formatDate={(date) => date.toLocaleDateString()}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(CATEGORY_COLORS).map((category) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={CATEGORY_COLORS[category]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseDashboard;
