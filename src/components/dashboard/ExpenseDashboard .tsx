// src/components/dashboard/ExpenseDashboard.tsx
"use client";

import React, { useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Utensils, ShoppingBag, Plane, Music, RefreshCw, Calculator, BookOpen, FileText, TrendingUp, DollarSign, Calendar, User, LogOut, Settings, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseSummary } from './ExpenseSummary';
import { CategoryCards } from './CategoryCards';
import { DashboardCharts } from './DashboardCharts';
import { RecentTransactions } from './RecentTransactions';
import { DashboardLayoutConfig, useDashboardConfig } from './DashboardLayoutConfig';
import { User as UserType } from '@/types/auth';
import { cn } from '@/lib/utils';
import { 
  calculateMonthlyChange, 
  getTopCategory, 
  getSpendingInsights,
  sanitizeExpenseData 
} from '@/lib/dashboard-analytics';
import { useDashboard } from '@/contexts/DashboardContext';

interface ExpenseDashboardProps {
  user: UserType;
  onLogout: () => void;
  className?: string;
}

// Map category names to icons
const categoryIcons = {
  food: Utensils,
  shopping: ShoppingBag,
  travelling: Plane,
  entertainment: Music,
};

export const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({
  user,
  onLogout,
  className
}) => {
  const { config, updateConfig } = useDashboardConfig();
  
  const {
    expenseData,
    loading,
    error,
    refreshing,
    totalBalance,
    metrics,
    refreshData,
    addExpense,
    updateBudget,
    retryOperation,
    dateRange,
    setDateRange,
  } = useDashboard();

  // Sanitize expense data to remove any mock/hardcoded values
  const cleanExpenseData = useMemo(() => 
    sanitizeExpenseData(expenseData), [expenseData]
  );

  // Calculate real metrics from actual data
  const calculatedMetrics = useMemo(() => {
    const monthlyChange = calculateMonthlyChange(cleanExpenseData);
    const topCategory = getTopCategory(metrics.categoryTotals);
    const insightsResult = getSpendingInsights(cleanExpenseData, totalBalance, metrics.categoryTotals);
    
    return {
      monthlyChange,
      topCategory: {
        ...topCategory,
        icon: categoryIcons[topCategory.category]
      },
      insights: insightsResult.insights
    };
  }, [cleanExpenseData, metrics.categoryTotals, totalBalance]);

  // Show loading state for the entire dashboard with retro styling
  if (loading && !cleanExpenseData.length) {
    return (
      <div className={cn("dashboard-page-bg min-h-screen flex items-center justify-center", className)}>
        <div className="ledger-book p-12 max-w-md mx-4">
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="retro-category-icon">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
              <div className="paper-clip"></div>
            </div>
            <div className="space-y-2">
              <h2 className="typewriter-text text-xl font-bold text-ink-black tracking-wide">
                LOADING LEDGER...
              </h2>
              <p className="handwritten-note text-sm">
                "Calculating your financial records..."
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("dashboard-page-bg min-h-screen", className)}>
      {/* Subtle Retro Office Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {/* Coffee mug - more subtle */}
        <div className="absolute bottom-10 left-10 w-12 h-15 hidden lg:block desk-decoration">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm" style={{ background: 'radial-gradient(circle at 30% 30%, #FFFFFF, #F5F5F5)' }}>
            <div className="absolute inset-2 bg-amber-900 rounded-full opacity-80" style={{ background: 'radial-gradient(circle at 50% 50%, #6F4E37, #3E2723)' }}></div>
          </div>
          <div className="absolute top-4 right-0 w-4 h-8 bg-white opacity-80" style={{ background: 'linear-gradient(to right, #F5F5F5, #FFFFFF, #F5F5F5)', borderRadius: '0 10px 10px 0', boxShadow: '1px 0 3px rgba(0,0,0,0.1)' }}></div>
        </div>
        
        {/* Stack of papers - smaller and more subtle */}
        <div className="absolute bottom-20 right-20 hidden md:block desk-decoration">
          <div className="relative transform rotate-6 scale-75">
            <div className="absolute w-24 h-28 bg-gray-100 shadow-sm transform rotate-3 translate-x-1 translate-y-1 opacity-60"></div>
            <div className="absolute w-24 h-28 bg-gray-50 shadow-sm transform rotate-1 opacity-70"></div>
            <div className="w-24 h-28 bg-white shadow-sm border border-gray-200 opacity-80"></div>
          </div>
        </div>
        
        {/* Pencil - smaller and more subtle */}
        <div className="absolute top-32 right-10 hidden xl:block desk-decoration scale-75">
          <div className="w-2 h-32 bg-yellow-400 transform rotate-45 shadow-sm opacity-70" style={{ background: 'linear-gradient(90deg, #FDD835, #F57F17)' }}>
            <div className="absolute top-0 w-full h-6 bg-pink-300 rounded-t opacity-80"></div>
            <div className="absolute bottom-0 w-full h-4 bg-gray-700 opacity-80" style={{ clipPath: 'polygon(50% 100%, 0 80%, 100% 80%)' }}></div>
          </div>
        </div>

        {/* Calculator - positioned on desk */}
        <div className="absolute bottom-40 left-40 hidden lg:block desk-decoration">
          <div className="calculator-device transform rotate-6 scale-50">
            <div className="w-32 h-40 bg-gray-200 rounded shadow-lg">
              <div className="p-2">
                <div className="h-8 bg-gray-800 mb-2 flex items-center justify-end px-2 text-green-400 font-mono text-xs">
                  {metrics.totalExpenses.toFixed(2)}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
                    <div key={btn} className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-white text-xs">
                      {btn}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper with Overlay */}
      <div className="dashboard-content-wrapper">
        {/* Main Content Container */}
        <div className="relative z-10">
          {/* Retro Header */}
          <header className="accounting-header px-6 py-4 sticky top-0 z-20 -mx-[20px] -mt-[20px] mb-6 backdrop-blur-sm">
            <div className="absolute top-2 right-2 transform rotate-12 opacity-30">
              <div className="circular-stamp scale-75">
                <div className="stamp-outer-ring">
                  <div className="stamp-inner-content">
                    <div className="stamp-text-top">CERTIFIED</div>
                    <div className="stamp-center-icon">★</div>
                    <div className="stamp-text-bottom">1985</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo/Title Area */}
              <div className="flex items-center space-x-4">
                <div className="retro-category-icon">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="typewriter-text text-2xl font-bold tracking-wider">
                    EXPENSE LEDGER
                  </h1>
                  <p className="handwritten-note text-sm">
                    Personal Accounting System - Est. 1985
                  </p>
                </div>
              </div>

              {/* User Info & Actions */}
              <div className="flex items-center space-x-6">
                {/* Current Date - Retro Style */}
                <div className="hidden md:flex items-center space-x-2 calculator-printout px-3 py-2">
                  <Calendar className="w-4 h-4" />
                  <span className="typewriter-text text-sm">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }).toUpperCase()}
                  </span>
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-3 calculator-printout px-4 py-2">
                  <User className="w-5 h-5" />
                  <div className="hidden sm:block">
                    <p className="typewriter-text text-sm font-medium">
                      {user.name.toUpperCase()}
                    </p>
                    <p className="text-xs opacity-75">
                      AUTHORIZED USER
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="rubber-stamp-btn p-2"
                    title="Refresh Data"
                  >
                    <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                  </Button>
                  <Button
                    onClick={onLogout}
                    className="rubber-stamp-btn p-2"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Error Alert with Retro Styling */}
            {error && (
              <div className="ledger-book p-6 border-l-4 border-typewriter-red">
                <Alert variant="destructive" className="bg-transparent border-0">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="typewriter-text">
                    <strong>SYSTEM ERROR:</strong> {error}
                    <Button
                      onClick={retryOperation}
                      className="ml-4 rubber-stamp-btn text-xs px-3 py-1"
                    >
                      RETRY
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Insights Section with Retro Styling */}
            {calculatedMetrics.insights.length > 0 && (
              <div className="space-y-3">
                <h2 className="typewriter-text text-lg font-bold tracking-wide flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  FINANCIAL INSIGHTS
                </h2>
                {calculatedMetrics.insights.map((insight, index) => (
                  <Alert
                    key={index}
                    variant={insight.type === 'error' ? 'destructive' : 'default'}
                    className={cn(
                      "calculator-printout border-l-4 relative",
                      insight.type === 'success' && "border-l-green-600 bg-green-50",
                      insight.type === 'warning' && "border-l-yellow-600 bg-yellow-50",
                      insight.type === 'info' && "border-l-blue-600 bg-blue-50"
                    )}
                  >
                    <div className="absolute -top-2 -right-2 transform rotate-12">
                      <div className="text-red-600 font-bold text-xs border-2 border-red-600 px-2 py-1 rounded bg-white">
                        NOTED
                      </div>
                    </div>
                    <AlertDescription className="typewriter-text">
                      <span className="font-bold">{insight.title.toUpperCase()}:</span> {insight.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Financial Overview - Keep your existing ExpenseSummary component */}
            {config.showQuickStats && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="typewriter-text text-xl font-bold tracking-wide flex items-center">
                    <Calculator className="w-6 h-6 mr-3" />
                    FINANCIAL SUMMARY
                  </h2>
                  <span className="handwritten-note text-sm">
                    "Current period overview"
                  </span>
                </div>
                
                <div className="ledger-book ledger-lines p-8">
                  <div className="paper-clip"></div>
                  <ExpenseSummary
                    metrics={metrics}
                    totalBalance={totalBalance}
                    onBudgetUpdate={updateBudget}
                    loading={refreshing}
                    monthlyChange={calculatedMetrics.monthlyChange}
                    topCategory={calculatedMetrics.topCategory}
                    className="bg-transparent border-0 shadow-none"
                  />
                </div>
              </section>
            )}

            {/* Category Management - Keep your existing CategoryCards component */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="typewriter-text text-xl font-bold tracking-wide flex items-center">
                    <FileText className="w-6 h-6 mr-3" />
                    EXPENSE CATEGORIES
                  </h2>
                  <p className="handwritten-note text-sm mt-1">
                    "Click any category to add an expense"
                  </p>
                </div>
              </div>
              
              <div className="manila-folder p-6">
                <div className="paper-clip"></div>
                <CategoryCards
                  categoryTotals={metrics.categoryTotals}
                  onAddExpense={addExpense}
                  loading={refreshing}
                />
              </div>
            </section>

            {/* Charts Section - Keep your existing DashboardCharts component */}
            {config.showCharts && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="typewriter-text text-xl font-bold tracking-wide flex items-center">
                      <PieChart className="w-6 h-6 mr-3" />
                      ANALYTICS & REPORTS
                    </h2>
                    <p className="handwritten-note text-sm mt-1">
                      "Visual breakdown of your spending patterns"
                    </p>
                  </div>
                </div>
                
                <div className="graph-paper p-6 rounded-lg">
                  <DashboardCharts
                    expenses={expenseData}
                    categoryTotals={metrics.categoryTotals}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    loading={refreshing}
                    className="bg-transparent"
                  />
                </div>
              </section>
            )}

            {/* Recent Transactions - Keep your existing RecentTransactions component */}
            {config.showRecentTransactions && expenseData.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="typewriter-text text-xl font-bold tracking-wide flex items-center">
                      <BookOpen className="w-6 h-6 mr-3" />
                      RECENT ACTIVITY
                    </h2>
                    <p className="handwritten-note text-sm mt-1">
                      "Your latest transactions"
                    </p>
                  </div>
                </div>
                
                <div className="ledger-book p-6">
                  <div className="paper-clip"></div>
                  <div className="ledger-table">
                    <RecentTransactions
                      expenses={expenseData}
                      loading={refreshing}
                      limit={config.compactMode ? 5 : 8}
                      className="bg-transparent border-0"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Empty State - Keep your existing logic */}
            {!loading && expenseData.length === 0 && (
              <div className="text-center py-20 space-y-8">
                <div className="ledger-book mx-auto max-w-md p-12">
                  <div className="paper-clip"></div>
                  <div className="space-y-6">
                    <div className="retro-category-icon mx-auto w-20 h-20 flex items-center justify-center">
                      <Utensils className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="typewriter-text text-xl font-bold tracking-wide">
                        Welcome to Expense Tracker!
                      </h3>
                      <p className="handwritten-note">
                        "Ready to start your financial record keeping"
                      </p>
                      <p className="typewriter-text text-sm max-w-md mx-auto">
                        Start tracking your expenses by clicking on any category above to add your first expense.
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4 pt-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span>Food</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Shopping</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Travel</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Entertainment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Keep your existing Layout Configuration component - Hidden but functional */}
            <div className="hidden">
              <DashboardLayoutConfig
                config={config}
                onConfigChange={updateConfig}
              />
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-16 border-t-2 border-rubber-stamp bg-paper-aged -mx-[20px] -mb-[20px] px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-6 typewriter-text text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>SECURE</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>LOCKED</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span>CERTIFIED</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="typewriter-text text-xs">
                    All financial records are stored in compliance with standard accounting practices.
                  </p>
                  <div className="inline-block mt-2 px-3 py-1 border border-gray-500 typewriter-text text-xs transform rotate-1">
                    © 1985 EXPENSE LEDGER CORP.
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDashboard;