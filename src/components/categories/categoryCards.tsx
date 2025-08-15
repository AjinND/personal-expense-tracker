"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Music, Plane, ShoppingCart, Utensils, Plus } from "lucide-react";
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
import CalendarForm from "../ui/form-date-picker";
import { Alert, AlertDescription } from "../ui/alert";

type ExpenseEntry = {
  date: string;
  food: number;
  shopping: number;
  travelling: number;
  entertainment: number;
};

interface CategoryCardsProps {
  categoryTotals: Record<keyof Omit<ExpenseEntry, "date">, number>;
  categoryColors: { [key: string]: string };
  addExpense: (
    category: keyof Omit<ExpenseEntry, "date">,
    amount: number,
    date: string
  ) => void;
}

const CATEGORY_ICONS: { [key: string]: React.ElementType } = {
  food: Utensils,
  shopping: ShoppingCart,
  travelling: Plane,
  entertainment: Music,
};

const CATEGORY_NAMES: { [key: string]: string } = {
  food: "Food & Dining",
  shopping: "Shopping",
  travelling: "Travel",
  entertainment: "Entertainment",
};

const CATEGORY_DESCRIPTIONS: { [key: string]: string } = {
  food: "Restaurants, groceries, and dining expenses",
  shopping: "Clothing, electronics, and general purchases",
  travelling: "Transportation, flights, and accommodation",
  entertainment: "Movies, games, and recreational activities",
};

const CategoryCards: React.FC<CategoryCardsProps> = ({
  categoryTotals,
  categoryColors,
  addExpense,
}) => {
  const [amountSpend, setAmountSpend] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    keyof Omit<ExpenseEntry, "date"> | null
  >(null);
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (selectedDate: Date | undefined) => {
    setExpenseDate(selectedDate);
    setValidationError("");
  };

  const validateForm = (): boolean => {
    const amount = parseFloat(amountSpend);
    
    if (!amountSpend || isNaN(amount)) {
      setValidationError("Please enter a valid amount");
      return false;
    }
    
    if (amount <= 0) {
      setValidationError("Amount must be greater than 0");
      return false;
    }
    
    if (amount > 10000) {
      setValidationError("Amount cannot exceed $10,000");
      return false;
    }
    
    if (!expenseDate) {
      setValidationError("Please select a date");
      return false;
    }
    
    if (expenseDate > new Date()) {
      setValidationError("Date cannot be in the future");
      return false;
    }

    return true;
  };

  const handleExpenseSave = async () => {
    if (!validateForm() || !selectedCategory) return;

    setIsSubmitting(true);
    try {
      await addExpense(
        selectedCategory,
        parseFloat(amountSpend),
        expenseDate!.toLocaleDateString("en-CA")
      );
      
      // Reset form and close dialog
      setAmountSpend("");
      setExpenseDate(new Date());
      setValidationError("");
      setIsDialogOpen(false);
    } catch (error) {
      setValidationError("Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogOpen = (category: keyof Omit<ExpenseEntry, "date">) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
    setValidationError("");
    setAmountSpend("");
    setExpenseDate(new Date());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmountSpend(value);
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(categoryTotals).map(([category, total]) => {
        const IconComponent = CATEGORY_ICONS[category];
        const categoryKey = category as keyof Omit<ExpenseEntry, "date">;
        
        return (
          <Card 
            key={category} 
            className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium capitalize">
                  {CATEGORY_NAMES[category]}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_DESCRIPTIONS[category]}
                </p>
              </div>
              
              <Dialog open={isDialogOpen && selectedCategory === categoryKey} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 group-hover:bg-primary/10"
                    onClick={() => handleDialogOpen(categoryKey)}
                  >
                    <div className="relative">
                      {IconComponent && (
                        <IconComponent
                          className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                          style={{ color: categoryColors[category] }}
                        />
                      )}
                      <Plus className="h-3 w-3 absolute -top-1 -right-1 bg-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {IconComponent && (
                        <IconComponent 
                          className="h-5 w-5" 
                          style={{ color: categoryColors[category] }}
                        />
                      )}
                      Add {CATEGORY_NAMES[category]} Expense
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium">
                        Amount Spent
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <Input
                          id="amount"
                          value={amountSpend}
                          onChange={handleAmountChange}
                          placeholder="0.00"
                          className="pl-8"
                          disabled={isSubmitting}
                          autoFocus
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium">
                        Expense Date
                      </Label>
                      <CalendarForm 
                        handleDateChange={handleDateChange} 
                        initialDate={expenseDate}
                      />
                    </div>

                    {validationError && (
                      <Alert variant="destructive">
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
                      onClick={handleExpenseSave}
                      disabled={isSubmitting || !amountSpend || !expenseDate}
                      className="min-w-[80px]"
                    >
                      {isSubmitting ? "Adding..." : "Add Expense"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div
                  className="text-2xl font-bold"
                  style={{ color: categoryColors[category] }}
                >
                  {formatCurrency(total)}
                </div>
                
                {/* Visual indicator bar */}
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: categoryColors[category],
                      width: `${Math.min(100, (total / Math.max(...Object.values(categoryTotals))) * 100)}%`,
                    }}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {total === 0 ? "No expenses yet" : "Click to add more"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CategoryCards;