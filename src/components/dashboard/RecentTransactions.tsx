// src/components/dashboard/RecentTransactions.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Utensils,
  Plane,
  Music
} from 'lucide-react';
import Link from 'next/link';
import { ExpenseEntry, ExpenseCategory, RecentTransactionsProps } from '@/types/dashboard';
import { formatCurrency } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';

const getCategoryIcon = (category: ExpenseCategory) => {
  switch (category) {
    case 'food':
      return Utensils;
    case 'shopping':
      return ShoppingBag;
    case 'travelling':
      return Plane;
    case 'entertainment':
      return Music;
    default:
      return ShoppingBag;
  }
};

const getCategoryColor = (category: ExpenseCategory) => {
  switch (category) {
    case 'food':
      return 'text-red-600 bg-red-50';
    case 'shopping':
      return 'text-blue-600 bg-blue-50';
    case 'travelling':
      return 'text-green-600 bg-green-50';
    case 'entertainment':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

// Helper function to get transactions from expense data
const getTransactionsFromExpenses = (expenses: ExpenseEntry[]): Array<{
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
}> => {
  const transactions: Array<{
    id: string;
    date: string;
    category: ExpenseCategory;
    amount: number;
  }> = [];

  expenses.forEach((expense) => {
    const categories: ExpenseCategory[] = ['food', 'shopping', 'travelling', 'entertainment'];
    
    categories.forEach((category) => {
      if (expense[category] > 0) {
        transactions.push({
          id: `${expense._id || expense.date}-${category}`,
          date: expense.date,
          category,
          amount: expense[category]
        });
      }
    });
  });

  // Sort by date (most recent first)
  return transactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

const TransactionSkeleton = () => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center space-x-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div>
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="h-5 w-16" />
  </div>
);

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  expenses,
  loading = false,
  limit = 5,
  className
}) => {
  const transactions = getTransactionsFromExpenses(expenses);
  const recentTransactions = transactions.slice(0, limit);
  const hasTransactions = recentTransactions.length > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        {hasTransactions && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/expenses" className="flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-1">
            {[...Array(limit)].map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        ) : hasTransactions ? (
          <div className="space-y-1">
            {recentTransactions.map((transaction) => {
              const Icon = getCategoryIcon(transaction.category);
              const colorClass = getCategoryColor(transaction.category);
              const isToday = new Date(transaction.date).toDateString() === new Date().toDateString();
              const isYesterday = new Date(transaction.date).toDateString() === 
                new Date(Date.now() - 86400000).toDateString();

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn("p-2 rounded-full", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {transaction.category}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isToday ? 'Today' : 
                         isYesterday ? 'Yesterday' : 
                         new Date(transaction.date).toLocaleDateString('en-US', {
                           month: 'short',
                           day: 'numeric',
                           year: new Date(transaction.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                         })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No recent transactions</p>
            <p className="text-sm text-gray-400 mt-1">
              Start tracking your expenses to see them here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;