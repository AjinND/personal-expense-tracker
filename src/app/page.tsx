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
import CategoryCards from "@/components/categories/categoryCards";

// Mock expense data (replace with actual data source)
const mockExpenseData = mockData;

// Types defined
type ExpenseEntry = {
  date: string;
  food: number;
  shopping: number;
  travelling: number;
  entertainment: number;
};

// Category colors
const CATEGORY_COLORS: { [key: string]: string } = {
  food: "#FF6384",
  shopping: "#36A2EB",
  travelling: "#FFCE56",
  entertainment: "#4BC0C0",
};

const ExpenseDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 });
    setDateRange({ from: startOfCurrentWeek, to: endOfCurrentWeek });
  }, []);

  // Filter expense data based on selected date range
  const filteredExpenseData = useMemo(() => {
    // console.log("da", dateRange);
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
    const totals: Record<keyof Omit<ExpenseEntry, "date">, number> = {
      food: 0,
      shopping: 0,
      travelling: 0,
      entertainment: 0,
    };

    filteredExpenseData.forEach((entry: ExpenseEntry) => {
      (Object.keys(totals) as Array<keyof typeof totals>).forEach(
        (category) => {
          totals[category] += entry[category];
        }
      );
    });

    return totals;
  }, [filteredExpenseData]);

  // Calculate total expenses
  const totalExpenses = useMemo(
    () => Object.values(categoryTotals).reduce((sum, value) => sum + value, 0),
    [categoryTotals]
  );

  const numberOfDaysBetweenDates = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) return 0;

    const startDate = new Date(dateRange?.from);
    const endDate = new Date(dateRange?.to);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = timeDiff / (1000 * 60 * 60 * 24);

    return Math.ceil(days);
  }, [dateRange]);

  // Calculate average spending
  const averageSpending = useMemo(() => {
    const average = totalExpenses / (numberOfDaysBetweenDates || 1);
    // console.log(" hgsjc ", numberOfDaysBetweenDates);
    return average;
  }, [totalExpenses, filteredExpenseData]);

  // Calculate budget remaining
  const [totalBalance, setTotalBalance] = useState(0.0);
  const remainingBudget = useMemo(
    () => totalBalance - totalExpenses,
    [totalBalance, totalExpenses]
  );

  const getRemainingBudget = (newBudget: number) => {
    setTotalBalance(newBudget);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto p-6">
        <ExpenseSummary
          totalExpenses={totalExpenses}
          averageSpending={averageSpending}
          budgetRemaining={getRemainingBudget}
          remainingBudget={remainingBudget}
          timeFrame={"day"}
        />

        {/* Category Summary Cards */}
        <CategoryCards
          categoryTotals={categoryTotals}
          categoryColors={CATEGORY_COLORS}
        />

        {/* Expense Categories Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Trends</CardTitle>
            <div className="flex items-center space-x-2">
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
                formatDate={(date: { toLocaleDateString: () => string }) =>
                  date.toLocaleDateString()
                }
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
