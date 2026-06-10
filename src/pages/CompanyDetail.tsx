import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { ArrowLeft, Building2, Users, Phone, Mail, Globe, MapPin, FileText, Edit, Trash2, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { EditCompanyDialog } from "@/components/companies/EditCompanyDialog";

interface Company {
  id: string;
  name: string;
  company_code: string | null;
  parent_company_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  registration_number: string | null;
  tax_number: string | null;
  is_active: boolean;
  has_sponsor_license: boolean;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  status: string;
}

const CompanyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [parentCompany, setParentCompany] = useState<Company | null>(null);
  const [childCompanies, setChildCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);

  const { canManageEmployees } = usePermissions();
  const canManage = canManageEmployees;

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);

      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch all companies for edit dialog
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      setAllCompanies(companiesData || []);

      // Fetch parent company if exists
      if (companyData.parent_company_id) {
        const { data: parentData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyData.parent_company_id)
          .single();
        setParentCompany(parentData);
      }

      // Fetch child companies
      const { data: childData } = await supabase
        .from('companies')
        .select('*')
        .eq('parent_company_id', id)
        .eq('is_active', true);
      setChildCompanies(childData || []);

      // Fetch employees with related data
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id, 
          employee_number, 
          first_name, 
          last_name, 
          status,
          job_title,
          department
        `)
        .eq('company_id', id);

      if (employeeError) {
        console.error('Error fetching employees:', employeeError);
      }

      // Fetch job titles and departments for name resolution
      const jobTitleIds = [...new Set(employeeData?.map(emp => emp.job_title).filter(Boolean))];
      const departmentIds = [...new Set(employeeData?.map(emp => emp.department).filter(Boolean))];

      const [jobTitlesData, departmentsData] = await Promise.all([
        jobTitleIds.length > 0 ? supabase.from('job_titles').select('id, title').in('id', jobTitleIds) : { data: [] },
        departmentIds.length > 0 ? supabase.from('departments').select('id, name').in('id', departmentIds) : { data: [] }
      ]);

      const jobTitlesMap = new Map<string, string>();
      jobTitlesData.data?.forEach(jt => jobTitlesMap.set(jt.id, jt.title));
      
      const departmentsMap = new Map<string, string>();
      departmentsData.data?.forEach(d => departmentsMap.set(d.id, d.name));
      
      // Transform the data to match the Employee interface
      const transformedEmployees = employeeData?.map(emp => ({
        id: emp.id,
        employee_number: emp.employee_number,
        first_name: emp.first_name,
        last_name: emp.last_name,
        status: emp.status,
        job_title: emp.job_title ? jobTitlesMap.get(emp.job_title) || null : null,
        department: emp.department ? departmentsMap.get(emp.department) || null : null
      })) || [];
      
      setEmployees(transformedEmployees);

    } catch (error) {
      console.error('Error fetching company details:', error);
      toast({
        title: "Error",
        description: "Failed to load company details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSponsorLicenseToggle = async (checked: boolean) => {
    if (!company || !canManage) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ has_sponsor_license: checked })
        .eq('id', company.id);

      if (error) throw error;

      setCompany({ ...company, has_sponsor_license: checked });
      toast({
        title: "Success",
        description: `Sponsor license ${checked ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating sponsor license:', error);
      toast({
        title: "Error",
        description: "Failed to update sponsor license",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!company || !canManage) return;

    if (confirm(`Are you sure you want to delete ${company.name}?`)) {
      try {
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', company.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Company deleted successfully",
        });
        navigate('/companies');
      } catch (error) {
        console.error('Error deleting company:', error);
        toast({
          title: "Error",
          description: "Failed to delete company",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = () => {
    
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchCompanyDetails();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Company not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/companies')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                {company.name}
              </h1>
              <p className="text-muted-foreground">
                Company Details • Code: {company.company_code || 'N/A'}
              </p>
            </div>
          </div>
          {canManage && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={company.is_active ? "default" : "secondary"}>
                        {company.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company Code</label>
                    <p className="mt-1">{company.company_code || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                    <p className="mt-1">{company.registration_number || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tax Number</label>
                    <p className="mt-1">{company.tax_number || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Sponsor License
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      {canManage ? (
                        <Switch 
                          checked={company.has_sponsor_license}
                          onCheckedChange={handleSponsorLicenseToggle}
                        />
                      ) : (
                        <Badge variant={company.has_sponsor_license ? "default" : "secondary"}>
                          {company.has_sponsor_license ? "Licensed" : "Not Licensed"}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {company.has_sponsor_license ? "This company can sponsor employees" : "This company cannot sponsor employees"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="mt-1">{company.address}</p>
                    </div>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="mt-1">{company.phone}</p>
                    </div>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="mt-1">
                        <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                          {company.email}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Website</label>
                      <p className="mt-1">
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {company.website}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employees */}
            <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employees ({employees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employees.length > 0 ? (
                  <div className="space-y-3">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {employee.job_title || 'No title'} • {employee.department || 'No department'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">#{employee.employee_number}</Badge>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                          <Link to={`/employees/${employee.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No employees assigned to this company</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parent Company */}
            {parentCompany && (
              <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
                <CardHeader>
                  <CardTitle className="text-sm">Parent Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to={`/companies/${parentCompany.id}`}>
                    <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <p className="font-medium">{parentCompany.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parentCompany.company_code || 'No code'}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Child Companies */}
            {childCompanies.length > 0 && (
              <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
                <CardHeader>
                  <CardTitle className="text-sm">Subsidiaries ({childCompanies.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {childCompanies.map((child) => (
                      <Link key={child.id} to={`/companies/${child.id}`}>
                        <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <p className="font-medium">{child.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {child.company_code || 'No code'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Employees</span>
                  <span className="font-medium">{employees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Employees</span>
                  <span className="font-medium">
                    {employees.filter(e => e.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subsidiaries</span>
                  <span className="font-medium">{childCompanies.length}</span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  <p>Created: {new Date(company.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(company.updated_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Company Dialog */}
        <EditCompanyDialog
          company={company}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
          allCompanies={allCompanies}
        />
      </div>
    </Layout>
  );
};

export default CompanyDetail;