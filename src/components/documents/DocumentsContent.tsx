import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Users, 
  Building2, 
  Upload, 
  Search,
  FolderOpen,
  Archive,
  Clock,
  HardDrive
} from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { DocumentTable } from "./DocumentTable";

export function DocumentsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showEmployeeUpload, setShowEmployeeUpload] = useState(false);
  const [showCompanyUpload, setShowCompanyUpload] = useState(false);
  const { documents, loading, stats, fetchAllDocuments, deleteDocument } = useDocuments();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchAllDocuments({
      searchTerm: term,
      category: typeFilter !== "all" ? typeFilter : undefined,
    });
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    fetchAllDocuments({
      searchTerm: searchTerm || undefined,
      category: type !== "all" ? type : undefined,
    });
  };

  const employeeDocuments = documents.filter(doc => doc.employee_id);
  const companyDocuments = documents.filter(doc => doc.company_id);

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Hero Header Section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Document Management System
        </h2>
        <p className="text-muted-foreground text-lg mt-2 max-w-2xl mx-auto">
          Comprehensive document handling for employees and companies with AI-powered processing and smart categorization
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowEmployeeUpload(true)}
          >
            <Users className="h-4 w-4" />
            Employee Documents
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowCompanyUpload(true)}
          >
            <Building2 className="h-4 w-4" />
            Company Documents
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-elegant border-0 bg-gradient-card hover-lift hover:bg-orange/5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0 bg-gradient-card hover-lift hover:bg-orange/5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center shadow-glow">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.employee}</p>
                <p className="text-sm text-muted-foreground">Employee Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0 bg-gradient-card hover-lift hover:bg-orange/5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-glow">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.company}</p>
                <p className="text-sm text-muted-foreground">Company Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0 bg-gradient-card hover-lift hover:bg-orange/5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center shadow-glow">
                <HardDrive className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSizeMB.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Size (MB)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <Card className="shadow-elegant border-0 bg-gradient-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="employment">Employment</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Document View */}
      <Tabs defaultValue="employee" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee Documents
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
              {employeeDocuments.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Documents
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
              {companyDocuments.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employee" className="mt-6">
          <Card className="shadow-elegant border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Documents ({employeeDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentTable 
                documents={employeeDocuments}
                loading={loading}
                onDelete={deleteDocument}
                entityType="employee"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <Card className="shadow-elegant border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Documents ({companyDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentTable 
                documents={companyDocuments}
                loading={loading}
                onDelete={deleteDocument}
                entityType="company"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Modals */}
      <DocumentUploadModal
        open={showEmployeeUpload}
        onOpenChange={setShowEmployeeUpload}
        entityType="employee"
        onUploadComplete={() => {
          setShowEmployeeUpload(false);
          fetchAllDocuments();
        }}
      />

      <DocumentUploadModal
        open={showCompanyUpload}
        onOpenChange={setShowCompanyUpload}
        entityType="company"
        onUploadComplete={() => {
          setShowCompanyUpload(false);
          fetchAllDocuments();
        }}
      />
    </div>
  );
}