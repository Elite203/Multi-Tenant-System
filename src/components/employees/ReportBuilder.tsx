import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Filter, Search, Calendar, Users, Building2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

import { useAuth } from "@/contexts/AuthContext";

type ReportType = "employee_directory" | "compliance" | "payroll" | "department" | "custom";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  fields: string[];
  filters: Record<string, string | number | boolean>;
}

interface ReportData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
  metadata: {
    total: number;
    generated: string;
    filters: Record<string, string | number | boolean>;
  };
}

const reportTemplates: ReportTemplate[] = [
  {
    id: "employee_directory",
    name: "Employee Directory",
    description: "Complete listing of all employees with contact information",
    type: "employee_directory",
    fields: ["first_name", "last_name", "employee_number", "job_title", "department", "email", "phone", "status"],
    filters: { status: "active", include_contact: true }
  },
  {
    id: "compliance_report",
    name: "Compliance Report",
    description: "Document expiry and compliance status overview",
    type: "compliance",
    fields: ["first_name", "last_name", "department", "document_count", "expiring_docs", "compliance_status"],
    filters: { include_expired: true, include_expiring: true }
  },
  {
    id: "payroll_summary",
    name: "Payroll Summary",
    description: "Salary information and payroll analysis (HR/Admin only)",
    type: "payroll",
    fields: ["first_name", "last_name", "employee_number", "department", "salary", "employee_type"],
    filters: { status: "active", include_salary: true }
  },
  {
    id: "department_breakdown",
    name: "Department Breakdown",
    description: "Employee distribution and statistics by department",
    type: "department",
    fields: ["department", "total_employees", "avg_tenure", "recent_hires", "avg_salary"],
    filters: { group_by: "department" }
  }
];

export function ReportBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | number | boolean>>({});
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { profile } = useAuth();
  const { canViewSensitiveData } = usePermissions();

  const canViewSalaries = canViewSensitiveData;
  const canGenerateReports = canViewSensitiveData;

  useEffect(() => {
    if (selectedTemplate) {
      setSelectedFields(selectedTemplate.fields);
      setFilters(selectedTemplate.filters);
    }
  }, [selectedTemplate]);

  const generateReport = async () => {
    if (!selectedTemplate || !canGenerateReports) return;

    try {
      setLoading(true);

      let query = supabase.from('employees').select(`
        id,
        employee_number,
        first_name,
        last_name,
        email,
        phone,
        job_title,
        department,
        status,
        employee_type,
        salary,
        hire_date,
        created_at,
        company:companies(name)
      `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status as "active" | "inactive" | "on_leave" | "terminated" | "archived");
      }

      if (filters.department) {
        query = query.eq('department', filters.department as string);
      }

      const { data: employees, error } = await query.order('first_name');

      if (error) throw error;

      let headers: string[] = [];
      let rows: (string | number | boolean | null)[][] = [];

      if (selectedTemplate.type === "employee_directory") {
        headers = selectedFields.map(field => {
          const fieldNames: Record<string, string> = {
            first_name: "First Name",
            last_name: "Last Name",
            employee_number: "Employee #",
            job_title: "Job Title",
            department: "Department",
            email: "Email",
            phone: "Phone",
            status: "Status",
          };
          return fieldNames[field] || field;
        });

        rows = (employees || [])
          .filter(emp => 
            !searchTerm || 
            emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(emp => {
            return selectedFields.map(field => {
              switch (field) {
                case 'first_name': return emp.first_name;
                case 'last_name': return emp.last_name;
                case 'employee_number': return emp.employee_number;
                case 'job_title': return emp.job_title || 'N/A';
                case 'department': return emp.department || 'N/A';
                case 'email': return emp.email || 'N/A';
                case 'phone': return emp.phone || 'N/A';
                case 'status': return emp.status;
                default: return 'N/A';
              }
            });
          });
      }

      if (selectedTemplate.type === "compliance") {
        // Fetch document data for compliance report
        const { data: documents } = await supabase
          .from('documents')
          .select('employee_id, expiry_date, is_active');

        headers = ["Employee", "Department", "Total Docs", "Expiring Soon", "Status"];
        
        rows = (employees || []).map(emp => {
          const empDocs = documents?.filter(doc => doc.employee_id === emp.id && doc.is_active) || [];
          const expiringDocs = empDocs.filter(doc => {
            if (!doc.expiry_date) return false;
            const expiryDate = new Date(doc.expiry_date);
            const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            return expiryDate <= thirtyDaysFromNow;
          });

          const status = expiringDocs.length > 0 ? "Action Required" : "Compliant";

          return [
            `${emp.first_name} ${emp.last_name}`,
            emp.department || 'N/A',
            empDocs.length,
            expiringDocs.length,
            status
          ];
        });
      }

      if (selectedTemplate.type === "payroll" && canViewSalaries) {
        headers = ["Employee", "ID", "Department", "Type", "Salary"];
        
        rows = (employees || [])
          .filter(emp => emp.salary && emp.salary > 0)
          .map(emp => [
            `${emp.first_name} ${emp.last_name}`,
            emp.employee_number,
            emp.department || 'N/A',
            emp.employee_type,
            `£${emp.salary?.toLocaleString() || 0}`
          ]);
      }

      if (selectedTemplate.type === "department") {
        const departments = [...new Set((employees || []).map(emp => emp.department).filter(Boolean))];
        
        headers = ["Department", "Total Employees", "Avg Tenure (Years)", "Recent Hires", "Avg Salary"];
        
        rows = departments.map(dept => {
          const deptEmployees = (employees || []).filter(emp => emp.department === dept);
          const avgTenure = deptEmployees.reduce((sum, emp) => {
            const tenure = (Date.now() - new Date(emp.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
            return sum + tenure;
          }, 0) / deptEmployees.length;

          const recentHires = deptEmployees.filter(emp => {
            const hireDate = new Date(emp.hire_date);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return hireDate >= thirtyDaysAgo;
          }).length;

          const avgSalary = canViewSalaries ? 
            deptEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / deptEmployees.length : 0;

          return [
            dept,
            deptEmployees.length,
            Math.round(avgTenure * 10) / 10,
            recentHires,
            canViewSalaries ? `£${Math.round(avgSalary).toLocaleString()}` : 'N/A'
          ];
        });
      }

      setReportData({
        headers,
        rows,
        metadata: {
          total: rows.length,
          generated: new Date().toISOString(),
          filters
        }
      });

      toast({
        title: "Success",
        description: `Report generated with ${rows.length} records`,
      });

    } catch (error) {
      // Error handled by toast
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvContent = [
      reportData.headers.join(','),
      ...reportData.rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported successfully",
    });
  };

  if (!canGenerateReports) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You need HR or Admin privileges to generate reports.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Templates */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportTemplates
                .filter(template => 
                  template.type !== "payroll" || canViewSalaries
                )
                .map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {template.type.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status Filter</label>
                    <Select 
                      value={(filters.status as string) || "all"} 
                      onValueChange={(value) => setFilters({...filters, status: value === "all" ? undefined : value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="inactive">Inactive Only</SelectItem>
                        <SelectItem value="terminated">Terminated Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Field Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Fields to Include</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={field}
                          checked={selectedFields.includes(field)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFields([...selectedFields, field]);
                            } else {
                              setSelectedFields(selectedFields.filter(f => f !== field));
                            }
                          }}
                        />
                        <label htmlFor={field} className="text-sm">
                          {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex gap-3">
                  <Button 
                    onClick={generateReport} 
                    disabled={loading || selectedFields.length === 0}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {loading ? "Generating..." : "Generate Report"}
                  </Button>
                  
                  {reportData && (
                    <Button 
                      variant="outline"
                      onClick={exportToCSV}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a report template to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      {reportData && (
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Report Preview</CardTitle>
              <div className="text-sm text-muted-foreground">
                {reportData.metadata.total} records generated on {new Date(reportData.metadata.generated).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {reportData.headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.rows.slice(0, 10).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reportData.rows.length > 10 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  Showing first 10 of {reportData.rows.length} records. Export to see all data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}