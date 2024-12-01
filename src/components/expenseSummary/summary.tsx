import { Calendar, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const ExpenseSummary = ( {totalExpenses, averageSpending, budgetRemaining, timeFrame} ) => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <Wallet className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
          <p className="text-xs text-green-500">+12.5% from last month</p>
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
          <div className="text-2xl font-bold">${averageSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Per {timeFrame}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Budget Remaining
          </CardTitle>
          <Wallet className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${budgetRemaining.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Monthly budget</p>
        </CardContent>
      </Card>
    </div>
  );

  export default ExpenseSummary;