import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface FilterState {
  search: string;
  status: string;
  module: string;
  dateRange: string;
}

interface ImportHistoryFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  modules: string[];
}

export function ImportHistoryFilters({ filters, onFiltersChange, modules }: ImportHistoryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      module: '',
      dateRange: ''
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.module || filters.dateRange;
  const activeFilterCount = [filters.search, filters.status, filters.module, filters.dateRange]
    .filter(Boolean).length;

  return (
    <Card className="shadow-soft border-0">
      <CardContent className="p-4 space-y-4">
        {/* Quick Search and Filter Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="validation_failed">Validation Failed</SelectItem>
                  <SelectItem value="importing">Importing</SelectItem>
                  <SelectItem value="validating">Validating</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <Select value={filters.module} onValueChange={(value) => handleFilterChange('module', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="quarter">This quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
                <button onClick={() => handleFilterChange('search', '')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="gap-1">
                Status: {filters.status}
                <button onClick={() => handleFilterChange('status', '')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.module && (
              <Badge variant="secondary" className="gap-1">
                Module: {filters.module}
                <button onClick={() => handleFilterChange('module', '')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.dateRange && (
              <Badge variant="secondary" className="gap-1">
                Date: {filters.dateRange}
                <button onClick={() => handleFilterChange('dateRange', '')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}