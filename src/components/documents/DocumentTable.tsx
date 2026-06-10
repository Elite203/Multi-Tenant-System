import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Users, 
  Building2,
  HardDrive
} from "lucide-react";
import { Document } from "@/hooks/useDocuments";
import { useSorting } from "@/hooks/useSorting";
import { usePermissions } from "@/hooks/usePermissions";


interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  onDelete: (id: string) => void;
  entityType: 'employee' | 'company';
}

export function DocumentTable({ documents, loading, onDelete, entityType }: DocumentTableProps) {
  const { canManageEmployees } = usePermissions();
  const { sortedData: sortedDocuments, sortConfig, requestSort } = useSorting(documents, { 
    key: 'created_at', 
    direction: 'desc' 
  });

  const getExpiryStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", variant: "destructive" as const, text: "Expired" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring", variant: "secondary" as const, text: `Expires in ${daysUntilExpiry} days` };
    }
    return { status: "valid", variant: "outline" as const, text: "Valid" };
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

  const handleDelete = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      onDelete(documentId);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading documents...</p>
      </div>
    );
  }

  if (sortedDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
        <p className="text-muted-foreground">
          No {entityType} documents have been uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={requestSort}>
              Name
            </SortableTableHead>
            <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={requestSort}>
              Category
            </SortableTableHead>
            <TableHead>Entity</TableHead>
            <SortableTableHead sortKey="size_mb" currentSort={sortConfig} onSort={requestSort}>
              Size
            </SortableTableHead>
            <SortableTableHead sortKey="expiry_date" currentSort={sortConfig} onSort={requestSort}>
              Expiry
            </SortableTableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDocuments.map((document) => {
            const expiryStatus = getExpiryStatus(document.expiry_date);
            
            return (
              <TableRow key={document.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{document.name}</span>
                      {document.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-40">
                          {document.notes}
                        </p>
                      )}
                    </div>
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
                  <div className="flex items-center gap-2">
                    {document.employee_id ? (
                      <>
                        <Users className="h-4 w-4 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {document.employee_name || 'Unknown Employee'}
                          </span>
                          {document.employee_number && (
                            <span className="text-xs text-muted-foreground">
                              #{document.employee_number}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                          {document.company_name || 'Unknown Company'}
                        </span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3 w-3 text-muted-foreground" />
                    {document.size_mb ? (
                      <span className="text-sm">{document.size_mb.toFixed(2)} MB</span>
                    ) : document.file_size ? (
                      <span className="text-sm">{(document.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unknown</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {expiryStatus ? (
                    <Badge variant={expiryStatus.variant}>
                      {expiryStatus.text}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No expiry</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                    {canManageEmployees && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
  );
}