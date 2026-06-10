import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Filter, Calendar, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ReportHistoryItem {
  id: string;
  name: string;
  type: string;
  generatedAt: Date;
  generatedBy: string;
  recordCount: number;
  size: string;
  status: 'completed' | 'failed' | 'processing';
}

// Mock data - in real implementation, this would come from database
const mockReportHistory: ReportHistoryItem[] = [
  {
    id: '1',
    name: 'Employee Directory Export',
    type: 'employee_directory',
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    generatedBy: 'Sarah Johnson',
    recordCount: 156,
    size: '2.3 MB',
    status: 'completed'
  },
  {
    id: '2',
    name: 'Compliance Report Q4',
    type: 'compliance',
    generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    generatedBy: 'Michael Chen',
    recordCount: 89,
    size: '1.8 MB',
    status: 'completed'
  },
  {
    id: '3',
    name: 'Department Analysis',
    type: 'department',
    generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    generatedBy: 'Emma Davis',
    recordCount: 12,
    size: '0.5 MB',
    status: 'completed'
  },
  {
    id: '4',
    name: 'Payroll Summary',
    type: 'payroll',
    generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    generatedBy: 'David Kim',
    recordCount: 142,
    size: '3.1 MB',
    status: 'completed'
  },
  {
    id: '5',
    name: 'Leave Analytics',
    type: 'leave',
    generatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    generatedBy: 'Lisa Wong',
    recordCount: 67,
    size: '1.2 MB',
    status: 'failed'
  }
];

export function ReportsHistory() {
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>(mockReportHistory);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReports, setFilteredReports] = useState<ReportHistoryItem[]>(mockReportHistory);
  const { toast } = useToast();

  useEffect(() => {
    const filtered = reportHistory.filter(report =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.generatedBy.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReports(filtered);
  }, [searchTerm, reportHistory]);

  const handleDownload = (report: ReportHistoryItem) => {
    // In real implementation, this would download the actual file
    toast({
      title: "Download Started",
      description: `Downloading ${report.name}...`,
    });
  };

  const handleDelete = (reportId: string) => {
    setReportHistory(prev => prev.filter(report => report.id !== reportId));
    toast({
      title: "Report Deleted",
      description: "Report has been removed from history",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'employee_directory':
        return '👥';
      case 'compliance':
        return '✅';
      case 'payroll':
        return '💰';
      case 'department':
        return '🏢';
      case 'leave':
        return '📅';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status: ReportHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-lg font-semibold">Report History</h2>
          <p className="text-sm text-muted-foreground">View and manage previously generated reports</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{reportHistory.length}</p>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{reportHistory.filter(r => r.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{reportHistory.filter(r => r.status === 'failed').length}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {(reportHistory.reduce((sum, r) => sum + parseFloat(r.size.split(' ')[0]), 0)).toFixed(1)} MB
              </p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(report.type)}</span>
                          <div>
                            <p className="font-medium">{report.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDistanceToNow(report.generatedAt, { addSuffix: true })}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.generatedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{report.generatedBy}</TableCell>
                      <TableCell>{report.recordCount}</TableCell>
                      <TableCell>{report.size}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {report.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(report)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}