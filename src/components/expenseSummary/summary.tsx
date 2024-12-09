"use client";

import { Calendar, Wallet } from "lucide-react";
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
import { useEffect, useState } from "react";
import axios from "axios";

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
  const [totalBalance, setTotalBalance] = useState(0.0);
  const [newBudget, setNewBudget] = useState(totalBalance.toString());

  const handleBudgetSave = () => {
    const parsedBudget = parseFloat(newBudget);
    if (!isNaN(parsedBudget) && parsedBudget >= 0) {
      setTotalBalance(parsedBudget);
      saveMonthlyBudget(parsedBudget);
      // budgetRemaining(parsedBudget);
      setNewBudget("0.0");
    }
  };

  const saveMonthlyBudget = async (parsedBudget: number) => {
    try {
      const token = localStorage.getItem("token");
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
        console.log("Budget set successfully:", response.data.budget);
        budgetRemaining(response.data.budget);
      } else {
        console.error("Failed to set budget:", response.data.error);
      }
    } catch (error) {
      console.error("Error setting budget:", error);
    }
  }

  // useEffect(() => {
  //   const updateMonthlyBudget = async (parsedBudget: number) => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       if (!token) {
  //         console.error("No token found");
  //         return;
  //       }

  //       const response = await axios.post(
  //         "/api/budget/monthly",
  //         { parsedBudget },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );
  //       if (response.data.success) {
  //         console.log("Updated Successfully ", response.data.budget)
  //       } else {
  //         console.error(response.data.error);
  //       }
  //     } catch (error) {
  //       console.error("Failed to Updated Monthly Remaining Budget:", error);
  //     }
  //   }
  //   if (remainingBudget >= 0) {
  //     console.log("Remainn --> ", remainingBudget)
  //     updateMonthlyBudget(remainingBudget);
  //   }
  // }, [remainingBudget]);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <Wallet className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
          {/* <p className="text-xs text-green-500">+12.5% from last month</p> */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Spending
          </CardTitle>
          <Calendar className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${averageSpending.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Per {timeFrame}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Budget Remaining
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <button className="bg-transparent border-none cursor-pointer">
                <Wallet
                  className="text-muted-foreground hover:text-primary"
                  size={20}
                  color="blue"
                />
              </button>
            </DialogTrigger>
            <DialogContent aria-describedby="">
              <DialogHeader>
                <DialogTitle>Update Monthly Budget</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="budget" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="budget"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBudgetSave}
                  >
                    Save
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${remainingBudget?.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Monthly budget</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseSummary;
