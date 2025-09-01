// src/components/ui/enhanced-date-picker.tsx
"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { format, isToday, isYesterday, subDays, startOfToday, eachMonthOfInterval, getYear, setMonth as dateFnsSetMonth } from "date-fns";
import { CalendarIcon, Clock, Calendar as CalendarIconAlt, ChevronDown, X, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EnhancedDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export interface EnhancedDatePickerRef {
  close: () => void;
}

const EnhancedDatePicker = forwardRef<EnhancedDatePickerRef, EnhancedDatePickerProps>(({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Select date",
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [month, setMonth] = useState(value);

  // Expose close method via ref
  useImperativeHandle(ref, () => ({
    close: () => setIsOpen(false)
  }), []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const today = startOfToday();
  const yesterday = subDays(today, 1);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Quick date options (expanded for better usability)
  const quickDates = [
    {
      label: "Today",
      date: today,
      icon: <Sparkles className="h-4 w-4" />,
      description: format(today, "EEEE, MMM d"),
      shortDesc: "Today",
      highlight: true,
    },
    {
      label: "Yesterday", 
      date: yesterday,
      icon: <Clock className="h-4 w-4" />,
      description: format(yesterday, "EEEE, MMM d"),
      shortDesc: "Yesterday",
      highlight: true,
    },
    {
      label: "2 days ago",
      date: subDays(today, 2),
      icon: <CalendarIconAlt className="h-4 w-4" />,
      description: format(subDays(today, 2), "EEEE, MMM d"),
      shortDesc: format(subDays(today, 2), "MMM d"),
    },
    {
      label: "3 days ago",
      date: subDays(today, 3),
      icon: <CalendarIconAlt className="h-4 w-4" />,
      description: format(subDays(today, 3), "EEEE, MMM d"),
      shortDesc: format(subDays(today, 3), "MMM d"),
    },
    {
      label: "1 week ago",
      date: subDays(today, 7),
      icon: <TrendingUp className="h-4 w-4" />,
      description: format(subDays(today, 7), "EEEE, MMM d"),
      shortDesc: format(subDays(today, 7), "MMM d"),
    },
  ];

  const handleQuickDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setIsOpen(false);
    }
  };

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM dd, yyyy");
  };

  const getDateDescription = (date: Date): string => {
    if (isToday(date)) return format(date, "EEEE, MMMM dd");
    if (isYesterday(date)) return format(yesterday, "EEEE, MMMM dd");
    return format(date, "EEEE, MMMM dd");
  };

  const isDateSelected = (quickDate: Date): boolean => {
    return format(value, 'yyyy-MM-dd') === format(quickDate, 'yyyy-MM-dd');
  };

  // Standard 12 months in order
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate unique years from the past year interval
  const monthsInterval = eachMonthOfInterval({
    start: oneYearAgo,
    end: today
  });
  const years = Array.from(new Set(monthsInterval.map(m => getYear(m)))).sort((a, b) => b - a); // Recent first

  // Custom Caption with Month/Year Select
  const CustomCaption = ({ displayMonth }: { displayMonth: Date }) => {
    return (
      <div className="flex justify-between items-center gap-2 px-1">
        <Select
          value={format(displayMonth, 'MMMM')}
          onValueChange={(newMonth) => {
            const monthIndex = monthNames.indexOf(newMonth);
            if (monthIndex !== -1) {
              const newDate = dateFnsSetMonth(displayMonth, monthIndex);
              setMonth(newDate);
            }
          }}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm font-medium border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={getYear(displayMonth).toString()}
          onValueChange={(newYear) => {
            const newDate = new Date(displayMonth);
            newDate.setFullYear(parseInt(newYear));
            setMonth(newDate);
          }}
        >
          <SelectTrigger className="w-[85px] h-9 text-sm font-medium border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Shared Calendar ClassNames (with mobile adjustments)
  const calendarClassNames = (isMobile: boolean) => ({
    months: "space-y-4",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center hidden", // Hide default caption
    nav: "space-x-1 flex items-center",
    nav_button: cn(
      "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100",
      "hover:bg-gray-100 rounded-md transition-all duration-200"
    ),
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex",
    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: cn(
      "text-center text-sm p-0 relative",
      "[&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
      "focus-within:relative focus-within:z-20"
    ),
    day: cn(
      "p-0 font-normal aria-selected:opacity-100 rounded-md transition-all duration-200",
      "hover:bg-gray-100 hover:text-gray-900",
      isMobile ? "h-12 w-12 text-base" : "h-9 w-9 text-sm"
    ),
    day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white font-medium",
    day_today: "bg-blue-50 text-blue-900 font-semibold ring-2 ring-blue-200 hover:bg-blue-100",
    day_outside: "text-muted-foreground opacity-40",
    day_disabled: "text-muted-foreground opacity-30 hover:bg-transparent cursor-not-allowed",
    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
  });

  // Mobile Layout (Improved: Larger touch targets, close button, custom caption)
  const MobileLayout = () => (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Select Expense Date</h3>
          <p className="text-sm text-blue-100 mt-0.5">Choose when this expense occurred</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick Selections */}
      <div className="p-4 space-y-2 bg-gradient-to-b from-gray-50 to-white">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1 flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          Quick Select
        </p>
        <div className="grid gap-2">
          {quickDates.map((quickDate) => (
            <Button
              key={quickDate.label}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto py-3.5 px-3 rounded-lg transition-all duration-200",
                "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                isDateSelected(quickDate.date) 
                  ? "bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 shadow-sm" 
                  : "hover:bg-gray-50 border-2 border-transparent"
              )}
              onClick={() => handleQuickDateSelect(quickDate.date)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "p-2.5 rounded-lg transition-all duration-200",
                  isDateSelected(quickDate.date) 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                    : quickDate.highlight 
                      ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                )}>
                  {quickDate.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className={cn(
                    "font-semibold text-base",
                    isDateSelected(quickDate.date) ? "text-blue-900" : "text-gray-900"
                  )}>
                    {quickDate.label}
                  </div>
                  <div className="text-sm text-gray-500">
                    {quickDate.description}
                  </div>
                </div>
                {isDateSelected(quickDate.date) && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1 mb-4 flex items-center gap-2">
          <CalendarIconAlt className="h-3 w-3" />
          Or pick a specific date
        </p>
        <div className="mb-4">
          <CustomCaption displayMonth={month} />
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleCalendarSelect}
          disabled={(date) => date > today || date < oneYearAgo}
          initialFocus
          month={month}
          onMonthChange={setMonth}
          className="rounded-lg border border-gray-200 p-3"
          classNames={calendarClassNames(true)}
        />
      </div>
    </div>
  );

  // Desktop Layout (Improved: Custom caption, better spacing, selected date preview)
  const DesktopLayout = () => (
    <div className="w-[480px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Select Expense Date</h3>
          <p className="text-sm text-blue-100">Track when you made this purchase</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 rounded-full transition-all"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex h-[420px]">
        {/* Quick Selections Sidebar */}
        <div className="w-[180px] border-r border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Quick Select
          </p>
          <div className="space-y-2">
            {quickDates.map((quickDate) => (
              <Button
                key={quickDate.label}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left px-3 py-2.5 h-auto rounded-lg transition-all duration-200",
                  "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                  isDateSelected(quickDate.date) 
                    ? "bg-white hover:bg-blue-50 shadow-sm border border-blue-200" 
                    : "hover:bg-white/80"
                )}
                onClick={() => handleQuickDateSelect(quickDate.date)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    isDateSelected(quickDate.date) 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                      : quickDate.highlight
                        ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700"
                        : "bg-white text-gray-600 shadow-sm"
                  )}>
                    {React.cloneElement(quickDate.icon, { className: "h-4 w-4" })}
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      "text-sm font-semibold leading-tight",
                      isDateSelected(quickDate.date) ? "text-blue-900" : "text-gray-900"
                    )}>
                      {quickDate.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {quickDate.shortDesc}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="flex-1 p-5 bg-gradient-to-b from-white to-gray-50">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <CustomCaption displayMonth={month} />
          </div>
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            disabled={(date) => date > today || date < oneYearAgo}
            initialFocus
            month={month}
            onMonthChange={setMonth}
            className="rounded-lg"
            classNames={calendarClassNames(false)}
          />
          
          {/* Selected Date Display */}
          <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Selected Date:</span>
              <span className="text-sm font-bold text-blue-900">
                {format(value, "EEEE, MMMM dd, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-2", className)}>
      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal h-auto min-h-[3.5rem] px-4",
              "border-2 transition-all duration-200",
              "hover:bg-gray-50 hover:border-gray-300 hover:shadow-md",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-3 flex-1">
              <div 
                className={cn(
                  "p-2.5 rounded-lg flex-shrink-0 transition-all duration-200",
                  isToday(value) 
                    ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 shadow-sm' 
                    : isYesterday(value) 
                      ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 shadow-sm' 
                      : 'bg-gray-100 text-gray-600'
                )}
              >
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-base">
                  {value ? getDateLabel(value) : placeholder}
                </div>
                {value && (
                  <div className="text-sm text-gray-500 mt-0.5">
                    {getDateDescription(value)}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200",
              isOpen && "transform rotate-180"
            )} />
          </Button>
        </PopoverPrimitive.Trigger>
        
        <PopoverPrimitive.Content
          className={cn(
            "p-0 border-0 z-50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            isMobile ? "w-screen max-w-[calc(100vw-2rem)]" : "w-auto"
          )}
          align={isMobile ? "center" : "start"}
          side="bottom"
          sideOffset={8}
        >
          {isMobile ? <MobileLayout /> : <DesktopLayout />}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Root>
      
      <p className="text-xs text-gray-500 pl-1 flex items-center gap-1.5">
        <CalendarIconAlt className="h-3 w-3" />
        <span>Select a date from the past year • No future dates</span>
      </p>
    </div>
  );
});

EnhancedDatePicker.displayName = "EnhancedDatePicker";

export default EnhancedDatePicker;