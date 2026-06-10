import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  Upload, 
  Folder,
  Building2,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { DocumentUploadModal } from "../documents/DocumentUploadModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocuments } from "@/hooks/useDocuments";
import { format } from "date-fns";

interface CompanyDocumentsTabProps {
  companyId: string;
  onUpdate: () => void;
}

export const CompanyDocumentsTab = ({ companyId, onUpdate }: CompanyDocumentsTabProps) => {
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { getEmployeePermissions } = usePermissions();
  const permissions = getEmployeePermissions();
  
  const { 
    documents, 
    loading, 
    stats, 
    fetchDocuments, 
    deleteDocument 
  } = useDocuments(companyId, 'company');

  const documentCategories = [
    'All Documents',
    'Legal',
    'Financial', 
    'HR Policies',
    'Operational',
    'Compliance',
    'Insurance',
    'Contracts'
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      doc.category.toLowerCase() === selectedCategory.replace('All Documents', 'all').toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', text: 'Expired', variant: 'destructive' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', text: `Expires in ${daysUntilExpiry} days`, variant: 'secondary' };
    return { status: 'valid', text: 'Valid', variant: 'outline' };
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'legal':
        return '⚖️';
      case 'financial':
        return '💰';
      case 'hr policies':
        return '👥';
      case 'operational':
        return '⚙️';
      case 'compliance':
        return '✓';
      case 'insurance':
        return '🛡️';
      case 'contracts':
        return '📝';
      default:
        return '📄';
    }
  };

  const handleDocumentUploaded = () => {
    setShowUpload(false);
    fetchDocuments();
    onUpdate();
  };

  const handleDelete = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocument(documentId);
    }
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
      {/* Company Documents Overview */}
      <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Document Management
            </div>
            {permissions.canCreate && (
              <Button
                size="sm"
                onClick={() => setShowUpload(true)}
                className="bg-gradient-primary hover:opacity-90 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/60 rounded-xl shadow-sm border">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
            
            <div className="text-center p-4 bg-background/60 rounded-xl shadow-sm border">
              <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(doc => {
                  const status = getExpiryStatus(doc.expiry_date);
                  return !doc.expiry_date || status?.status === 'valid';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Valid Documents</p>
            </div>
            
            <div className="text-center p-4 bg-background/60 rounded-xl shadow-sm border">
              <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {documents.filter(doc => {
                  const status = getExpiryStatus(doc.expiry_date);
                  return status?.status === 'expiring';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
            
            <div className="text-center p-4 bg-background/60 rounded-xl shadow-sm border">
              <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
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

      {/* Search and Filter Controls */}
      <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search company documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {documentCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category.replace('All Documents', 'all').toLowerCase() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.replace('All Documents', 'all').toLowerCase())}
                  className="hover-scale"
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Document Library ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Upload company documents to get started"}
              </p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  onClick={() => setShowUpload(true)}
                  className="hover-scale"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => {
                const expiryStatus = getExpiryStatus(document.expiry_date);
                
                return (
                  <Card 
                    key={document.id}
                    className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20 border-l-4 border-l-primary/20 hover:border-l-primary"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">
                            {getCategoryIcon(document.category)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                              {document.name}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              {document.category}
                            </Badge>
                          </div>
                        </div>
                        
                        {expiryStatus && (
                          <Badge variant={expiryStatus.variant as any} className="ml-2">
                            {expiryStatus.text}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span>{format(new Date(document.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        
                        {document.expiry_date && (
                          <div className="flex justify-between">
                            <span>Expires:</span>
                            <span>{format(new Date(document.expiry_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        
                        {document.size_mb && (
                          <div className="flex justify-between">
                            <span>Size:</span>
                            <span>{document.size_mb.toFixed(2)} MB</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1 hover-scale">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 hover-scale">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        {permissions.canDelete && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(document.id)}
                            className="text-destructive hover:text-destructive hover-scale"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUpload && (
        <DocumentUploadModal
          open={showUpload}
          onOpenChange={setShowUpload}
          entityType="company"
          onUploadComplete={handleDocumentUploaded}
        />
      )}
    </div>
  );
};