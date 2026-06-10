import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProfileData, UserProfile, LeaveBalance, EmergencyContact, FormValidationError } from '@/types/profile';

export const useUnifiedProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData>({
    profile: null,
    leaveBalances: [],
    emergencyContacts: [],
    isEmployee: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<FormValidationError[]>([]);

  const validateForm = (updates: Partial<UserProfile>): FormValidationError[] => {
    const errors: FormValidationError[] = [];
    
    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }
    
    if (updates.phone && updates.phone.length > 0 && updates.phone.length < 10) {
      errors.push({ field: 'phone', message: 'Phone number must be at least 10 digits' });
    }
    
    if (updates.first_name && updates.first_name.trim().length < 2) {
      errors.push({ field: 'first_name', message: 'First name must be at least 2 characters' });
    }
    
    if (updates.last_name && updates.last_name.trim().length < 2) {
      errors.push({ field: 'last_name', message: 'Last name must be at least 2 characters' });
    }
    
    return errors;
  };

  const fetchAllData = async () => {
    if (authLoading) {
      return;
    }
    
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Fetch profile data first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // If no profile exists, create one
      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
          })
          .select()
          .single();

        if (createError) throw createError;
        
        setData({
          profile: newProfile,
          leaveBalances: [],
          emergencyContacts: [],
          isEmployee: false,
        });
        return;
      }

      // Initialize profile with basic data
      let combinedProfile: UserProfile = {
        id: profileData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
        address: profileData.address,
        bio: profileData.bio,
        role: profileData.role,
      };

      let isEmployee = false;
      let leaveData: LeaveBalance[] = [];
      let contactsData: EmergencyContact[] = [];

      // Check if user is an employee and get employee data
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!empError && employeeData) {
        isEmployee = true;
        
        // Get related data
        const [departmentData, jobTitleData, companyData, managerData] = await Promise.all([
          employeeData.department ? supabase.from('departments').select('name').eq('id', employeeData.department).single() : { data: null },
          employeeData.job_title ? supabase.from('job_titles').select('title').eq('id', employeeData.job_title).single() : { data: null },
          employeeData.company_id ? supabase.from('companies').select('name').eq('id', employeeData.company_id).single() : { data: null },
          employeeData.manager_id ? supabase.from('employees').select('first_name, last_name').eq('id', employeeData.manager_id).single() : { data: null }
        ]);
        
        // Merge employee data into profile
        combinedProfile = {
          ...combinedProfile,
          employee_id: employeeData.id,
          employee_number: employeeData.employee_number,
          department_name: departmentData.data?.name,
          job_title_name: jobTitleData.data?.title,
          start_date: employeeData.start_date,
          company_name: companyData.data?.name,
          hire_date: employeeData.hire_date,
          salary: employeeData.salary,
          employee_type: employeeData.employee_type,
          status: employeeData.status,
          manager_name: managerData.data 
            ? `${managerData.data.first_name} ${managerData.data.last_name}`
            : undefined,
          national_insurance_number: employeeData.national_insurance_number,
        };

        // Fetch employee-specific data in parallel
        const [leaveResponse, contactsResponse] = await Promise.all([
          // Fetch leave balances
          supabase
            .from('leave_balances')
            .select('*')
            .eq('employee_id', employeeData.id)
            .eq('year', new Date().getFullYear()),
          
          // Fetch emergency contacts
          supabase
            .from('emergency_contacts')
            .select('*')
            .eq('employee_id', employeeData.id)
            .order('priority_order', { ascending: true })
        ]);

        if (!leaveResponse.error) {
          leaveData = leaveResponse.data || [];
        }

        if (!contactsResponse.error) {
          contactsData = contactsResponse.data || [];
        }
      }

      setData({
        profile: combinedProfile,
        leaveBalances: leaveData,
        emergencyContacts: contactsData,
        isEmployee,
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return false;
    
    // Validate form data
    const validationErrors = validateForm(updates);
    setErrors(validationErrors);
    
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before saving",
        variant: "destructive",
      });
      return false;
    }
    
    setIsUpdating(true);
    try {
      // Only update profile fields (not employee-specific fields)
      const profileUpdates = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        phone: updates.phone,
        address: updates.address,
        bio: updates.bio,
        avatar_url: updates.avatar_url,
      };

      // Remove undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(profileUpdates).filter(([_, value]) => value !== undefined)
      );

      const { error } = await supabase
        .from('profiles')
        .update(cleanUpdates)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setData(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null,
      }));
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) return false;

    // Enhanced file validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return false;
    }

    setIsUpdating(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: data.publicUrl });
      return true;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const addEmergencyContact = async (contactData: Omit<EmergencyContact, 'id' | 'employee_id'>) => {
    if (!data.profile?.employee_id) return false;

    setIsUpdating(true);
    try {
      // If setting as primary, update other contacts first
      if (contactData.is_primary) {
        await supabase
          .from('emergency_contacts')
          .update({ is_primary: false })
          .eq('employee_id', data.profile.employee_id);
      }

      const { data: newContact, error } = await supabase
        .from('emergency_contacts')
        .insert({
          ...contactData,
          employee_id: data.profile.employee_id,
        })
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        emergencyContacts: [...prev.emergencyContacts, newContact],
      }));

      toast({
        title: "Success",
        description: "Emergency contact added successfully",
      });
      return true;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to add emergency contact",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateEmergencyContact = async (id: string, updates: Partial<EmergencyContact>) => {
    if (!data.profile?.employee_id) return false;

    setIsUpdating(true);
    try {
      // If setting as primary, update other contacts first
      if (updates.is_primary) {
        await supabase
          .from('emergency_contacts')
          .update({ is_primary: false })
          .eq('employee_id', data.profile.employee_id)
          .neq('id', id);
      }

      const { error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.map(contact =>
          contact.id === id ? { ...contact, ...updates } : contact
        ),
      }));

      toast({
        title: "Success",
        description: "Emergency contact updated successfully",
      });
      return true;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to update emergency contact",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteEmergencyContact = async (id: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.filter(contact => contact.id !== id),
      }));

      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      });
      return true;
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?.id, authLoading]);

  return {
    ...data,
    isLoading,
    isUpdating,
    errors,
    updateProfile,
    uploadAvatar,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    refetch: fetchAllData,
    clearErrors: () => setErrors([]),
  };
};