// src/components/common/DateRangePicker.tsx
'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePickerProps } from '@/types/components';

const presets = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date();
      return {
        from: today,
        to: today
      };
    }
  },
  {
    label: 'Last 7 days',
    getValue: () => {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return {
        from,
        to: today
      };
    }
  },
  {
    label: 'Last 30 days',
    getValue: () => {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return {
        from,
        to: today
      };
    }
  },
  {
    label: 'This month',
    getValue: () => {
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        from,
        to
      };
    }
  },
  {
    label: 'Last month',
    getValue: () => {
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        from,
        to
      };
    }
  },
  {
    label: 'This year',
    getValue: () => {
      const today = new Date();
      const from = new Date(today.getFullYear(), 0, 1);
      const to = new Date(today.getFullYear(), 11, 31);
      return {
        from,
        to
      };
    }
  }
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className,
  align = 'start',
  showPresets = true
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string>('');

  const handlePresetSelect = (preset: string) => {
    const presetConfig = presets.find(p => p.label === preset);
    if (presetConfig) {
      const range = presetConfig.getValue();
      onChange(range);
      setSelectedPreset(preset);
      setOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!value?.from) return 'Pick a date range';
    
    if (value.to) {
      return `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`;
    }
    
    return format(value.from, 'MMM d, yyyy');
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="p-3">
            {showPresets && (
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger className="mb-2">
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={(range) => {
                onChange(range);
                setSelectedPreset('');
                // Auto close if both dates are selected
                if (range?.from && range?.to) {
                  setTimeout(() => setOpen(false), 100);
                }
              }}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Single date picker variant
export const DatePicker: React.FC<{
  value?: Date;
  onChange: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className, placeholder = 'Pick a date' }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;