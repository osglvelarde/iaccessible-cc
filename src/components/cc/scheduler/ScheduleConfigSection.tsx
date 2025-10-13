"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Calendar, Clock } from "lucide-react";
import { ScheduleConfig, FrequencyType } from "@/lib/scheduler-api";

interface ScheduleConfigSectionProps {
  formData: Partial<ScheduleConfig>;
  onUpdate: (updates: Partial<ScheduleConfig>) => void;
}

const frequencyOptions: Array<{
  value: FrequencyType;
  label: string;
  description: string;
}> = [
  {
    value: 'one-time',
    label: 'One-time',
    description: 'Run the scan once at the specified date and time'
  },
  {
    value: 'daily',
    label: 'Daily',
    description: 'Run the scan every day at the specified time'
  },
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Run the scan on selected days of the week'
  },
  {
    value: 'bi-weekly',
    label: 'Bi-weekly',
    description: 'Run the scan every two weeks on selected days'
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Run the scan on a specific day of each month'
  },
  {
    value: 'quarterly',
    label: 'Quarterly',
    description: 'Run the scan on a specific day of selected months'
  }
];

const dayOfWeekOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`
}));

export default function ScheduleConfigSection({ formData, onUpdate }: ScheduleConfigSectionProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>(formData.dayOfWeek || []);

  const handleFrequencyChange = (value: FrequencyType) => {
    onUpdate({ 
      frequency: value,
      // Reset dependent fields when frequency changes
      dayOfWeek: value === 'weekly' || value === 'bi-weekly' ? [] : undefined,
      dayOfMonth: value === 'monthly' ? undefined : undefined,
      quarterMonth: value === 'quarterly' ? undefined : undefined
    });
    setSelectedDays([]);
  };

  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    let newDays: number[];
    if (checked) {
      newDays = [...selectedDays, day];
    } else {
      newDays = selectedDays.filter(d => d !== day);
    }
    setSelectedDays(newDays);
    onUpdate({ dayOfWeek: newDays });
  };

  const handleStartDateChange = (value: string) => {
    onUpdate({ startDate: value });
  };

  const handleStartTimeChange = (value: string) => {
    onUpdate({ startTime: value });
  };

  const handleEndDateChange = (value: string) => {
    onUpdate({ endDate: value });
  };

  const handleDayOfMonthChange = (value: string) => {
    onUpdate({ dayOfMonth: parseInt(value) });
  };

  const handleQuarterMonthChange = (value: string) => {
    onUpdate({ quarterMonth: parseInt(value) });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  // Get minimum time (current time + 1 hour)
  const now = new Date();
  now.setHours(now.getHours() + 1);
  const minTime = now.toTimeString().slice(0, 5);

  const isRecurring = formData.frequency && formData.frequency !== 'one-time';
  const needsDaySelection = formData.frequency === 'weekly' || formData.frequency === 'bi-weekly';
  const needsDayOfMonth = formData.frequency === 'monthly';
  const needsQuarterMonth = formData.frequency === 'quarterly';

  return (
    <div className="space-y-6">
      {/* Frequency Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Schedule Frequency</Label>
        <RadioGroup
          value={formData.frequency || 'one-time'}
          onValueChange={handleFrequencyChange}
          className="space-y-3"
        >
          {frequencyOptions.map((option) => (
            <div key={option.value} className="flex items-start space-x-3">
              <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Day of Week Selection (Weekly/Bi-weekly) */}
      <AnimatePresence>
        {needsDaySelection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                {formData.frequency === 'weekly' ? 'Days of Week' : 'Days of Week (Every 2 weeks)'}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Select which days of the week to run the scan. 
                      {formData.frequency === 'bi-weekly' && ' The scan will run every two weeks on the selected days.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {dayOfWeekOptions.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={(checked) => handleDayOfWeekChange(day.value, checked as boolean)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            
            {selectedDays.length === 0 && (
              <p className="text-sm text-destructive">
                Please select at least one day of the week
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day of Month Selection (Monthly) */}
      <AnimatePresence>
        {needsDayOfMonth && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Day of Month</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Select which day of the month to run the scan. 
                      If the selected day doesn&apos;t exist in a month, the scan will run on the last day of that month.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Select
              value={formData.dayOfMonth?.toString() || ''}
              onValueChange={handleDayOfMonthChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {dayOfMonthOptions.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quarter Month Selection (Quarterly) */}
      <AnimatePresence>
        {needsQuarterMonth && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Quarterly Months</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Select which months to run the quarterly scan. 
                      You can select multiple months for more frequent quarterly scans.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {monthOptions.map((month) => (
                <div key={month.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`month-${month.value}`}
                    checked={formData.quarterMonth === month.value}
                    onCheckedChange={(checked) => 
                      checked ? handleQuarterMonthChange(month.value.toString()) : onUpdate({ quarterMonth: undefined })
                    }
                  />
                  <Label htmlFor={`month-${month.value}`} className="text-sm cursor-pointer">
                    {month.label}
                  </Label>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="startDate" className="text-sm font-medium">
              Start Date
            </Label>
          </div>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={today}
            required
          />
          <p className="text-xs text-muted-foreground">
            When should the scan schedule begin?
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="startTime" className="text-sm font-medium">
              Start Time
            </Label>
          </div>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime || ''}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            min={formData.startDate === today ? minTime : undefined}
            required
          />
          <p className="text-xs text-muted-foreground">
            What time should the scan run? (24-hour format)
          </p>
        </div>
      </div>

      {/* End Date (for recurring schedules) */}
      <AnimatePresence>
        {isRecurring && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date (Optional)
              </Label>
            </div>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={formData.startDate || today}
            />
            <p className="text-xs text-muted-foreground">
              When should the recurring scan schedule end? Leave empty for indefinite scheduling.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
