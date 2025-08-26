// src/components/dashboard/DashboardLayoutConfig.tsx
"use client";

import React, { useState } from 'react';
import { Settings, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { DashboardConfig, DashboardLayoutConfigProps } from '@/types/dashboard';

const defaultConfig: DashboardConfig = {
  showQuickStats: true,
  showCharts: true,
  showRecentTransactions: true,
  showBudgetProgress: true,
  showInsights: false,
  compactMode: false,
  autoRefresh: true,
};

export const DashboardLayoutConfig: React.FC<DashboardLayoutConfigProps> = ({
  config,
  onConfigChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfigUpdate = (key: keyof DashboardConfig, value: boolean) => {
    onConfigChange({
      ...config,
      [key]: value
    });
  };

  const resetToDefault = () => {
    onConfigChange(defaultConfig);
  };

  const getVisibleSectionsCount = () => {
    return Object.entries(config).filter(([key, value]) => 
      key.startsWith('show') && value === true
    ).length;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings className="h-4 w-4 mr-2" />
          Layout
          <Badge variant="secondary" className="ml-2">
            {getVisibleSectionsCount()}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Dashboard Layout</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="text-xs"
            >
              Reset
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-xs font-medium text-gray-600">
                VISIBLE SECTIONS
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {config.showQuickStats ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <Label htmlFor="quick-stats" className="text-sm">
                      Financial Overview
                    </Label>
                  </div>
                  <Switch
                    id="quick-stats"
                    checked={config.showQuickStats}
                    onCheckedChange={(checked) => 
                      handleConfigUpdate('showQuickStats', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {config.showBudgetProgress ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <Label htmlFor="budget-progress" className="text-sm">
                      Budget Progress
                    </Label>
                  </div>
                  <Switch
                    id="budget-progress"
                    checked={config.showBudgetProgress}
                    onCheckedChange={(checked) => 
                      handleConfigUpdate('showBudgetProgress', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {config.showCharts ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <Label htmlFor="charts" className="text-sm">
                      Charts & Analytics
                    </Label>
                  </div>
                  <Switch
                    id="charts"
                    checked={config.showCharts}
                    onCheckedChange={(checked) => 
                      handleConfigUpdate('showCharts', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {config.showRecentTransactions ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <Label htmlFor="recent-transactions" className="text-sm">
                      Recent Transactions
                    </Label>
                  </div>
                  <Switch
                    id="recent-transactions"
                    checked={config.showRecentTransactions}
                    onCheckedChange={(checked) => 
                      handleConfigUpdate('showRecentTransactions', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {config.showInsights ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <Label htmlFor="insights" className="text-sm">
                      Smart Insights
                    </Label>
                  </div>
                  <Switch
                    id="insights"
                    checked={config.showInsights}
                    onCheckedChange={(checked) => 
                      handleConfigUpdate('showInsights', checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <Label className="text-xs font-medium text-gray-600">
                DISPLAY OPTIONS
              </Label>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode" className="text-sm">
                  Compact Mode
                </Label>
                <Switch
                  id="compact-mode"
                  checked={config.compactMode}
                  onCheckedChange={(checked) => 
                    handleConfigUpdate('compactMode', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh" className="text-sm">
                  Auto Refresh
                </Label>
                <Switch
                  id="auto-refresh"
                  checked={config.autoRefresh}
                  onCheckedChange={(checked) => 
                    handleConfigUpdate('autoRefresh', checked)
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="text-xs text-gray-500">
              Showing {getVisibleSectionsCount()} of 5 sections
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Hook to manage dashboard configuration
export const useDashboardConfig = () => {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-config');
      if (saved) {
        try {
          return { ...defaultConfig, ...JSON.parse(saved) };
        } catch {
          return defaultConfig;
        }
      }
    }
    return defaultConfig;
  });

  const updateConfig = (newConfig: DashboardConfig) => {
    setConfig(newConfig);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-config', JSON.stringify(newConfig));
    }
  };

  return {
    config,
    updateConfig
  };
};

export default DashboardLayoutConfig;