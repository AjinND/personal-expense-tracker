// src/components/ui/enhanced-date-picker.tsx
"use client";

import React, { useState, useEffect } from "react";
import { format, isToday, isYesterday, subDays } from "date-fns";
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

  const today = new Date();
  const yesterday = subDays(today, 1);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Quick date options
  const quickDates = [
    {
      label: "Today",
      date: today,
      icon: <Clock className="h-3 w-3" />,
      description: format(today, "EEEE, MMM d"),
      shortDesc: "Today",
    },
    {
      label: "Yesterday", 
      date: yesterday,
      icon: <CalendarIconAlt className="h-3 w-3" />,
      description: format(yesterday, "EEEE, MMM d"),
      shortDesc: "Yesterday",
    },
    {
      label: "2 days ago",
      date: subDays(today, 2),
      icon: <CalendarIconAlt className="h-3 w-3" />,
      description: format(subDays(today, 2), "EEEE, MMM d"),
      shortDesc: format(subDays(today, 2), "MMM d"),
    },
    {
      label: "3 days ago",
      date: subDays(today, 3),
      icon: <CalendarIconAlt className="h-3 w-3" />,
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
    return format(date, isMobile ? "MMM dd" : "MMM dd, yyyy");
  };

  const getDateDescription = (date: Date): string => {
    if (isToday(date)) return format(date, "EEEE");
    if (isYesterday(date)) return "Yesterday";
    return format(date, isMobile ? "EEE" : "EEEE");
  };

  // Mobile layout - stacked vertically
  const MobileLayout = () => (
    <div className="w-screen max-w-sm mx-auto">
      {/* Quick dates - horizontal scroll on mobile */}
      <div className="p-3 border-b border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Quick Select
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickDates.map((quickDate, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto p-3 text-left flex-col items-start",
                format(value, 'yyyy-MM-dd') === format(quickDate.date, 'yyyy-MM-dd') && 
                "bg-blue-50 text-blue-700 border border-blue-200"
              )}
              onClick={() => handleQuickDateSelect(quickDate.date)}
            >
              <div className="flex items-center space-x-2 w-full">
                <div className={cn(
                  "p-1 rounded",
                  format(value, 'yyyy-MM-dd') === format(quickDate.date, 'yyyy-MM-dd') ? 
                  'bg-blue-100' : 'bg-gray-100'
                )}>
                  {quickDate.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{quickDate.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {quickDate.shortDesc}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar for mobile */}
      <div className="p-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Or Select Custom Date
        </div>
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
          className="rounded-md w-full"
          classNames={{
            months: "flex flex-col space-y-4",
            month: "space-y-4 w-full",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7",
            table: "w-full border-collapse",
            head_row: "flex w-full",
            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1",
            row: "flex w-full mt-2",
            cell: "text-center text-sm relative p-0 flex-1",
            day: "h-8 w-full p-0 font-normal aria-selected:opacity-100 rounded-md",
          }}
        />
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="text-center text-xs">
          <span className="text-muted-foreground">Selected: </span>
          <span className="font-medium">
            {format(value, "EEE, MMM dd, yyyy")}
          </span>
        </div>
      </div>
    </div>
  );

  // Desktop layout - side by side
  const DesktopLayout = () => (
    <div className="flex min-w-[480px]">
      {/* Quick date selection */}
      <div className="border-r border-gray-200 p-3 space-y-1 min-w-[180px]">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Quick Select
        </div>
        {quickDates.map((quickDate, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start h-auto p-2 text-left",
              format(value, 'yyyy-MM-dd') === format(quickDate.date, 'yyyy-MM-dd') && 
              "bg-blue-50 text-blue-700 border border-blue-200"
            )}
            onClick={() => handleQuickDateSelect(quickDate.date)}
          >
            <div className="flex items-center space-x-2 w-full">
              <div className={cn(
                "p-1 rounded",
                format(value, 'yyyy-MM-dd') === format(quickDate.date, 'yyyy-MM-dd') ? 
                'bg-blue-100' : 'bg-gray-100'
              )}>
                {quickDate.icon}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">{quickDate.label}</div>
                <div className="text-xs text-muted-foreground">
                  {quickDate.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
        
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-muted-foreground">
            Or select a custom date →
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-3">
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
        />
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
              "w-full justify-between text-left font-normal h-auto",
              isMobile ? "p-3" : "p-3",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div 
                className={cn(
                  "p-2 rounded-full flex-shrink-0",
                  isMobile ? "w-8 h-8" : "w-10 h-10"
                )}
                style={{ 
                  backgroundColor: isToday(value) ? '#dbeafe' : 
                                  isYesterday(value) ? '#fef3c7' : '#f3f4f6' 
                }}
              >
                <CalendarIcon className={cn(
                  isMobile ? "h-4 w-4" : "h-6 w-6",
                  isToday(value) ? 'text-blue-600' : 
                  isYesterday(value) ? 'text-yellow-600' : 'text-gray-600'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                  {value ? getDateLabel(value) : placeholder}
                </div>
                {value && (
                  <div className="text-xs text-muted-foreground truncate">
                    {getDateDescription(value)} • {format(value, isMobile ? "MMM dd" : "MMM dd, yyyy")}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "flex-shrink-0 opacity-50",
              isMobile ? "h-4 w-4" : "h-4 w-4"
            )} />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className={cn(
            "p-0",
            isMobile ? "w-screen" : "w-auto"
          )} 
          align={isMobile ? "center" : "start"}
          side={isMobile ? "bottom" : "bottom"}
          sideOffset={8}
        >
          {isMobile ? <MobileLayout /> : <DesktopLayout />}
          
          {/* Desktop Footer */}
          {!isMobile && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Selected:</span>
                <span className="font-medium">
                  {format(value, "EEEE, MMMM dd, yyyy")}
                </span>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      <p className={cn(
        "text-muted-foreground",
        isMobile ? "text-xs" : "text-xs"
      )}>
        Select when you made this expense. Cannot be in the future or more than 1 year ago.
      </p>
    </div>
  );
};

export default EnhancedDatePicker;