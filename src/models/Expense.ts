import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExpense extends Document {
    date: string; // Stored as 'YYYY-MM-DD'
    food: number;
    shopping: number;
    travelling: number;
    entertainment: number;
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
});

// Prevent model overwrite upon initial compile
export default (mongoose.models.Expense as Model<IExpense>) ||
    mongoose.model<IExpense>('Expense', ExpenseSchema);
