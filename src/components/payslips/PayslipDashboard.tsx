import { useState, useEffect } from "react";
import { Search, Upload, Download, Filter, Calendar, CreditCard, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PayslipModal } from "./PayslipModal";
import { PayslipViewModal } from "./PayslipViewModal";
import { PayslipCard } from "./PayslipCard";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Payslip {
  id: string;
  employee_id: string;
  period: string;
  net_pay?: number;
  gross_pay?: number;
  tax?: number;
  ni?: number;
  pay_date?: string;
  status: string;
  file_url?: string;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

interface SummaryStats {
  latestNetPay: number;
  yearToDate: number;
  totalPayslips: number;
  payFrequency: string;
}

export const PayslipDashboard = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [filteredPayslips, setFilteredPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [sortBy, setSortBy] = useState("pay_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    latestNetPay: 0,
    yearToDate: 0,
    totalPayslips: 0,
    payFrequency: "Monthly"
  });

  const { getPayslipPermissions } = usePermissions();
  const permissions = getPayslipPermissions();
  const { toast } = useToast();

  useEffect(() => {
    fetchPayslips();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payslips, searchTerm, statusFilter, employeeFilter, periodFilter, sortBy, sortOrder]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_number)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payslips:', error);
        toast({
          title: "Error",
          description: "Failed to load payslips",
          variant: "destructive",
        });
        return;
      }

      setPayslips(data || []);
      calculateSummaryStats(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryStats = (payslipData: Payslip[]) => {
    const currentYear = new Date().getFullYear();
    const currentYearPayslips = payslipData.filter(p => 
      p.pay_date && new Date(p.pay_date).getFullYear() === currentYear
    );
    
    const latestPayslip = payslipData
      .filter(p => p.net_pay && p.pay_date)
      .sort((a, b) => new Date(b.pay_date!).getTime() - new Date(a.pay_date!).getTime())[0];

    const yearToDate = currentYearPayslips.reduce((sum, p) => sum + (p.net_pay || 0), 0);

    setSummaryStats({
      latestNetPay: latestPayslip?.net_pay || 0,
      yearToDate,
      totalPayslips: payslipData.length,
      payFrequency: "Monthly"
    });
  };

  const applyFilters = () => {
    let filtered = [...payslips];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.period?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Employee filter
    if (employeeFilter !== "all") {
      filtered = filtered.filter(p => p.employee_id === employeeFilter);
    }

    // Period filter
    if (periodFilter !== "all") {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filtered = filtered.filter(p => {
        if (!p.pay_date) return false;
        const payDate = new Date(p.pay_date);

        switch (periodFilter) {
          case "current_month":
            return payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear;
          case "last_month":
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return payDate.getMonth() === lastMonth && payDate.getFullYear() === lastMonthYear;
          case "current_year":
            return payDate.getFullYear() === currentYear;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "employee_name":
          aValue = `${a.employee?.first_name} ${a.employee?.last_name}`;
          bValue = `${b.employee?.first_name} ${b.employee?.last_name}`;
          break;
        case "net_pay":
          aValue = a.net_pay || 0;
          bValue = b.net_pay || 0;
          break;
        case "pay_date":
          aValue = a.pay_date ? new Date(a.pay_date).getTime() : 0;
          bValue = b.pay_date ? new Date(b.pay_date).getTime() : 0;
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPayslips(filtered);
  };

  const handleEdit = (payslip: Payslip) => {
    setEditingPayslip(payslip);
    setShowEditModal(true);
  };

  const handleDelete = async (payslip: Payslip) => {
    if (!permissions.canDelete) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete payslips.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the payslip for ${payslip.employee?.first_name} ${payslip.employee?.last_name} (${payslip.period})?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payslips')
        .delete()
        .eq('id', payslip.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Payslip deleted successfully.",
      });

      // Refresh the payslips list
      fetchPayslips();
    } catch (error) {
      console.error('Error deleting payslip:', error);
      toast({
        title: "Error",
        description: "Failed to delete payslip.",
        variant: "destructive",
      });
    }
  };

  const getUniqueEmployees = () => {
    const employees = payslips
      .filter(p => p.employee)
      .map(p => ({
        id: p.employee_id,
        name: `${p.employee!.first_name} ${p.employee!.last_name}`
      }));
    
    return Array.from(new Map(employees.map(e => [e.id, e])).values());
  };

  const getGroupedPayslips = () => {
    if (groupBy === "none") {
      return { "All Payslips": filteredPayslips };
    }

    return filteredPayslips.reduce((groups, payslip) => {
      let groupKey: string;

      switch (groupBy) {
        case "employee":
          groupKey = `${payslip.employee?.first_name} ${payslip.employee?.last_name}`;
          break;
        case "pay_month":
          groupKey = payslip.pay_date 
            ? new Date(payslip.pay_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'Unknown Period';
          break;
        case "pay_year":
          groupKey = payslip.pay_date 
            ? new Date(payslip.pay_date).getFullYear().toString()
            : 'Unknown Year';
          break;
        default:
          groupKey = "Other";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(payslip);
      return groups;
    }, {} as Record<string, Payslip[]>);
  };

  const handleDownloadAll = async () => {
    // Implementation for downloading all payslips
    toast({
      title: "Download Started",
      description: "Preparing payslips for download...",
    });
  };

  if (loading) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedPayslips = getGroupedPayslips();

  return (
    <div className="w-full p-6 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Payslip Management
        </h1>
        <p className="text-muted-foreground text-lg">
          {permissions.canCreate 
            ? "Manage employee payslips with AI-powered processing and automated workflows"
            : "View your payslips and financial information"
          }
        </p>
        <div className="flex gap-4 justify-center">
          {permissions.canCreate && (
            <Button
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Payslip
            </Button>
          )}
          <Button
            onClick={handleDownloadAll}
            variant="secondary"
            disabled={filteredPayslips.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Net Pay</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{summaryStats.latestNetPay.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent text-accent-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year to Date</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{summaryStats.yearToDate.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary text-secondary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payslips</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalPayslips}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pay Frequency</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.payFrequency}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payslips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {getUniqueEmployees().map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                <SelectItem value="current_month">Current Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="current_year">Current Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger>
                <SelectValue placeholder="Group By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="pay_month">Pay Month</SelectItem>
                <SelectItem value="pay_year">Pay Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order as "asc" | "desc");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pay_date-desc">Pay Date (Newest)</SelectItem>
                <SelectItem value="pay_date-asc">Pay Date (Oldest)</SelectItem>
                <SelectItem value="employee_name-asc">Employee (A-Z)</SelectItem>
                <SelectItem value="employee_name-desc">Employee (Z-A)</SelectItem>
                <SelectItem value="net_pay-desc">Net Pay (High-Low)</SelectItem>
                <SelectItem value="net_pay-asc">Net Pay (Low-High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Display */}
      <div className="space-y-6">
        {Object.entries(groupedPayslips).map(([groupName, groupPayslips]) => (
          <div key={groupName} className="space-y-4">
            {groupBy !== "none" && (
              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="text-lg font-semibold text-foreground">
                  {groupName}
                </h3>
                <Badge variant="secondary">{groupPayslips.length}</Badge>
                <div className="h-px bg-border flex-1"></div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupPayslips.map((payslip) => (
                <PayslipCard
                  key={payslip.id}
                  payslip={payslip}
                  onView={() => setSelectedPayslip(payslip)}
                  onEdit={() => handleEdit(payslip)}
                  onDelete={() => handleDelete(payslip)}
                  permissions={permissions}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredPayslips.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payslips found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || employeeFilter !== "all" || periodFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Get started by uploading your first payslip."}
              </p>
              {permissions.canCreate && (
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Payslip
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showUploadModal && (
        <PayslipModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchPayslips();
          }}
        />
      )}

      {selectedPayslip && (
        <PayslipViewModal
          payslip={selectedPayslip}
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}

      {showEditModal && editingPayslip && (
        <PayslipModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPayslip(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingPayslip(null);
            fetchPayslips();
          }}
        />
      )}
    </div>
  );
};