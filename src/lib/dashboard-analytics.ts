// src/lib/dashboard-analytics.ts
import { ExpenseEntry, ExpenseCategory } from '@/types/dashboard';

/**
 * Calculate monthly change percentage from expense data
 */
export function calculateMonthlyChange(expenses: ExpenseEntry[]): number {
  if (expenses.length < 2) return 0;
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Calculate previous month
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  // Get current month expenses
  const currentMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => 
      sum + expense.food + expense.shopping + expense.travelling + expense.entertainment, 0
    );
  
  // Get last month expenses
  const lastMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === lastMonth && 
             expenseDate.getFullYear() === lastMonthYear;
    })
    .reduce((sum, expense) => 
      sum + expense.food + expense.shopping + expense.travelling + expense.entertainment, 0
    );
  
  // Calculate percentage change
  if (lastMonthExpenses === 0) {
    return currentMonthExpenses > 0 ? 100 : 0;
  }
  
  return ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
}

/**
 * Get top spending category with icon
 */
export function getTopCategory(categoryTotals: Record<ExpenseCategory, number>): {
  name: string;
  amount: number;
  category: ExpenseCategory;
} {
  const categories = Object.entries(categoryTotals) as [ExpenseCategory, number][];
  
  const topCategory = categories.reduce((max, [category, amount]) => 
    amount > max.amount ? { name: category, amount, category } : max,
    { name: 'food' as ExpenseCategory, amount: 0, category: 'food' as ExpenseCategory }
  );
  
  return topCategory;
}

/**
 * Calculate spending velocity (how fast user is spending compared to budget)
 */
export function calculateSpendingVelocity(
  totalExpenses: number, 
  monthlyBudget: number, 
  daysIntoMonth: number,
  daysInMonth: number
): {
  velocity: number;
  status: 'under' | 'on-track' | 'over';
  projectedTotal: number;
} {
  const expectedSpending = (monthlyBudget * daysIntoMonth) / daysInMonth;
  const velocity = expectedSpending > 0 ? (totalExpenses / expectedSpending) : 0;
  const projectedTotal = daysIntoMonth > 0 ? (totalExpenses / daysIntoMonth) * daysInMonth : 0;
  
  let status: 'under' | 'on-track' | 'over';
  if (velocity < 0.9) {
    status = 'under';
  } else if (velocity <= 1.1) {
    status = 'on-track';
  } else {
    status = 'over';
  }
  
  return { velocity, status, projectedTotal };
}

/**
 * Get insights based on spending patterns
 */
export function getSpendingInsights(
  expenses: ExpenseEntry[],
  monthlyBudget: number,
  categoryTotals: Record<ExpenseCategory, number>
): {
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
  }>;
} {
  const insights: Array<{
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
  }> = [];
  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  const currentDate = new Date();
  const daysIntoMonth = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // Budget insights
  const budgetUsed = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  const monthProgress = (daysIntoMonth / daysInMonth) * 100;
  
  if (budgetUsed > 100) {
    insights.push({
      type: 'error',
      title: 'Budget Exceeded',
      message: `You've spent ${(budgetUsed - 100).toFixed(1)}% more than your monthly budget.`
    });
  } else if (budgetUsed > 80) {
    insights.push({
      type: 'warning',
      title: 'Approaching Budget Limit',
      message: `You've used ${budgetUsed.toFixed(1)}% of your monthly budget.`
    });
  } else if (budgetUsed < monthProgress - 20) {
    insights.push({
      type: 'success',
      title: 'Great Spending Control',
      message: `You're spending well below your budget pace. Keep it up!`
    });
  }
  
  // Category insights
  const topCategory = getTopCategory(categoryTotals);
  const categoryPercentage = totalExpenses > 0 ? (topCategory.amount / totalExpenses) * 100 : 0;
  
  if (categoryPercentage > 50) {
    insights.push({
      type: 'info',
      title: 'Category Concentration',
      message: `${categoryPercentage.toFixed(1)}% of your spending is on ${topCategory.name}. Consider diversifying your expenses.`
    });
  }
  
  // Spending pattern insights
  if (expenses.length >= 7) {
    const recentExpenses = expenses
      .slice(-7)
      .reduce((sum, expense) => sum + expense.food + expense.shopping + expense.travelling + expense.entertainment, 0);
    const weeklyAverage = recentExpenses / 7;
    const monthlyProjection = weeklyAverage * 30;
    
    if (monthlyProjection > monthlyBudget * 1.1) {
      insights.push({
        type: 'warning',
        title: 'High Recent Spending',
        message: `Your recent spending pace suggests you might exceed your budget by month-end.`
      });
    }
  }
  
  return { insights };
}

/**
 * Calculate suggested daily spending based on remaining budget and days
 */
export function calculateSuggestedDailySpend(
  remainingBudget: number,
  remainingDays: number
): number {
  if (remainingDays <= 0 || remainingBudget <= 0) return 0;
  return remainingBudget / remainingDays;
}

/**
 * Get category statistics
 */
export function getCategoryStatistics(
  expenses: ExpenseEntry[],
  categoryTotals: Record<ExpenseCategory, number>
): Record<ExpenseCategory, {
  total: number;
  percentage: number;
  averagePerTransaction: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
}> {
  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  const currentMonth = new Date().getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  
  const stats: Record<ExpenseCategory, any> = {
    food: { total: 0, percentage: 0, averagePerTransaction: 0, transactionCount: 0, trend: 'stable' },
    shopping: { total: 0, percentage: 0, averagePerTransaction: 0, transactionCount: 0, trend: 'stable' },
    travelling: { total: 0, percentage: 0, averagePerTransaction: 0, transactionCount: 0, trend: 'stable' },
    entertainment: { total: 0, percentage: 0, averagePerTransaction: 0, transactionCount: 0, trend: 'stable' }
  };
  
  // Calculate basic stats
  Object.entries(categoryTotals).forEach(([category, amount]) => {
    const cat = category as ExpenseCategory;
    const transactionCount = expenses.filter(expense => expense[cat] > 0).length;
    
    stats[cat] = {
      total: amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      averagePerTransaction: transactionCount > 0 ? amount / transactionCount : 0,
      transactionCount,
      trend: 'stable' as const
    };
  });
  
  // Calculate trends (current month vs last month)
  if (expenses.length > 0) {
    const currentYear = new Date().getFullYear();
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    Object.keys(stats).forEach(category => {
      const cat = category as ExpenseCategory;
      
      const currentMonthTotal = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense[cat], 0);
      
      const lastMonthTotal = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
        })
        .reduce((sum, expense) => sum + expense[cat], 0);
      
      if (lastMonthTotal === 0) {
        stats[cat].trend = currentMonthTotal > 0 ? 'up' : 'stable';
      } else {
        const change = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        if (change > 10) {
          stats[cat].trend = 'up';
        } else if (change < -10) {
          stats[cat].trend = 'down';
        } else {
          stats[cat].trend = 'stable';
        }
      }
    });
  }
  
  return stats;
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: ExpenseCategory): string {
  const categoryNames: Record<ExpenseCategory, string> = {
    food: 'Food & Dining',
    shopping: 'Shopping',
    travelling: 'Travel',
    entertainment: 'Entertainment'
  };
  
  return categoryNames[category] || category;
}

/**
 * Get budget health status
 */
export function getBudgetHealthStatus(
  totalExpenses: number,
  monthlyBudget: number,
  daysIntoMonth: number,
  daysInMonth: number
): {
  status: 'excellent' | 'good' | 'warning' | 'danger';
  message: string;
  color: string;
} {
  const budgetUsed = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  const monthProgress = (daysIntoMonth / daysInMonth) * 100;
  const expectedSpending = monthProgress;
  
  if (budgetUsed > 100) {
    return {
      status: 'danger',
      message: 'Over Budget',
      color: 'text-red-600'
    };
  } else if (budgetUsed > 90) {
    return {
      status: 'warning',
      message: 'Near Limit',
      color: 'text-yellow-600'
    };
  } else if (budgetUsed > expectedSpending + 20) {
    return {
      status: 'warning',
      message: 'Above Pace',
      color: 'text-yellow-600'
    };
  } else if (budgetUsed < expectedSpending - 20) {
    return {
      status: 'excellent',
      message: 'Under Budget',
      color: 'text-green-600'
    };
  } else {
    return {
      status: 'good',
      message: 'On Track',
      color: 'text-blue-600'
    };
  }
}

/**
 * Remove mock/hardcoded values and replace with calculated values
 */
export function sanitizeExpenseData(expenses: ExpenseEntry[]): ExpenseEntry[] {
  // Remove any expenses with mock IDs or unrealistic data
  return expenses.filter(expense => {
    // Filter out mock data
    if (expense._id?.includes('mock') || expense.user === 'mock-user') {
      return false;
    }
    
    // Validate expense data
    const total = expense.food + expense.shopping + expense.travelling + expense.entertainment;
    if (total < 0 || total > 10000) { // Reasonable limits
      return false;
    }
    
    // Validate date
    const expenseDate = new Date(expense.date);
    if (isNaN(expenseDate.getTime())) {
      return false;
    }
    
    return true;
  });
}

/**
 * Calculate realistic monthly budget suggestions
 */
export function suggestMonthlyBudget(expenses: ExpenseEntry[]): {
  conservative: number;
  moderate: number;
  generous: number;
} {
  if (expenses.length === 0) {
    return {
      conservative: 1000,
      moderate: 1500,
      generous: 2000
    };
  }
  
  // Calculate average monthly spending from historical data
  const monthlyTotals: number[] = [];
  const expensesByMonth = new Map<string, number>();
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const total = expense.food + expense.shopping + expense.travelling + expense.entertainment;
    
    expensesByMonth.set(monthKey, (expensesByMonth.get(monthKey) || 0) + total);
  });
  
  const avgMonthlySpending = Array.from(expensesByMonth.values())
    .reduce((sum, total) => sum + total, 0) / expensesByMonth.size;
  
  return {
    conservative: Math.round(avgMonthlySpending * 0.9),
    moderate: Math.round(avgMonthlySpending * 1.1),
    generous: Math.round(avgMonthlySpending * 1.3)
  };
}