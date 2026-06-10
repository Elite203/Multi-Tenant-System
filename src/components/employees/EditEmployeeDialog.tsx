import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const employeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  hire_date: z.date({
    required_error: "Hire date is required",
  }),
  date_of_birth: z.date().optional(),
  sex: z.enum(["male", "female"]).optional(),
  street_address: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  salary: z.number().positive().optional(),
  employee_type: z.enum(["staff", "manager", "director", "owner", "executive"]),
  status: z.enum(["active", "inactive", "on_leave", "terminated", "archived"]),
  manager_id: z.string().optional(),
  company_id: z.string({
    required_error: "Company is required",
  }),
  national_insurance_number: z.string()
    .min(1, "National Insurance Number is required")
    .regex(/^[A-Z]{2}[0-9]{6}[A-Z]?$/, "Invalid format. Use format like AB123456C"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Company {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  employee_number: string;
}

interface Department {
  id: string;
  name: string;
}

interface JobTitle {
  id: string;
  title: string;
}

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  hire_date: string;
  employee_type: string;
  status: string;
  address?: string;
  date_of_birth?: string;
  sex?: 'male' | 'female' | null;
  manager_id?: string;
  company_id: string;
  salary?: number;
  national_insurance_number?: string;
  immigration_status?: string;
  compliance_score?: number;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEmployeeUpdated: () => void;
}

export function EditEmployeeDialog({ open, onOpenChange, employee, onEmployeeUpdated }: EditEmployeeDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (open) {
      fetchCompaniesAndManagers();
    }
  }, [open]);

  useEffect(() => {
    if (employee) {
      form.reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email || "",
        phone: employee.phone || "",
        job_title: employee.job_title || "",
        department: employee.department || "",
        hire_date: new Date(employee.hire_date),
        date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth) : undefined,
        sex: employee.sex as "male" | "female" | undefined,
        street_address: (employee as any).street_address || "",
        address_line_2: (employee as any).address_line_2 || "",
        city: (employee as any).city || "",
        state_province: (employee as any).state_province || "",
        postal_code: (employee as any).postal_code || "",
        salary: employee.salary || undefined,
        employee_type: employee.employee_type as "staff" | "manager" | "director" | "owner" | "executive",
        status: employee.status as "active" | "inactive" | "on_leave" | "terminated" | "archived",
        manager_id: employee.manager_id || "no-manager",
        company_id: employee.company_id,
        national_insurance_number: employee.national_insurance_number || "",
      });
    }
  }, [employee, form]);

  const fetchCompaniesAndManagers = async () => {
    try {
      // Fetch companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (companiesData) setCompanies(companiesData);

      // Fetch potential managers (only owners, directors, and managers, exclude current employee)
      const { data: managersData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, job_title, employee_number')
        .eq('status', 'active')
        .in('employee_type', ['owner', 'director', 'manager'])
        .neq('id', employee?.id || '')
        .order('first_name');

      if (managersData) setManagers(managersData);

      // Fetch active departments
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (departmentsData) setDepartments(departmentsData);

      // Fetch active job titles
      const { data: jobTitlesData } = await supabase
        .from('job_titles')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (jobTitlesData) setJobTitles(jobTitlesData);
    } catch (error) {
      // Error handled by toast
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    if (!employee) return;

    try {
      setLoading(true);

      // Convert empty strings to null for optional fields and format dates
      const submitData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone || null,
        job_title: data.job_title || null,
        department: data.department || null,
        date_of_birth: data.date_of_birth ? data.date_of_birth.toISOString().split('T')[0] : null,
        sex: data.sex || null,
        hire_date: data.hire_date.toISOString().split('T')[0],
        street_address: data.street_address || null,
        address_line_2: data.address_line_2 || null,
        city: data.city || null,
        state_province: data.state_province || null,
        postal_code: data.postal_code || null,
        salary: data.salary || null,
        employee_type: data.employee_type,
        status: data.status,
        manager_id: data.manager_id === "no-manager" ? null : data.manager_id || null,
        company_id: data.company_id,
        national_insurance_number: data.national_insurance_number,
      };

      const { error } = await supabase
        .from('employees')
        .update(submitData)
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });

      onOpenChange(false);
      onEmployeeUpdated();
    } catch (error) {
      console.error('Employee update error:', error);
      toast({
        title: "Error",
        description: `Failed to update employee: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <DialogTitle>Edit Employee Profile</DialogTitle>
              <p className="text-base text-muted-foreground">Update information for {employee.first_name} {employee.last_name}</p>
            </div>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border/20 pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                 />
                 <FormField
                   control={form.control}
                   name="sex"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Sex</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value || ""}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Select sex" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="male">Male</SelectItem>
                           <SelectItem value="female">Female</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="street_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Main Street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address_line_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Apartment, suite, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="London" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state_province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="England" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SW1A 1AA" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border/20 pb-2">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a job title" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobTitles.map((jobTitle) => (
                              <SelectItem key={jobTitle.id} value={jobTitle.id}>
                                {jobTitle.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((department) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-manager">No Manager</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.first_name} {manager.last_name} {manager.job_title && `(${manager.job_title})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hire_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hire Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Salary (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employee_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* National Insurance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border/20 pb-2">Additional Information</h3>
              <FormField
                control={form.control}
                name="national_insurance_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National Insurance Number *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="e.g., AB123456C"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          // Only allow valid NI number characters and format
                          const sanitized = value.replace(/[^A-Z0-9]/g, '');
                          field.onChange(sanitized);
                        }}
                        maxLength={9}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}