"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const FormSchema = z.object({
  expenseDate: z.date({
    required_error: "Expense date is required.",
  }).refine((date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date <= today;
  }, {
    message: "Expense date cannot be in the future.",
  }).refine((date) => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date >= oneYearAgo;
  }, {
    message: "Expense date cannot be more than 1 year ago.",
  }),
});

interface CalendarFormProps {
  handleDateChange: (date: Date | undefined) => void;
  initialDate?: Date;
  disabled?: boolean;
}

const CalendarForm: React.FC<CalendarFormProps> = ({ 
  handleDateChange, 
  initialDate = new Date(),
  disabled = false 
}) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      expenseDate: initialDate,
    },
  });

  // Update form when initialDate changes
  useEffect(() => {
    form.setValue("expenseDate", initialDate);
  }, [initialDate, form]);

  // Watch for changes and notify parent
  const watchedDate = form.watch("expenseDate");
  useEffect(() => {
    handleDateChange(watchedDate);
  }, [watchedDate, handleDateChange]);

  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="expenseDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={disabled}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    if (date) {
                      handleDateChange(date);
                    }
                  }}
                  disabled={(date) => {
                    const isAfterToday = date > today;
                    const isBeforeOneYearAgo = date < oneYearAgo;
                    return isAfterToday || isBeforeOneYearAgo || disabled;
                  }}
                  initialFocus
                  defaultMonth={field.value || today}
                />
              </PopoverContent>
            </Popover>
            <FormDescription className="text-xs">
              Select the date when you made this expense. Cannot be in the future or more than 1 year ago.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
};

export default CalendarForm;