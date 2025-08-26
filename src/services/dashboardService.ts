// src/services/dashboardService.ts
import mongoose from 'mongoose';
import Expense from '@/models/SecureExpense';
import User from '@/models/SecureUser';
import dbConnect from '@/lib/db';
import rateLimit from '@/lib/rate-limit';
import {
  IExpense,
  ExpenseData,
  ExpenseCategory,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  BudgetRequest,
  ExpenseQueryParams,
  ExpenseStats,
  DashboardResponse,
  VALIDATION_CONSTANTS,
  DashboardErrorCodes
} from '@/types/dashboard-backend';
import { DashboardError } from '@/types/dashboard';

export class DashboardService {
  private limiter: ReturnType<typeof rateLimit>;

  constructor() {
    this.limiter = rateLimit({
      interval: 60 * 1000, // 1 minute
      uniqueTokenPerInterval: 500,
    });
  }

  async checkRateLimit(identifier: string, maxRequests: number = 60): Promise<void> {
    try {
      await this.limiter.check(maxRequests, identifier);
    } catch (error: any) {
      throw new DashboardError(
        'Too many requests. Please try again later.',
        DashboardErrorCodes.RATE_LIMIT_EXCEEDED,
        429
      );
    }
  }

  private validateDate(date: string): void {
    if (!VALIDATION_CONSTANTS.DATE_FORMAT.test(date)) {
      throw new DashboardError(
        'Invalid date format. Use YYYY-MM-DD',
        DashboardErrorCodes.INVALID_DATE,
        400
      );
    }

    const expenseDate = new Date(date);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (expenseDate > today) {
      throw new DashboardError(
        'Expense date cannot be in the future',
        DashboardErrorCodes.INVALID_DATE,
        400
      );
    }

    if (expenseDate < oneYearAgo) {
      throw new DashboardError(
        'Expense date cannot be more than 1 year ago',
        DashboardErrorCodes.INVALID_DATE,
        400
      );
    }
  }

  private validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < VALIDATION_CONSTANTS.MIN_AMOUNT) {
      throw new DashboardError(
        `Amount must be at least ${VALIDATION_CONSTANTS.MIN_AMOUNT}`,
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    if (amount > VALIDATION_CONSTANTS.MAX_AMOUNT) {
      throw new DashboardError(
        `Amount cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`,
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }
  }

  private validateCategory(category: string): asserts category is ExpenseCategory {
    if (!VALIDATION_CONSTANTS.VALID_CATEGORIES.includes(category as ExpenseCategory)) {
      throw new DashboardError(
        `Invalid category. Must be one of: ${VALIDATION_CONSTANTS.VALID_CATEGORIES.join(', ')}`,
        DashboardErrorCodes.INVALID_CATEGORY,
        400
      );
    }
  }

  private validateUserId(userId: string): void {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new DashboardError(
        'Invalid user ID format',
        DashboardErrorCodes.UNAUTHORIZED_ACCESS,
        401
      );
    }
  }

  async getExpenses(
    userId: string,
    params: ExpenseQueryParams = {},
    clientId: string
  ): Promise<DashboardResponse<ExpenseData[]>> {
    await this.checkRateLimit(clientId, 60);
    await dbConnect();

    try {
      this.validateUserId(userId);

      const {
        startDate,
        endDate,
        limit = VALIDATION_CONSTANTS.DEFAULT_LIMIT,
        offset = 0,
        sortBy = 'date',
        sortOrder = 'desc'
      } = params;

      // Validate date range if provided
      if (startDate) this.validateDate(startDate);
      if (endDate) this.validateDate(endDate);

      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new DashboardError(
          'Start date cannot be after end date',
          DashboardErrorCodes.INVALID_DATE_RANGE,
          400
        );
      }

      // Build query
      const query: any = { user: userId };
      
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        query.date = { $gte: startDate };
      } else if (endDate) {
        query.date = { $lte: endDate };
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const expenses = await Expense.find(query)
        .sort(sort)
        .limit(Math.min(limit, VALIDATION_CONSTANTS.MAX_LIMIT))
        .skip(offset)
        .lean();

      // Get total count for pagination
      const total = await Expense.countDocuments(query);

      // Transform data
      const expenseData: ExpenseData[] = expenses.map(expense => ({
        id: expense._id.toString(),
        date: expense.date,
        food: expense.food,
        shopping: expense.shopping,
        travelling: expense.travelling,
        entertainment: expense.entertainment,
        total: expense.food + expense.shopping + expense.travelling + expense.entertainment,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      }));

      return {
        success: true,
        data: expenseData,
        count: expenseData.length,
        pagination: {
          total,
          page: Math.floor(offset / limit) + 1,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Get expenses error:', error);
      throw new DashboardError(
        'Failed to retrieve expenses',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    }
  }

  async addExpense(
    userId: string,
    request: CreateExpenseRequest,
    clientId: string
  ): Promise<DashboardResponse<ExpenseData>> {
    await this.checkRateLimit(clientId, 30);
    await dbConnect();

    const session = await mongoose.startSession();

    try {
      this.validateUserId(userId);
      this.validateDate(request.date);
      this.validateAmount(request.amount);
      this.validateCategory(request.category);

      return await session.withTransaction(async () => {
        // Find or create expense entry for the date
        let expense = await Expense.findOne({
          user: userId,
          date: request.date
        }).session(session);

        if (expense) {
          // Update existing expense
          const currentAmount = expense[request.category] || 0;
          const newAmount = currentAmount + request.amount;

          // Validate new amount doesn't exceed limits
          if (newAmount > VALIDATION_CONSTANTS.MAX_AMOUNT) {
            throw new DashboardError(
              `Total ${request.category} expense for this date would exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`,
              DashboardErrorCodes.INVALID_AMOUNT,
              400
            );
          }

          expense[request.category] = newAmount;
          await expense.save({ session });
        } else {
          // Create new expense entry
          expense = new Expense({
            date: request.date,
            food: 0,
            shopping: 0,
            travelling: 0,
            entertainment: 0,
            [request.category]: request.amount,
            user: userId,
          });

          await expense.save({ session });

          // Update user's expenses array
          await User.findByIdAndUpdate(
            userId,
            { $addToSet: { expenses: expense._id } },
            { session }
          );
        }

        return {
          success: true,
          data: expense.sanitizeForResponse(),
          message: `Added ${request.amount} to ${request.category}`
        };
      });

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Add expense error:', error);
      throw new DashboardError(
        'Failed to add expense',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    } finally {
      await session.endSession();
    }
  }

  async updateExpense(
    userId: string,
    request: UpdateExpenseRequest,
    clientId: string
  ): Promise<DashboardResponse<ExpenseData>> {
    await this.checkRateLimit(clientId, 20);
    await dbConnect();

    try {
      this.validateUserId(userId);

      if (!mongoose.Types.ObjectId.isValid(request.expenseId)) {
        throw new DashboardError(
          'Invalid expense ID format',
          DashboardErrorCodes.EXPENSE_NOT_FOUND,
          400
        );
      }

      // Validate update amounts
      Object.entries(request.updates).forEach(([category, amount]) => {
        if (amount !== undefined) {
          this.validateCategory(category);
          this.validateAmount(amount);
        }
      });

      const expense = await Expense.findOne({
        _id: request.expenseId,
        user: userId
      });

      if (!expense) {
        throw new DashboardError(
          'Expense not found or access denied',
          DashboardErrorCodes.EXPENSE_NOT_FOUND,
          404
        );
      }

      // Apply updates
      Object.entries(request.updates).forEach(([category, amount]) => {
        if (amount !== undefined && VALIDATION_CONSTANTS.VALID_CATEGORIES.includes(category as ExpenseCategory)) {
          expense[category as ExpenseCategory] = amount;
        }
      });

      await expense.save();

      return {
        success: true,
        data: expense.sanitizeForResponse(),
        message: 'Expense updated successfully'
      };

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Update expense error:', error);
      throw new DashboardError(
        'Failed to update expense',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    }
  }

  async deleteExpense(
    userId: string,
    expenseId: string,
    clientId: string
  ): Promise<DashboardResponse<void>> {
    await this.checkRateLimit(clientId, 10);
    await dbConnect();

    const session = await mongoose.startSession();

    try {
      this.validateUserId(userId);

      if (!mongoose.Types.ObjectId.isValid(expenseId)) {
        throw new DashboardError(
          'Invalid expense ID format',
          DashboardErrorCodes.EXPENSE_NOT_FOUND,
          400
        );
      }

      return await session.withTransaction(async () => {
        const expense = await Expense.findOneAndDelete({
          _id: expenseId,
          user: userId
        }).session(session);

        if (!expense) {
          throw new DashboardError(
            'Expense not found or access denied',
            DashboardErrorCodes.EXPENSE_NOT_FOUND,
            404
          );
        }

        // Remove expense reference from user
        await User.findByIdAndUpdate(
          userId,
          { $pull: { expenses: expenseId } },
          { session }
        );

        return {
          success: true,
          message: 'Expense deleted successfully'
        };
      });

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Delete expense error:', error);
      throw new DashboardError(
        'Failed to delete expense',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    } finally {
      await session.endSession();
    }
  }

  async getExpenseStats(
    userId: string,
    startDate?: string,
    endDate?: string,
    clientId?: string
  ): Promise<DashboardResponse<ExpenseStats>> {
    if (clientId) {
      await this.checkRateLimit(clientId, 30);
    }
    await dbConnect();

    try {
      this.validateUserId(userId);

      if (startDate) this.validateDate(startDate);
      if (endDate) this.validateDate(endDate);

      const stats = await Expense.getExpenseStats(
        userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      const result = stats[0] || {
        totalExpenses: 0,
        totalFood: 0,
        totalShopping: 0,
        totalTravelling: 0,
        totalEntertainment: 0,
        averageDaily: 0,
        daysWithExpenses: 0,
        maxDailyExpense: 0,
        minDailyExpense: 0
      };

      const expenseStats: ExpenseStats = {
        totalExpenses: result.totalExpenses,
        averageDaily: result.averageDaily,
        categoryBreakdown: {
          food: result.totalFood,
          shopping: result.totalShopping,
          travelling: result.totalTravelling,
          entertainment: result.totalEntertainment
        },
        daysWithExpenses: result.daysWithExpenses,
        totalDays: result.daysWithExpenses, // This could be calculated differently if needed
        highestSpendingDay: null, // Could be implemented with additional aggregation
        categoryStats: {
          food: {
            total: result.totalFood,
            average: result.totalFood / (result.daysWithExpenses || 1),
            percentage: result.totalExpenses > 0 ? (result.totalFood / result.totalExpenses) * 100 : 0,
            daysActive: 0 // Would need additional query
          },
          shopping: {
            total: result.totalShopping,
            average: result.totalShopping / (result.daysWithExpenses || 1),
            percentage: result.totalExpenses > 0 ? (result.totalShopping / result.totalExpenses) * 100 : 0,
            daysActive: 0
          },
          travelling: {
            total: result.totalTravelling,
            average: result.totalTravelling / (result.daysWithExpenses || 1),
            percentage: result.totalExpenses > 0 ? (result.totalTravelling / result.totalExpenses) * 100 : 0,
            daysActive: 0
          },
          entertainment: {
            total: result.totalEntertainment,
            average: result.totalEntertainment / (result.daysWithExpenses || 1),
            percentage: result.totalExpenses > 0 ? (result.totalEntertainment / result.totalExpenses) * 100 : 0,
            daysActive: 0
          }
        }
      };

      return {
        success: true,
        stats: expenseStats,
        message: 'Expense statistics retrieved successfully'
      };

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Get expense stats error:', error);
      throw new DashboardError(
        'Failed to retrieve expense statistics',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    }
  }

  async updateMonthlyBudget(
    userId: string,
    request: BudgetRequest,
    clientId: string
  ): Promise<DashboardResponse<{ budget: number }>> {
    await this.checkRateLimit(clientId, 10);
    await dbConnect();

    try {
      this.validateUserId(userId);

      if (!Number.isFinite(request.parsedBudget) || request.parsedBudget < VALIDATION_CONSTANTS.MIN_BUDGET) {
        throw new DashboardError(
          'Budget must be a valid positive number',
          DashboardErrorCodes.INVALID_AMOUNT,
          400
        );
      }

      if (request.parsedBudget > VALIDATION_CONSTANTS.MAX_BUDGET) {
        throw new DashboardError(
          `Budget cannot exceed ${VALIDATION_CONSTANTS.MAX_BUDGET}`,
          DashboardErrorCodes.INVALID_AMOUNT,
          400
        );
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { monthlyBudget: request.parsedBudget } },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new DashboardError(
          'User not found',
          DashboardErrorCodes.UNAUTHORIZED_ACCESS,
          404
        );
      }

      return {
        success: true,
        data: { budget: updatedUser.monthlyBudget },
        message: 'Monthly budget updated successfully'
      };

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Update budget error:', error);
      throw new DashboardError(
        'Failed to update monthly budget',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    }
  }

  async getMonthlyBudget(
    userId: string,
    clientId: string
  ): Promise<DashboardResponse<{ monthlyBudget: number }>> {
    await this.checkRateLimit(clientId, 60);
    await dbConnect();

    try {
      this.validateUserId(userId);

      const user = await User.findById(userId).select('monthlyBudget');

      if (!user) {
        throw new DashboardError(
          'User not found',
          DashboardErrorCodes.UNAUTHORIZED_ACCESS,
          404
        );
      }

      return {
        success: true,
        data: { monthlyBudget: user.monthlyBudget },
        message: 'Monthly budget retrieved successfully'
      };

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Get budget error:', error);
      throw new DashboardError(
        'Failed to retrieve monthly budget',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    }
  }

  async bulkImportExpenses(
    userId: string,
    expenses: CreateExpenseRequest[],
    clientId: string
  ): Promise<DashboardResponse<ExpenseData[]>> {
    await this.checkRateLimit(clientId, 5); // Stricter rate limit for bulk operations
    await dbConnect();

    if (expenses.length > 100) {
      throw new DashboardError(
        'Cannot import more than 100 expenses at once',
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    const session = await mongoose.startSession();

    try {
      this.validateUserId(userId);

      // Validate all expenses first
      for (const expense of expenses) {
        this.validateDate(expense.date);
        this.validateAmount(expense.amount);
        this.validateCategory(expense.category);
      }

      return await session.withTransaction(async () => {
        const results: ExpenseData[] = [];

        for (const expenseRequest of expenses) {
          try {
            const result = await this.addExpense(userId, expenseRequest, clientId);
            if (result.data) {
              results.push(result.data);
            }
          } catch (error) {
            // Continue with other expenses if one fails
            console.warn(`Failed to import expense for ${expenseRequest.date}:`, error);
          }
        }

        return {
          success: true,
          data: results,
          count: results.length,
          message: `Successfully imported ${results.length} out of ${expenses.length} expenses`
        };
      });

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Bulk import error:', error);
      throw new DashboardError(
        'Failed to bulk import expenses',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    } finally {
      await session.endSession();
    }
  }

  async getDashboardSummary(
    userId: string,
    clientId: string
  ): Promise<DashboardResponse<{
    recentExpenses: ExpenseData[];
    monthlyStats: ExpenseStats;
    budget: { monthlyBudget: number; spent: number; remaining: number };
  }>> {
    await this.checkRateLimit(clientId, 30);
    await dbConnect();

    try {
      this.validateUserId(userId);

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      // Get recent expenses (last 10)
      const recentExpensesResponse = await this.getExpenses(userId, {
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc'
      }, clientId);

      // Get monthly stats
      const monthlyStatsResponse = await this.getExpenseStats(userId, startDate, endDate);

      // Get budget info
      const budgetResponse = await this.getMonthlyBudget(userId, clientId);

      const monthlySpent = monthlyStatsResponse.stats?.totalExpenses || 0;
      const monthlyBudget = budgetResponse.data?.monthlyBudget || 0;

      return {
        success: true,
        data: {
          recentExpenses: recentExpensesResponse.data || [],
          monthlyStats: monthlyStatsResponse.stats!,
          budget: {
            monthlyBudget,
            spent: monthlySpent,
            remaining: monthlyBudget - monthlySpent
          }
        },
        message: 'Dashboard summary retrieved successfully'
      };

    } catch (error) {
      if (error instanceof DashboardError) {
        throw error;
      }
      console.error('Get dashboard summary error:', error);
      throw new DashboardError(
        'Failed to retrieve dashboard summary',
        DashboardErrorCodes.DATABASE_ERROR,
        500
      );
    }
  }
}

export const dashboardService = new DashboardService();