// src/components/ui/enhanced-date-picker.tsx
"use client";

import React, { useState, useEffect } from "react";
import { format, isToday, isYesterday, subDays, startOfToday } from "date-fns";
import { CalendarIcon, Clock, Calendar as CalendarIconAlt, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EnhancedDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const EnhancedDatePicker: React.FC<EnhancedDatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Select date",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Quick date options
  const quickDates = [
    {
      label: "Today",
      date: today,
      icon: <Clock className="h-4 w-4" />,
      description: format(today, "EEEE, MMM d"),
      shortDesc: "Today",
    },
    {
      label: "Yesterday", 
      date: yesterday,
      icon: <CalendarIconAlt className="h-4 w-4" />,
      description: format(yesterday, "EEEE, MMM d"),
      shortDesc: "Yesterday",
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

  // Mobile Layout
  const MobileLayout = () => (
    <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-blue-100">
        <h3 className="text-lg font-semibold text-gray-900">Select Expense Date</h3>
        <p className="text-sm text-gray-600 mt-0.5">
          Choose when you made this expense
        </p>
      </div>

      {/* Quick Selections */}
      <div className="p-3 space-y-1 border-b bg-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 mb-2">
          Quick Select
        </p>
        {quickDates.map((quickDate) => (
          <Button
            key={quickDate.label}
            variant="ghost"
            className={cn(
              "w-full justify-start h-auto py-3 px-3 hover:bg-white transition-colors",
              isDateSelected(quickDate.date) && "bg-blue-50 hover:bg-blue-50"
            )}
            onClick={() => handleQuickDateSelect(quickDate.date)}
          >
            <div className="flex items-center gap-3 w-full">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isDateSelected(quickDate.date) 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600'
              )}>
                {quickDate.icon}
              </div>
              <div className="flex-1 text-left">
                <div className={cn(
                  "text-sm font-medium",
                  isDateSelected(quickDate.date) && "text-blue-600"
                )}>
                  {quickDate.label}
                </div>
                <div className="text-xs text-gray-500">
                  {quickDate.description}
                </div>
              </div>
              {isDateSelected(quickDate.date) && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
          </Button>
        ))}
      </div>

      {/* Calendar */}
      <div className="p-4 bg-white">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Or Pick a Date
        </p>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleCalendarSelect}
          disabled={(date) => {
            const isAfterToday = date > today;
            const isBeforeOneYearAgo = date < oneYearAgo;
            return isAfterToday || isBeforeOneYearAgo || disabled;
          }}
          initialFocus
          defaultMonth={value}
          className="rounded-md border-0"
          classNames={{
            months: "space-y-4",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Selected:</span>
          <span className="text-sm font-medium text-gray-900">
            {format(value, "EEEE, MMM dd, yyyy")}
          </span>
        </div>
      </div>
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <div className="flex bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Quick Selections Sidebar */}
      <div className="w-48 p-4 border-r bg-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Quick Select
        </p>
        <div className="space-y-1">
          {quickDates.map((quickDate) => (
            <Button
              key={quickDate.label}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto py-2.5 px-3 text-left hover:bg-white transition-all",
                isDateSelected(quickDate.date) && "bg-blue-50 hover:bg-blue-50"
              )}
              onClick={() => handleQuickDateSelect(quickDate.date)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  isDateSelected(quickDate.date) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {React.cloneElement(quickDate.icon, { className: "h-3.5 w-3.5" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium truncate",
                    isDateSelected(quickDate.date) && "text-blue-600"
                  )}>
                    {quickDate.label}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {quickDate.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            Or select from calendar →
          </p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="flex-1 p-4">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleCalendarSelect}
          disabled={(date) => {
            const isAfterToday = date > today;
            const isBeforeOneYearAgo = date < oneYearAgo;
            return isAfterToday || isBeforeOneYearAgo || disabled;
          }}
          initialFocus
          defaultMonth={value}
          className="rounded-md"
          classNames={{
            months: "space-y-4",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
        
        {/* Selected Date Display */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-gray-500">Selected date:</span>
            <span className="text-sm font-medium text-gray-900">
              {format(value, "EEEE, MMMM dd, yyyy")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal h-auto min-h-[3.5rem]",
              "hover:bg-gray-50 transition-colors",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-3 flex-1">
              <div 
                className={cn(
                  "p-2.5 rounded-lg flex-shrink-0",
                  isToday(value) ? 'bg-blue-100' : 
                  isYesterday(value) ? 'bg-amber-100' : 'bg-gray-100'
                )}
              >
                <CalendarIcon className={cn(
                  "h-5 w-5",
                  isToday(value) ? 'text-blue-600' : 
                  isYesterday(value) ? 'text-amber-600' : 'text-gray-600'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">
                  {value ? getDateLabel(value) : placeholder}
                </div>
                {value && (
                  <div className="text-sm text-gray-500">
                    {getDateDescription(value)}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className={cn(
            "p-0 border-0",
            isMobile ? "w-screen max-w-[calc(100vw-2rem)]" : "w-auto"
          )} 
          align={isMobile ? "center" : "start"}
          side="bottom"
          sideOffset={4}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            
            // Check if clicking on dialog overlay or close button
            if (
              target.closest('[data-radix-dialog-overlay]') ||
              target.closest('[data-radix-dialog-close]')
            ) {
              // Allow the dialog to close
              setIsOpen(false);
            } else {
              // Prevent closing if clicking elsewhere
              e.preventDefault();
            }
          }}
        >
          {isMobile ? <MobileLayout /> : <DesktopLayout />}
        </PopoverContent>
      </Popover>
      
      <p className="text-xs text-gray-500 pl-1">
        Select when you made this expense. Cannot be in the future or more than 1 year ago.
      </p>
    </div>
  );
};

export default EnhancedDatePicker;