// src/models/ActivityLog.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'register',
      'password_changed',
      'password_change_failed',
      'email_verified',
      'email_verification_requested',
      'profile_updated',
      'account_deleted',
      'account_deletion_failed',
      'budget_updated',
      'expense_added',
      'expense_deleted',
      'data_exported',
      'session_revoked',
      'failed_login_attempt',
      'account_locked',
      'account_unlocked'
    ],
    index: true
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for performance
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });

// Auto-delete old logs after 90 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export const ActivityLog = mongoose.models.ActivityLog || 
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);