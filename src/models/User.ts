import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    expenses: mongoose.Types.ObjectId[]; // Array of references to Expense
    monthlyBudget: number;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }], // Reference
        monthlyBudget: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);
