"use client";

import * as React from "react";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: DateRange | null;
  onChange?: (date: DateRange | null) => void;
  disabled?: boolean;
}

export function DatePickerWithRange({
  className,
  value,
  onChange,
  disabled = false,
  ...props
}: DatePickerWithRangeProps) {
  // Calculate the start and end date for the current week as fallback
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 }); // Saturday

  // Use value prop or default to current week
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (value) {
      return value;
    }
    return {
      from: startOfCurrentWeek,
      to: endOfCurrentWeek,
    };
  });

  // Update local state when value prop changes
  React.useEffect(() => {
    if (value) {
      setDate(value);
    }
  }, [value]);

  // Update state when a new range is selected
  const handleSelect = (newDate: DateRange | undefined) => {
    const dateToSet = newDate || null;
    setDate(newDate);
    if (onChange) {
      onChange(dateToSet);
    }
  };

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(date) => {
              // Disable future dates
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              
              // Disable dates more than 2 years ago
              const twoYearsAgo = new Date();
              twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
              
              return date > today || date < twoYearsAgo || disabled;
            }}
          />
          
          {/* Quick select buttons */}
          <div className="p-3 border-t">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
                  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
                  handleSelect({ from: weekStart, to: weekEnd });
                }}
                disabled={disabled}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  handleSelect({ from: monthStart, to: monthEnd });
                }}
                disabled={disabled}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                  handleSelect({ from: lastMonthStart, to: lastMonthEnd });
                }}
                disabled={disabled}
              >
                Last Month
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}