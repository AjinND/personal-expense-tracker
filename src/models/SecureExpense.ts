// src/models/SecureExpense.ts
import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import { IExpense, ExpenseData, ExpenseCategory, VALIDATION_CONSTANTS } from '@/types/dashboard-backend';

interface IExpenseMethods {
  calculateTotal(): number;
  sanitizeForResponse(): ExpenseData;
  updateCategory(category: ExpenseCategory, amount: number): void;
}

interface ExpenseModel extends Model<IExpense, {}, IExpenseMethods> {
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<HydratedDocument<IExpense, IExpenseMethods>[]>;
  findByUser(userId: string, options?: { limit?: number; skip?: number }): Promise<HydratedDocument<IExpense, IExpenseMethods>[]>;
  getExpenseStats(userId: string, startDate?: Date, endDate?: Date): Promise<any>;
  findOrCreateByDate(userId: string, date: string): Promise<HydratedDocument<IExpense, IExpenseMethods>>;
}

type ExpenseDocument = HydratedDocument<IExpense, IExpenseMethods>;

const ExpenseSchema = new Schema<IExpense, ExpenseModel, IExpenseMethods>(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [VALIDATION_CONSTANTS.DATE_FORMAT, 'Date must be in YYYY-MM-DD format'],
      validate: {
        validator: function(date: string) {
          const expenseDate = new Date(date);
          const today = new Date();
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          return expenseDate <= today && expenseDate >= oneYearAgo;
        },
        message: 'Date must be within the last year and not in the future'
      },
      index: true
    },
    food: {
      type: Number,
      default: 0,
      min: [0, 'Food expense cannot be negative'],
      max: [VALIDATION_CONSTANTS.MAX_AMOUNT, `Food expense cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`],
      validate: {
        validator: function(value: number) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Food expense must be a valid positive number'
      }
    },
    shopping: {
      type: Number,
      default: 0,
      min: [0, 'Shopping expense cannot be negative'],
      max: [VALIDATION_CONSTANTS.MAX_AMOUNT, `Shopping expense cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`],
      validate: {
        validator: function(value: number) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Shopping expense must be a valid positive number'
      }
    },
    travelling: {
      type: Number,
      default: 0,
      min: [0, 'Travelling expense cannot be negative'],
      max: [VALIDATION_CONSTANTS.MAX_AMOUNT, `Travelling expense cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`],
      validate: {
        validator: function(value: number) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Travelling expense must be a valid positive number'
      }
    },
    entertainment: {
      type: Number,
      default: 0,
      min: [0, 'Entertainment expense cannot be negative'],
      max: [VALIDATION_CONSTANTS.MAX_AMOUNT, `Entertainment expense cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`],
      validate: {
        validator: function(value: number) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Entertainment expense must be a valid positive number'
      }
    },
    user: {
      type: String,
      required: [true, 'User is required'],
      ref: 'User',
      index: true,
      validate: {
        validator: function(userId: string) {
          return mongoose.Types.ObjectId.isValid(userId);
        },
        message: 'Invalid user ID format'
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for performance
ExpenseSchema.index({ user: 1, date: 1 }, { unique: true }); // One expense per user per date
ExpenseSchema.index({ user: 1, date: -1 }); // Query by user, sorted by date desc
ExpenseSchema.index({ user: 1, createdAt: -1 }); // Query by user, sorted by creation time
ExpenseSchema.index({ date: 1 }); // Query by date across users (for admin features)

// Virtual for total calculation
ExpenseSchema.virtual('total').get(function(this: ExpenseDocument) {
  return this.food + this.shopping + this.travelling + this.entertainment;
});

// Pre-save validation
ExpenseSchema.pre('save', function(this: ExpenseDocument, next) {
  // Validate total doesn't exceed reasonable limits
  const total = this.food + this.shopping + this.travelling + this.entertainment;
  if (total > VALIDATION_CONSTANTS.MAX_AMOUNT) {
    return next(new Error(`Total daily expenses cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`));
  }
  
  // Ensure at least one category has a value > 0
  if (total === 0) {
    return next(new Error('At least one expense category must have a value greater than 0'));
  }
  
  next();
});

// Instance method to calculate total
ExpenseSchema.methods.calculateTotal = function(this: ExpenseDocument): number {
  return this.food + this.shopping + this.travelling + this.entertainment;
};

// Instance method to sanitize for response
ExpenseSchema.methods.sanitizeForResponse = function(this: ExpenseDocument): ExpenseData {
  return {
    id: this._id.toString(),
    date: this.date,
    food: this.food,
    shopping: this.shopping,
    travelling: this.travelling,
    entertainment: this.entertainment,
    total: this.calculateTotal(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Instance method to update a specific category
ExpenseSchema.methods.updateCategory = function(this: ExpenseDocument, category: ExpenseCategory, amount: number): void {
  if (!VALIDATION_CONSTANTS.VALID_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}`);
  }
  
  if (amount < 0 || amount > VALIDATION_CONSTANTS.MAX_AMOUNT) {
    throw new Error(`Amount must be between 0 and ${VALIDATION_CONSTANTS.MAX_AMOUNT}`);
  }
  
  this[category] = amount;
};

// Static method to find expenses by date range
ExpenseSchema.statics.findByDateRange = function(
  this: ExpenseModel,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  }).sort({ date: 1 });
};

// Static method to find expenses by user
ExpenseSchema.statics.findByUser = function(
  this: ExpenseModel,
  userId: string,
  options: { limit?: number; skip?: number } = {}
) {
  const { limit = VALIDATION_CONSTANTS.DEFAULT_LIMIT, skip = 0 } = options;
  
  return this.find({ user: userId })
    .sort({ date: -1 })
    .limit(Math.min(limit, VALIDATION_CONSTANTS.MAX_LIMIT))
    .skip(skip);
};

// Static method to get expense statistics
ExpenseSchema.statics.getExpenseStats = function(
  this: ExpenseModel,
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: any = { user: userId };
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalExpenses: {
          $sum: { $add: ['$food', '$shopping', '$travelling', '$entertainment'] }
        },
        totalFood: { $sum: '$food' },
        totalShopping: { $sum: '$shopping' },
        totalTravelling: { $sum: '$travelling' },
        totalEntertainment: { $sum: '$entertainment' },
        averageDaily: {
          $avg: { $add: ['$food', '$shopping', '$travelling', '$entertainment'] }
        },
        daysWithExpenses: { $sum: 1 },
        maxDailyExpense: {
          $max: { $add: ['$food', '$shopping', '$travelling', '$entertainment'] }
        },
        minDailyExpense: {
          $min: { $add: ['$food', '$shopping', '$travelling', '$entertainment'] }
        }
      }
    }
  ]);
};

// Static method to find or create expense by date
ExpenseSchema.statics.findOrCreateByDate = async function(
  this: ExpenseModel,
  userId: string,
  date: string
): Promise<ExpenseDocument> {
  let expense = await this.findOne({ user: userId, date });
  
  if (!expense) {
    expense = new this({
      user: userId,
      date,
      food: 0,
      shopping: 0,
      travelling: 0,
      entertainment: 0
    });
  }
  
  return expense;
};

// Ensure virtual fields are serialized
ExpenseSchema.set('toJSON', { virtuals: true });

// Create and export the model
let Expense: ExpenseModel;

try {
  Expense = mongoose.model<IExpense, ExpenseModel>('Expense');
} catch {
  Expense = mongoose.model<IExpense, ExpenseModel>('Expense', ExpenseSchema);
}

export default Expense;