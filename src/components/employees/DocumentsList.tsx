import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Download, Eye, Trash2, Search, Filter, Calendar, AlertCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSorting } from "@/hooks/useSorting";
import { DocumentUpload } from "./DocumentUpload";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface Document {
  id: string;
  name: string;
  category: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  expiry_date: string | null;
  created_at: string;
  uploaded_by: string | null;
}

interface DocumentsListProps {
  employeeId: string;
  onDocumentUpdate?: () => void;
}

export function DocumentsList({ employeeId, onDocumentUpdate }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const { toast } = useToast();
  const { canManageEmployees } = usePermissions();

  const canManage = canManageEmployees;

  // Apply filtering first, then sorting
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    
    if (showExpiringSoon) {
      if (!doc.expiry_date) return false;
      const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return matchesSearch && matchesCategory && daysUntilExpiry <= 30;
    }
    
    return matchesSearch && matchesCategory;
  });

  // Use sorting hook with filtered data
  const { sortedData: sortedDocuments, sortConfig, requestSort } = useSorting(filteredDocuments, { key: 'created_at', direction: 'desc' });

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!canManage) return;

    if (confirm("Are you sure you want to delete this document?")) {
      try {
        const { error } = await supabase
          .from('documents')
          .update({ is_active: false })
          .eq('id', documentId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
        if (onDocumentUpdate) {
          onDocumentUpdate();
        } else {
          fetchDocuments();
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", variant: "destructive" as const, text: "Expired" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring", variant: "secondary" as const, text: `Expires in ${daysUntilExpiry} days` };
    }
    return { status: "valid", variant: "outline" as const, text: `Expires ${expiry.toLocaleDateString()}` };
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      personal: "bg-blue-100 text-blue-800 border-blue-200",
      certificate: "bg-green-100 text-green-800 border-green-200",
      employment: "bg-purple-100 text-purple-800 border-purple-200",
      financial: "bg-yellow-100 text-yellow-800 border-yellow-200",
      compliance: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };


  const expiringDocuments = documents.filter(doc => {
    if (!doc.expiry_date) return false;
    const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  });

  const expiredDocuments = documents.filter(doc => {
    if (!doc.expiry_date) return false;
    const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry < 0;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts for expiring/expired documents */}
      {expiredDocuments.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Expired Documents</h4>
            <p className="text-sm">
              {expiredDocuments.length} document(s) have expired and need immediate attention.
            </p>
          </div>
        </Alert>
      )}

      {expiringDocuments.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Documents Expiring Soon</h4>
            <p className="text-sm">
              {expiringDocuments.length} document(s) will expire within 30 days.
            </p>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({documents.length})
            </CardTitle>
            {canManage && <DocumentUpload 
              employeeId={employeeId} 
              onDocumentUploaded={onDocumentUpdate || fetchDocuments} 
            />}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="employment">Employment</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showExpiringSoon ? "default" : "outline"}
              onClick={() => setShowExpiringSoon(!showExpiringSoon)}
              className="w-full md:w-auto"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Expiring Soon
            </Button>
          </div>

          {/* Documents Table */}
          {sortedDocuments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={requestSort}>Name</SortableTableHead>
                    <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={requestSort}>Category</SortableTableHead>
                    <SortableTableHead sortKey="expiry_date" currentSort={sortConfig} onSort={requestSort}>Expiry</SortableTableHead>
                    <SortableTableHead sortKey="file_size" currentSort={sortConfig} onSort={requestSort}>Size</SortableTableHead>
                    <SortableTableHead sortKey="created_at" currentSort={sortConfig} onSort={requestSort}>Uploaded</SortableTableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDocuments.map((document) => {
                    const expiryStatus = getExpiryStatus(document.expiry_date);
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{document.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getCategoryBadgeColor(document.category)}
                          >
                            {document.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {expiryStatus ? (
                            <Badge variant={expiryStatus.variant}>
                              {expiryStatus.text}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No expiry</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {new Date(document.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(document.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== "all" || showExpiringSoon
                  ? "Try adjusting your search or filters"
                  : "Upload documents to get started"}
              </p>
              {canManage && (
                <DocumentUpload 
                  employeeId={employeeId} 
                  onDocumentUploaded={onDocumentUpdate || fetchDocuments} 
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}