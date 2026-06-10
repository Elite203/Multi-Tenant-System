import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Shift {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_avatar?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  shift_type_name: string;
  shift_type_color: string;
  location_name: string;
  department_name: string;
}
import { 
  Clock, 
  Users, 
  Calendar, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Copy
} from "lucide-react";
import { RotaCalendarView } from "@/components/rota/RotaCalendarView";
import { ShiftManagementModal } from "@/components/rota/ShiftManagementModal";
import { useRotaShifts } from "@/hooks/useRotaShifts";
import { useRotaStats } from "@/hooks/useRotaStats";
import { addDays, startOfWeek } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function RotaPage() {
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  
  // Use real ROTA data hooks
  const weekEnd = addDays(currentWeek, 6);
  const { shifts, isLoading, error, refetch } = useRotaShifts(currentWeek, weekEnd);
  const { stats, isLoading: statsLoading } = useRotaStats(currentWeek, weekEnd);
  
  // Filter shifts based on search term
  const filteredShifts = shifts.filter((shift: Shift) => 
    shift.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.shift_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const handleAddShift = () => {
    setSelectedShift(null);
    setIsAddShiftModalOpen(true);
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsAddShiftModalOpen(true);
  };

  const handleSaveShift = async () => {
    setIsAddShiftModalOpen(false);
    setSelectedShift(null);
    await refetch();
    toast({
      title: "Success",
      description: selectedShift ? "Shift updated successfully" : "Shift created successfully",
    });
  };

  const handleExport = () => {
    // Create CSV content with actual shift data
    const csvHeader = "Date,Employee,Start Time,End Time,Shift Type,Location,Status\n";
    const csvRows = filteredShifts.map((shift: Shift) => 
      `${shift.date},${shift.employee_name},${shift.start_time},${shift.end_time},${shift.shift_type_name},${shift.location_name},${shift.status}`
    ).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rota-week-${currentWeek.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `Exported ${filteredShifts.length} shifts to CSV`,
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Handle file import logic here
        toast({
          title: "Import Started",
          description: `Processing file: ${file.name}`,
        });
      }
    };
    input.click();
  };

  const handleDuplicateWeek = async () => {
    if (shifts.length === 0) {
      toast({
        title: "No Shifts",
        description: "No shifts found in current week to duplicate",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Feature Coming Soon",
      description: "Week duplication will be available in the next update",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            ROTA Scheduling
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage employee schedules, shifts, and workforce planning
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleImport} variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={handleDuplicateWeek} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Week
            </Button>
          </div>
          <Button onClick={handleAddShift} className="bg-gradient-to-r from-blue-500 to-purple-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Total Shifts", value: stats?.total_shifts || 0, icon: Clock, gradient: "from-blue-500 to-cyan-500" },
            { title: "Employees", value: stats?.unique_employees || 0, icon: Users, gradient: "from-purple-500 to-pink-500" },
            { title: "Total Hours", value: Math.round(stats?.total_hours || 0), icon: Calendar, gradient: "from-orange-500 to-red-500" },
            { title: "Confirmed", value: stats?.confirmed_shifts || 0, icon: Clock, gradient: "from-green-500 to-emerald-500" }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stat.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Current week
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Week Navigation & Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Week Navigation */}
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">
                    {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Week View
                  </h3>
                  <p className="text-sm text-muted-foreground">Navigate weeks</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search shifts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROTA Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RotaCalendarView
              shifts={filteredShifts}
              weekStart={currentWeek}
              onShiftClick={handleShiftClick}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Shift Management Modal */}
        <ShiftManagementModal
          isOpen={isAddShiftModalOpen}
          onClose={() => {
            setIsAddShiftModalOpen(false);
            setSelectedShift(null);
          }}
          shift={selectedShift}
          onSave={handleSaveShift}
        />

      </div>
    </Layout>
  );
}