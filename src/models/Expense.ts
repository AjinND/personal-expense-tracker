import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExpense extends Document {
    date: string; // Stored as 'YYYY-MM-DD'
    food: number;
    shopping: number;
    travelling: number;
    entertainment: number;
    user: mongoose.Types.ObjectId; // Reference to the User
}

const ExpenseSchema: Schema = new Schema({
    date: {
        type: String,
        required: true,
        unique: true, // Ensure one entry per date
        match: /^\d{4}-\d{2}-\d{2}$/, // Validate 'YYYY-MM-DD' format
    },
    food: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    travelling: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// Prevent model overwrite upon initial compile
export default (mongoose.models.Expense as Model<IExpense>) ||
    mongoose.model<IExpense>('Expense', ExpenseSchema);
