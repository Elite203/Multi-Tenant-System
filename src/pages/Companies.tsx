import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { EditCompanyDialog } from '@/components/companies/EditCompanyDialog';
import { 
  Plus, Building2, MapPin, Phone, Mail, Globe, Pencil, Trash2, Eye, 
  Search, Filter, Grid3X3, List, SortAsc, SortDesc, Archive, Users, User, Building
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  company_code?: string;
  parent_company_id?: string;
  holding_company_id?: string;
  description?: string;
  address?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_id?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
  registration_number?: string;
  owner?: string;
  director?: string;
  employee_count: number;
  status: string;
  logo?: string;
  is_active: boolean;
  has_sponsor_license: boolean;
  created_at: string;
  parent_company?: {
    name: string;
  };
  holding_company?: {
    name: string;
  };
  country?: {
    name: string;
  };
  child_companies?: Company[];
}

export default function Companies() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_code: '',
    parent_company_id: '',
    street_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country_id: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    tax_number: '',
    registration_number: '',
    has_sponsor_license: false,
  });
  const [countries, setCountries] = useState<Array<{id: string, name: string}>>([]);

  const { canManageEmployees } = usePermissions();
  const canManageCompanies = canManageEmployees;

  // Calculated stats
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.is_active).length;
  const sponsorLicensedCompanies = companies.filter(c => c.has_sponsor_license).length;
  const parentCompanies = companies.filter(c => !c.parent_company_id);

  // Filter and sort companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchTerm || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.company_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && company.is_active) ||
      (statusFilter === "inactive" && !company.is_active);

    const matchesLicense = licenseFilter === "all" ||
      (licenseFilter === "sponsor" && company.has_sponsor_license) ||
      (licenseFilter === "no-sponsor" && !company.has_sponsor_license);

    return matchesSearch && matchesStatus && matchesLicense;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    let aValue = a[sortField as keyof Company] as string | number;
    let bValue = b[sortField as keyof Company] as string | number;
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  useEffect(() => {
    fetchCompanies();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          parent_company:companies!parent_company_id(name),
          holding_company:companies!holding_company_id(name),
          country:countries(name),
          child_companies:companies!parent_company_id(*)
        `)
        .order('name');

      if (error) throw error;
      setCompanies((data as any) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const companyData = {
        name: formData.name.trim(),
        company_code: formData.company_code?.trim() || null,
        street_address: formData.street_address?.trim() || null,
        city: formData.city?.trim() || null,
        state_province: formData.state_province?.trim() || null,
        postal_code: formData.postal_code?.trim() || null,
        country_id: formData.country_id || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        website: formData.website?.trim() || null,
        description: formData.description?.trim() || null,
        registration_number: formData.registration_number?.trim() || null,
        has_sponsor_license: formData.has_sponsor_license,
        parent_company_id: formData.parent_company_id === 'none' ? null : formData.parent_company_id || null,
        status: 'active',
        is_active: true,
      };

      const { error } = await supabase
        .from('companies')
        .insert([companyData]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Company created successfully",
      });

      setAddDialogOpen(false);
      resetForm();
      fetchCompanies();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while creating the company",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchCompanies();
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      
      fetchCompanies();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company_code: '',
      parent_company_id: 'none',
      street_address: '',
      city: '',
      state_province: '',
      postal_code: '',
      country_id: '',
      phone: '',
      email: '',
      website: '',
      description: '',
      tax_number: '',
      registration_number: '',
      has_sponsor_license: false,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Companies Management
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Manage your organization's company structure and subsidiary relationships
            </p>
          </div>
          {canManageCompanies && (
            <Button 
              className="bg-gradient-hero text-white hover:shadow-glow transition-all duration-200"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          )}
        </div>

        {/* Stats Dashboard */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Companies"
            value={totalCompanies}
            icon={Building2}
            className="bg-gradient-to-br from-primary/10 to-primary/5 border-brown/60"
          />
          <StatsCard
            title="Active Companies"
            value={activeCompanies}
            icon={Building}
            className="bg-gradient-to-br from-accent/10 to-accent/5 border-brown/60"
          />
          <StatsCard
            title="Parent Companies"
            value={parentCompanies.length}
            icon={Users}
            className="bg-gradient-to-br from-primary/10 to-accent/10 border-brown/60"
          />
          <StatsCard
            title="Sponsor Licensed"
            value={sponsorLicensedCompanies}
            icon={User}
            className="bg-gradient-to-br from-accent/10 to-primary/5 border-brown/60"
          />
        </div>

        {/* Enhanced Filter System */}
        <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setStatusFilter("all")}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  All Status
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setStatusFilter("active")}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setStatusFilter("inactive")}
                >
                  Inactive
                </Button>
                <Button
                  variant={licenseFilter === "sponsor" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setLicenseFilter(licenseFilter === "sponsor" ? "all" : "sponsor")}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Sponsor Licensed
                </Button>
              </div>
              <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                <SelectTrigger className="w-full lg:w-[200px] rounded-xl">
                  <SelectValue placeholder="License Type" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-card border-brown shadow-hero">
                  <SelectItem value="all">All License Types</SelectItem>
                  <SelectItem value="sponsor">Sponsor Licensed</SelectItem>
                  <SelectItem value="no-sponsor">No Sponsor License</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Search and Controls */}
        <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies by name, code, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-background/50 border-border/50"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select 
                  value={`${sortField}-${sortDirection}`} 
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-');
                    setSortField(field);
                    setSortDirection(direction as "asc" | "desc");
                  }}
                >
                  <SelectTrigger className="w-[180px] rounded-xl">
                    <div className="flex items-center gap-2">
                      {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-card border-brown shadow-hero">
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as "grid" | "table")}
                  className="border rounded-xl p-1 bg-background/50"
                >
                  <ToggleGroupItem value="grid" className="rounded-lg">
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" className="rounded-lg">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Display */}
        {sortedCompanies.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedCompanies.map((company) => {
                const hasSponsorLicense = company.has_sponsor_license;
                return (
                  <Link key={company.id} to={`/companies/${company.id}`}>
                     <Card className={`relative cursor-pointer border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20 ${
                       hasSponsorLicense 
                         ? 'shadow-xl shadow-primary/40 border-primary/20' 
                         : ''
                     }`}>
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <Badge 
                          variant={company.is_active ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {company.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <CardContent className="p-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center text-center mb-4">
                          <div className="h-16 w-16 rounded-full bg-gradient-primary text-white flex items-center justify-center mb-3 shadow-glow">
                            <Building2 className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {company.name}
                          </h3>
                          {company.company_code && (
                            <Badge variant="secondary" className="mt-1">{company.company_code}</Badge>
                          )}
                        </div>

                        {/* Company Details */}
                        <div className="space-y-2 text-sm">
                          {company.parent_company && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Parent:</span> {company.parent_company.name}
                            </p>
                          )}
                          {company.child_companies && company.child_companies.length > 0 && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Subsidiaries:</span> {company.child_companies.length}
                            </p>
                          )}
                          {company.employee_count > 0 && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Employees:</span> {company.employee_count}
                            </p>
                          )}
                        </div>

                        {/* Sponsor License Badge */}
                        {hasSponsorLicense && (
                          <div className="mt-4 pt-3 border-t border-brown/20">
                            <Badge variant="outline" className="w-full justify-center bg-gradient-primary text-white border-primary">
                              ✨ Sponsor Licensed Company
                            </Badge>
                          </div>
                        )}

                        {/* Quick Info */}
                        <div className="mt-4 pt-3 border-t border-brown/20 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {company.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{company.city || company.address}</span>
                            </div>
                          )}
                          {company.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span className="truncate">Website</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
              <CardContent className="p-0">
                <div className="divide-y divide-brown/30">
                  {sortedCompanies.map((company) => {
                    const hasSponsorLicense = company.has_sponsor_license;
                    return (
                      <div
                        key={company.id}
                        className={`p-6 hover:bg-brown/5 transition-colors cursor-pointer ${
                          hasSponsorLicense ? 'bg-gradient-to-r from-primary/10 to-accent/10' : ''
                        }`}
                        onClick={() => window.location.href = `/companies/${company.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-primary text-white flex items-center justify-center">
                              <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{company.name}</h3>
                                {company.company_code && (
                                  <Badge variant="secondary">{company.company_code}</Badge>
                                )}
                                <Badge variant={company.is_active ? 'default' : 'secondary'}>
                                  {company.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                {hasSponsorLicense && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Sponsor Licensed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {company.parent_company ? (
                                  <>Child of {company.parent_company.name}</>
                                ) : (
                                  <>Parent company{company.child_companies && company.child_companies.length > 0 && ` • ${company.child_companies.length} subsidiaries`}</>
                                )}
                                {company.employee_count > 0 && (
                                  <> • {company.employee_count} employees</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link to={`/companies/${company.id}`} onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canManageCompanies && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(company);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(company.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {company.address && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{company.address}</span>
                            </div>
                          )}
                          {company.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{company.phone}</span>
                            </div>
                          )}
                          {company.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{company.email}</span>
                            </div>
                          )}
                          {company.website && (
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={company.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {company.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No companies found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first company.'}
              </p>
              {canManageCompanies && !searchTerm && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Company
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Company Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl bg-gradient-card border-brown">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>
                Create a new company in your organization
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_code">Company Code</Label>
                      <Input
                        id="company_code"
                        value={formData.company_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_code: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parent_company">Parent Company</Label>
                    <Select
                      value={formData.parent_company_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, parent_company_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent company (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent company</SelectItem>
                        {parentCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street_address">Street Address</Label>
                    <Input
                      id="street_address"
                      value={formData.street_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state_province">State/Province</Label>
                      <Input
                        id="state_province"
                        value={formData.state_province}
                        onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country_id">Country</Label>
                      <Select
                        value={formData.country_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, country_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax_number">Tax Number</Label>
                      <Input
                        id="tax_number"
                        value={formData.tax_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registration_number">Registration Number</Label>
                      <Input
                        id="registration_number"
                        value={formData.registration_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_sponsor_license"
                      checked={formData.has_sponsor_license}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_sponsor_license: checked }))}
                    />
                    <Label htmlFor="has_sponsor_license">Has Sponsor License</Label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Company
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

        {/* Edit Company Dialog */}
        <EditCompanyDialog
          company={selectedCompany}
          isOpen={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedCompany(null);
          }}
          onSuccess={handleEditSuccess}
          allCompanies={companies}
        />
      </div>
    </Layout>
  );
}