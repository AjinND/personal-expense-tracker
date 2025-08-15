"use client";

import { Calendar, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { AlertDescription, Alert } from "@/components/ui/alert";

interface ExpenseSummaryProps {
  totalExpenses: number;
  averageSpending: number;
  budgetRemaining: (remainingBudget: number) => void;
  timeFrame: string;
  remainingBudget: number;
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  totalExpenses,
  averageSpending,
  budgetRemaining,
  timeFrame,
  remainingBudget,
}) => {
  const [newBudget, setNewBudget] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const validateBudget = (value: string): boolean => {
    const budget = parseFloat(value);
    
    if (!value || isNaN(budget)) {
      setValidationError("Please enter a valid budget amount");
      return false;
    }
    
    if (budget < 0) {
      setValidationError("Budget cannot be negative");
      return false;
    }
    
    if (budget > 1000000) {
      setValidationError("Budget cannot exceed $1,000,000");
      return false;
    }

    return true;
  };

  const handleBudgetSave = async () => {
    if (!validateBudget(newBudget)) return;

    setIsSubmitting(true);
    const parsedBudget = parseFloat(newBudget);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.post(
        "/api/budget/monthly",
        { parsedBudget },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        budgetRemaining(response.data.budget);
        setIsDialogOpen(false);
        setNewBudget("");
        setValidationError("");
        
        toast({
          title: "Budget Updated",
          description: `Monthly budget set to $${parsedBudget.toFixed(2)}`,
        });
      } else {
        setValidationError(response.data.error || "Failed to update budget");
      }
    } catch (error: any) {
      console.error("Error setting budget:", error);
      setValidationError(
        error.response?.data?.error || "Failed to update budget. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNewBudget(value);
      setValidationError("");
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getBudgetStatus = () => {
    if (remainingBudget > 0) {
      const percentage = (remainingBudget / (totalExpenses + remainingBudget)) * 100;
      if (percentage > 20) return { status: "good", color: "text-green-600", bg: "bg-green-50" };
      if (percentage > 10) return { status: "warning", color: "text-yellow-600", bg: "bg-yellow-50" };
      return { status: "danger", color: "text-red-600", bg: "bg-red-50" };
    }
    return { status: "over", color: "text-red-600", bg: "bg-red-50" };
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Expenses Card */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            <TrendingUp className="h-3 w-3" />
            <span>Current period total</span>
          </div>
        </CardContent>
      </Card>

      {/* Average Spending Card */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Spending</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(averageSpending)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Per {timeFrame} in selected period
          </p>
        </CardContent>
      </Card>

      {/* Budget Remaining Card */}
      <Card className={`hover:shadow-lg transition-shadow duration-200 ${budgetStatus.bg}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                onClick={() => {
                  setIsDialogOpen(true);
                  setNewBudget("");
                  setValidationError("");
                }}
              >
                <Wallet className="h-4 w-4 text-primary" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Update Monthly Budget
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-sm font-medium">
                    Monthly Budget Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="budget"
                      value={newBudget}
                      onChange={handleBudgetChange}
                      placeholder="0.00"
                      className="pl-8"
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set your total monthly spending limit across all categories
                  </p>
                </div>

                {/* Current Budget Info */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Budget:</span>
                    <span className="font-medium">
                      {formatCurrency(totalExpenses + remainingBudget)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Spent:</span>
                    <span className="font-medium">{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Remaining:</span>
                    <span className={budgetStatus.color}>
                      {formatCurrency(remainingBudget)}
                    </span>
                  </div>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleBudgetSave}
                  disabled={isSubmitting || !newBudget}
                  className="min-w-[80px]"
                >
                  {isSubmitting ? "Updating..." : "Update Budget"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          <div className={`text-2xl font-bold ${budgetStatus.color}`}>
            {formatCurrency(Math.abs(remainingBudget))}
          </div>
          <div className="flex items-center space-x-2 text-xs mt-1">
            {remainingBudget < 0 && <AlertTriangle className="h-3 w-3 text-red-500" />}
            <span className={budgetStatus.color}>
              {remainingBudget >= 0 ? "Remaining this month" : "Over budget"}
            </span>
          </div>
          
          {/* Budget Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  remainingBudget >= 0 ? 'bg-blue-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(100, (totalExpenses / (totalExpenses + Math.abs(remainingBudget))) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Spent</span>
              <span>Budget: {formatCurrency(totalExpenses + remainingBudget)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseSummary;