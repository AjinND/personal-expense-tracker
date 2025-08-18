// src/app/expenses/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CategoryCards } from '@/components/dashboard/CategoryCards';
import { useDashboard } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, ExpenseCategory } from '@/types/dashboard';
import { CATEGORY_COLORS, CATEGORY_NAMES } from '@/constants/dashboard';
import { formatCurrency } from '@/lib/dashboard-utils';

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <DashboardLayout user={user || { name: '', email: '' }} onLogout={handleLogout}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <ExpensesPageContent user={user} onLogout={handleLogout} />;
}

function ExpensesPageContent({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { toast } = useToast();
  
  // Use existing dashboard hook for data
  const {
    expenseData,
    loading,
    error,
    refreshing,
    totalBalance,
    metrics,
    addExpense,
    refreshData,
    retryOperation,
  } = useDashboard({ onLogout });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await refreshData();
        toast({
          title: 'Success',
          description: 'Expense deleted successfully',
        });
      } else {
        throw new Error('Failed to delete expense');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

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

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={onLogout}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600">Manage and track your daily expenses</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48">
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
          </CardContent>
        </Card>

        {/* Summary Cards using existing UI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredExpenses.filter(expense => 
                  new Date(expense.date).getMonth() === new Date().getMonth()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">Expenses recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Active categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Reuse CategoryCards for adding expenses */}
        <CategoryCards
          categoryTotals={metrics.categoryTotals}
          onAddExpense={addExpense}
          loading={refreshing}
        />

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || filterCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start tracking your expenses by adding your first entry'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => {
                  const total = expense.food + expense.shopping + expense.travelling + expense.entertainment;
                  const categories = [
                    { key: 'food', value: expense.food },
                    { key: 'shopping', value: expense.shopping },
                    { key: 'travelling', value: expense.travelling },
                    { key: 'entertainment', value: expense.entertainment },
                  ].filter(cat => cat.value > 0);

                  return (
                    <div key={expense._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(expense.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              {categories.map((cat) => (
                                <Badge 
                                  key={cat.key} 
                                  variant="secondary"
                                  style={{ 
                                    backgroundColor: CATEGORY_COLORS[cat.key as ExpenseCategory] + '20',
                                    color: CATEGORY_COLORS[cat.key as ExpenseCategory]
                                  }}
                                >
                                  {CATEGORY_NAMES[cat.key as ExpenseCategory]}: {formatCurrency(cat.value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(total)}</p>
                          <p className="text-sm text-gray-500">{categories.length} categories</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteExpense(expense._id || '')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}