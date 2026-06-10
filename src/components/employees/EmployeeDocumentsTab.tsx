import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Download, Eye, Upload, Folder } from "lucide-react";
import { DocumentUpload } from "./DocumentUpload";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface Document {
  id: string;
  document_name: string;
  document_category: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  expiry_date?: string;
  uploaded_at: string;
  uploaded_by?: string;
}

interface EmployeeDocumentsTabProps {
  employeeId: string;
  onUpdate: () => void;
}

export const EmployeeDocumentsTab = ({ employeeId, onUpdate }: EmployeeDocumentsTabProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { getEmployeePermissions } = usePermissions();
  const permissions = getEmployeePermissions();
  const { toast } = useToast();

  const documentCategories = [
    'All Documents',
    'Identity',
    'Immigration', 
    'Employment',
    'Financial',
    'Training',
    'Medical',
    'Other'
  ];

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, show empty state
        setDocuments([]);
      } else {
        // Map the database columns to our interface
        const mappedDocuments = (data || []).map(doc => ({
          id: doc.id,
          document_name: doc.name,
          document_category: doc.category,
          file_path: doc.file_path,
          file_size: doc.file_size,
          mime_type: doc.content_type,
          expiry_date: doc.expiry_date,
          uploaded_at: doc.created_at,
          uploaded_by: doc.uploaded_by
        }));
        setDocuments(mappedDocuments);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', text: 'Expired', color: 'destructive' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', text: `Expires in ${daysUntilExpiry} days`, color: 'outline' };
    return { status: 'valid', text: 'Valid', color: 'default' };
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'identity':
        return '🆔';
      case 'immigration':
        return '✈️';
      case 'employment':
        return '💼';
      case 'financial':
        return '💰';
      case 'training':
        return '📚';
      case 'medical':
        return '🏥';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const filteredDocuments = selectedCategory === "all" 
    ? documents 
    : documents.filter(doc => doc.document_category.toLowerCase() === selectedCategory.toLowerCase());

  const handleDocumentUploaded = () => {
    setShowUpload(false);
    fetchDocuments();
    onUpdate();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Documents Overview */}
      <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Management
            </div>
            {permissions.canCreate && (
              <Button
                size="sm"
                onClick={() => setShowUpload(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {documents.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(doc => {
                  const status = getExpiryStatus(doc.expiry_date);
                  return !doc.expiry_date || status?.status === 'valid';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Valid Documents</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {documents.filter(doc => {
                  const status = getExpiryStatus(doc.expiry_date);
                  return status?.status === 'expiring';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {documents.filter(doc => {
                  const status = getExpiryStatus(doc.expiry_date);
                  return status?.status === 'expired';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expired Documents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {documentCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category.replace('All Documents', 'all').toLowerCase() ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.replace('All Documents', 'all').toLowerCase())}
              >
                <Folder className="h-4 w-4 mr-2" />
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No documents found</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowUpload(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => {
                const expiryStatus = getExpiryStatus(document.expiry_date);
                
                return (
                  <div
                    key={document.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getCategoryIcon(document.document_category)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{document.document_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {document.document_category} • {formatFileSize(document.file_size)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {expiryStatus && (
                          <Badge variant={expiryStatus.color as any}>
                            {expiryStatus.text}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Uploaded:</span>
                        <span className="ml-2">{format(new Date(document.uploaded_at), 'MMM dd, yyyy')}</span>
                      </div>
                      
                      {document.expiry_date && (
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <span className="ml-2">{format(new Date(document.expiry_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      
                      {document.mime_type && (
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2">{document.mime_type}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentUpload
        employeeId={employeeId}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
};