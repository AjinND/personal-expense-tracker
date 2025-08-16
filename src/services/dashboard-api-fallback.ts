// src/services/dashboard-api-fallback.ts
/**
 * Fallback service for dashboard API when backend is not ready
 * This provides mock data to prevent frontend crashes during development
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

  async getExpenses(): Promise<ExpenseEntry[]> {
    console.warn('Using fallback dashboard API - expenses');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.expenses];
  }

  async addExpense(
    category: ExpenseCategory,
    amount: number,
    date: string
  ): Promise<ExpenseEntry> {
    console.warn('Using fallback dashboard API - add expense');
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
      return newExpense;
    }
  }

  async updateExpense(
    expenseId: string,
    updates: Partial<Pick<ExpenseEntry, 'food' | 'shopping' | 'travelling' | 'entertainment'>>
  ): Promise<ExpenseEntry> {
    console.warn('Using fallback dashboard API - update expense');
    await new Promise(resolve => setTimeout(resolve, 300));

    const expenseIndex = this.expenses.findIndex(exp => exp._id === expenseId);
    if (expenseIndex === -1) {
      throw new Error('Expense not found');
    }

    const updatedExpense = {
      ...this.expenses[expenseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.expenses[expenseIndex] = updatedExpense;
    return updatedExpense;
  }

  async deleteExpense(expenseId: string): Promise<void> {
    console.warn('Using fallback dashboard API - delete expense');
    await new Promise(resolve => setTimeout(resolve, 300));

    const expenseIndex = this.expenses.findIndex(exp => exp._id === expenseId);
    if (expenseIndex === -1) {
      throw new Error('Expense not found');
    }

    this.expenses.splice(expenseIndex, 1);
  }

  async getMonthlyBudget(): Promise<number> {
    console.warn('Using fallback dashboard API - get budget');
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockBudget;
  }

  async updateMonthlyBudget(budget: number): Promise<number> {
    console.warn('Using fallback dashboard API - update budget');
    await new Promise(resolve => setTimeout(resolve, 300));
    mockBudget = budget;
    return mockBudget;
  }

  async validateSession(): Promise<{ valid: boolean; user?: any }> {
    console.warn('Using fallback dashboard API - validate session');
    return {
      valid: true,
      user: {
        id: 'mock-user',
        name: 'Mock User',
        email: 'mock@example.com'
      }
    };
  }

  async batchAddExpenses(expenses: any[]): Promise<ExpenseEntry[]> {
    console.warn('Using fallback dashboard API - batch add');
    const results: ExpenseEntry[] = [];
    
    for (const expense of expenses) {
      try {
        const result = await this.addExpense(expense.category, expense.amount, expense.date);
        results.push(result);
      } catch (error) {
        console.warn('Failed to add expense in batch:', error);
      }
    }
    
    return results;
  }

  async healthCheck(): Promise<boolean> {
    return false; // Always return false for fallback
  }
}

// Create fallback instance
export const dashboardApiFallback = new DashboardApiFallback();