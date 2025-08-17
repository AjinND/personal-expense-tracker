// src/services/dashboard-api-fallback.ts
/**
 * Fallback service for dashboard API when backend is not ready
 * This provides mock data to prevent frontend crashes during development
 * ONLY USED IN DEVELOPMENT ENVIRONMENT WHEN REAL API FAILS
 */

import { ExpenseEntry, ExpenseCategory } from '@/types/dashboard';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/dashboard';

// Mock data for development
const mockExpenses: ExpenseEntry[] = [
  {
    _id: 'mock-1',
    date: '2024-12-10',
    food: 45,
    shopping: 25,
    travelling: 30,
    entertainment: 15,
    user: 'mock-user',
    createdAt: '2024-12-10T08:00:00Z',
    updatedAt: '2024-12-10T08:00:00Z'
  },
  {
    _id: 'mock-2',
    date: '2024-12-11',
    food: 60,
    shopping: 35,
    travelling: 20,
    entertainment: 25,
    user: 'mock-user',
    createdAt: '2024-12-11T08:00:00Z',
    updatedAt: '2024-12-11T08:00:00Z'
  },
  {
    _id: 'mock-3',
    date: '2024-12-12',
    food: 55,
    shopping: 40,
    travelling: 35,
    entertainment: 20,
    user: 'mock-user',
    createdAt: '2024-12-12T08:00:00Z',
    updatedAt: '2024-12-12T08:00:00Z'
  }
];

let mockBudget = 2000;

export class DashboardApiFallback {
  private expenses: ExpenseEntry[] = [...mockExpenses];
  private isDevelopment = process.env.NODE_ENV === 'development';

  private logFallbackUsage(operation: string) {
    if (this.isDevelopment) {
      console.log(`🔧 [DEVELOPMENT FALLBACK] Using mock data for ${operation}`);
    }
  }

  async getExpenses(): Promise<ExpenseEntry[]> {
    this.logFallbackUsage('getExpenses');
    
    // Simulate API delay for realistic development experience
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.expenses];
  }

  async addExpense(
    category: ExpenseCategory,
    amount: number,
    date: string
  ): Promise<ExpenseEntry> {
    this.logFallbackUsage('addExpense');
    await new Promise(resolve => setTimeout(resolve, 300));

    const existingExpenseIndex = this.expenses.findIndex(exp => exp.date === date);
    
    if (existingExpenseIndex !== -1) {
      // Update existing expense
      const existingExpense = this.expenses[existingExpenseIndex];
      const updatedExpense = {
        ...existingExpense,
        [category]: existingExpense[category] + amount,
        updatedAt: new Date().toISOString()
      };
      this.expenses[existingExpenseIndex] = updatedExpense;
      console.log(`✅ [MOCK] Updated expense for ${date}: +$${amount} to ${category}`);
      return updatedExpense;
    } else {
      // Create new expense
      const newExpense: ExpenseEntry = {
        _id: `mock-${Date.now()}`,
        date,
        food: 0,
        shopping: 0,
        travelling: 0,
        entertainment: 0,
        [category]: amount,
        user: 'mock-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.expenses.push(newExpense);
      console.log(`✅ [MOCK] Created new expense for ${date}: $${amount} in ${category}`);
      return newExpense;
    }
  }

  async updateExpense(
    expenseId: string,
    updates: Partial<Pick<ExpenseEntry, 'food' | 'shopping' | 'travelling' | 'entertainment'>>
  ): Promise<ExpenseEntry> {
    this.logFallbackUsage('updateExpense');
    await new Promise(resolve => setTimeout(resolve, 300));

    const expenseIndex = this.expenses.findIndex(exp => exp._id === expenseId);
    if (expenseIndex === -1) {
      throw new Error(`Mock expense with ID ${expenseId} not found`);
    }

    const updatedExpense = {
      ...this.expenses[expenseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.expenses[expenseIndex] = updatedExpense;
    console.log(`✅ [MOCK] Updated expense ${expenseId}:`, updates);
    return updatedExpense;
  }

  async deleteExpense(expenseId: string): Promise<void> {
    this.logFallbackUsage('deleteExpense');
    await new Promise(resolve => setTimeout(resolve, 300));

    const expenseIndex = this.expenses.findIndex(exp => exp._id === expenseId);
    if (expenseIndex === -1) {
      throw new Error(`Mock expense with ID ${expenseId} not found`);
    }

    this.expenses.splice(expenseIndex, 1);
    console.log(`✅ [MOCK] Deleted expense ${expenseId}`);
  }

  async getMonthlyBudget(): Promise<number> {
    this.logFallbackUsage('getMonthlyBudget');
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`💰 [MOCK] Current budget: $${mockBudget}`);
    return mockBudget;
  }

  async updateMonthlyBudget(budget: number): Promise<number> {
    this.logFallbackUsage('updateMonthlyBudget');
    await new Promise(resolve => setTimeout(resolve, 300));
    const oldBudget = mockBudget;
    mockBudget = budget;
    console.log(`💰 [MOCK] Budget updated: $${oldBudget} → $${mockBudget}`);
    return mockBudget;
  }

  async validateSession(): Promise<{ valid: boolean; user?: any }> {
    this.logFallbackUsage('validateSession');
    return {
      valid: true,
      user: {
        id: 'mock-user',
        name: 'Mock User (Development)',
        email: 'mock@example.com'
      }
    };
  }

  async batchAddExpenses(expenses: any[]): Promise<ExpenseEntry[]> {
    this.logFallbackUsage('batchAddExpenses');
    const results: ExpenseEntry[] = [];
    
    console.log(`📦 [MOCK] Processing batch of ${expenses.length} expenses`);
    
    for (const expense of expenses) {
      try {
        const result = await this.addExpense(expense.category, expense.amount, expense.date);
        results.push(result);
      } catch (error) {
        console.warn(`⚠️ [MOCK] Failed to add expense in batch:`, error);
      }
    }
    
    console.log(`✅ [MOCK] Batch processing complete. Added ${results.length}/${expenses.length} expenses`);
    return results;
  }

  async healthCheck(): Promise<boolean> {
    // Fallback health check always returns false since it's not the real API
    return false;
  }

  // Reset mock data to initial state
  resetMockData(): void {
    this.expenses = [...mockExpenses];
    mockBudget = 2000;
    if (this.isDevelopment) {
      console.log('🔄 [MOCK] Reset all mock data to initial state');
    }
  }

  // Get current mock state for debugging
  getMockState(): { expenses: ExpenseEntry[]; budget: number } {
    return {
      expenses: [...this.expenses],
      budget: mockBudget
    };
  }
}

// Create fallback instance
export const dashboardApiFallback = new DashboardApiFallback();