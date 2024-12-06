"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Music, Plane, ShoppingCart, Utensils } from "lucide-react";
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

const CategoryCards: React.FC<CategoryCardsProps> = ({
  categoryTotals,
  categoryColors,
  addExpense,
}) => {
  const [amountSpend, setAmountSpend] = useState("0");
  const [selectedCategory, setSelectedCategory] = useState<
    keyof Omit<ExpenseEntry, "date"> | null
  >(null);
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());

  const setSelectedDate = (
    selectedDate: React.SetStateAction<Date | undefined>
  ) => {
    setExpenseDate(selectedDate);
    // console.log("Expense ", selectedDate);
  };

  const handleExpenseSave = () => {
    // console.log(
    //   "Amount Spend + Expense Date ",
    //   selectedCategory,
    //   amountSpend,
    //   expenseDate?.toLocaleDateString("en-CA")
    // );
    // saveData(amountSpend, expenseDate?.toISOString().split("T")[0]);
    if (selectedCategory && expenseDate) {
      addExpense(
        selectedCategory,
        parseFloat(amountSpend),
        // expenseDate.toISOString().split("T")[0]
        expenseDate.toLocaleDateString("en-CA")
      );
    }
    setAmountSpend("0");
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {Object.entries(categoryTotals).map(([category, total]) => {
        const IconComponent = CATEGORY_ICONS[category]; // Get the appropriate icon
        // setCategory(category);
        return (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {category}
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="bg-transparent border-none cursor-pointer"
                    onClick={() =>
                      setSelectedCategory(
                        category as keyof Omit<ExpenseEntry, "date">
                      )
                    }
                  >
                    {IconComponent && (
                      <IconComponent
                        className="text-muted-foreground hover:text-primary"
                        size={20}
                        color="blue"
                      />
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent aria-describedby="">
                  <DialogHeader>
                    <DialogTitle>Add Expenses</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="budget" className="text-right">
                        Amount Spend
                      </Label>
                      <Input
                        id="budget"
                        value={amountSpend}
                        onChange={(e) => setAmountSpend(e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">
                        Select Date
                      </Label>
                      <CalendarForm handleDateChange={setSelectedDate} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleExpenseSave}
                      >
                        Save
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                style={{ color: categoryColors[category] }}
              >
                ${total.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CategoryCards;
