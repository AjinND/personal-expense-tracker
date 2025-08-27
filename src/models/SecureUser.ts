// src/models/SecureUser.ts
import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "@/types/auth-backend";

// Account lockout settings
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isLocked(): boolean;
  sanitizeForResponse(): {
    id: string;
    avatar: string;
    name: string;
    email: string;
    monthlyBudget: number;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface UserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<HydratedDocument<IUser, IUserMethods> | null>;
}

type UserDocument = HydratedDocument<IUser, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    avatar: {
      type: String,
      default: undefined,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty values
          // Validate URL format for avatar
          return /^\/uploads\/avatars\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif)$/i.test(v);
        },
        message: 'Invalid avatar URL format'
      }
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
      validate: {
        validator: function(password: string) {
          // Password must contain at least one uppercase, one lowercase, one number
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
        },
        message: 'Password must contain uppercase, lowercase, and number'
      }
    },
    expenses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense"
    }],
    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
      max: [10000000, 'Budget cannot exceed 10 million']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    refreshTokens: [{
      type: String,
      select: false, // Don't include refresh tokens in queries by default
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Remove sensitive fields when converting to JSON
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for performance and security
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ lockUntil: 1 }, { sparse: true });
UserSchema.index({ createdAt: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(this: UserDocument, next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(this: UserDocument, candidatePassword: string): Promise<boolean> {
  if (!candidatePassword || !this.password) {
    return false;
  }
  
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Instance method to increment login attempts
UserSchema.methods.incLoginAttempts = async function(this: UserDocument): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    }).exec();
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // If we have hit max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates).exec();
};

// Instance method to reset login attempts
UserSchema.methods.resetLoginAttempts = async function(this: UserDocument): Promise<void> {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    },
    $set: {
      lastLogin: new Date()
    }
  }).exec();
};

// Instance method to check if account is locked
UserSchema.methods.isLocked = function(this: UserDocument): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to sanitize user for response
UserSchema.methods.sanitizeForResponse = function(this: UserDocument): {
  id: string;
  avatar: string;
  name: string;
  email: string;
  monthlyBudget: number;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: this._id.toString(),
    avatar: this.avatar || '',
    name: this.name,
    email: this.email,
    monthlyBudget: this.monthlyBudget,
    emailVerified: this.emailVerified,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Static method to find by email
UserSchema.statics.findByEmail = function(this: UserModel, email: string) {
  return this.findOne({
    email: email.toLowerCase().trim(),
    isActive: true
  });
};

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

// Create and export the model
let User: UserModel;

try {
  // Try to get existing model
  User = mongoose.model<IUser, UserModel>('User');
} catch {
  // Model doesn't exist, create it
  User = mongoose.model<IUser, UserModel>('User', UserSchema);
}

export default User;