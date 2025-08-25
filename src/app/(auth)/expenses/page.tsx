// src/app/(auth)/expenses/page.tsx
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthGuard';
import { CategoryCards } from '@/components/dashboard/CategoryCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Filter,
  X
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ExpenseCategory } from '@/types/dashboard';
import { CATEGORY_COLORS, CATEGORY_NAMES } from '@/constants/dashboard';
import { formatCurrency } from '@/lib/dashboard-utils';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useDashboard } from '@/contexts/DashboardContext';

export default function ExpensesPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const {
    expenseData,
    loading,
    metrics,
    addExpense,
    refreshing,
  } = useDashboard();

  if (!user) return null;

  // Filter expenses based on search and category
  const filteredExpenses = expenseData.filter(expense => {
    const matchesSearch = searchQuery === '' || 
      new Date(expense.date).toLocaleDateString().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || 
      (expense[filterCategory as ExpenseCategory] > 0);
    
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => 
    sum + expense.food + expense.shopping + expense.travelling + expense.entertainment, 0
  );

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your expense data is being prepared for download.",
    });
    // Implement export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Manage and track your daily expenses</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="travelling">Travelling</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchQuery || filterCategory !== 'all') && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {searchQuery}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {filterCategory !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {filterCategory}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilterCategory('all')}
                  />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredExpenses.length}
                </p>
              </div>
              <Tag className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalExpenses)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Section */}
      <CategoryCards
        categoryTotals={metrics.categoryTotals}
        onAddExpense={addExpense}
        loading={refreshing}
      />

      {/* Expense List */}
      <Card>
        <CardContent className="p-0">
          <RecentTransactions
            expenses={filteredExpenses}
            loading={loading || refreshing}
            limit={20}
          />
        </CardContent>
      </Card>
    </div>
  );
}