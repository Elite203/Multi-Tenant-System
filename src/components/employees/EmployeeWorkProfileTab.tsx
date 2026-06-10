import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Clock, Mail, Phone, MapPin, Calendar, Users, Edit, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { WorkProfileForm } from "./WorkProfileForm";
import { 
  EmployeeWorkProfile,
  WorkProfileSkills,
  WorkProfileLanguages
} from "@/types/workProfile";

interface EmployeeWorkProfileTabProps {
  employeeId: string;
  workProfile?: EmployeeWorkProfile | null;
  onWorkProfileUpdate?: () => void;
}

export const EmployeeWorkProfileTab = ({ 
  employeeId, 
  workProfile: propsWorkProfile, 
  onWorkProfileUpdate 
}: EmployeeWorkProfileTabProps) => {
  const [workProfile, setWorkProfile] = useState<EmployeeWorkProfile | null>(propsWorkProfile || null);
  const [loading, setLoading] = useState(!propsWorkProfile);
  const [formOpen, setFormOpen] = useState(false);
  const { toast } = useToast();
  const { getEmployeePermissions } = usePermissions();
  const permissions = getEmployeePermissions();

  useEffect(() => {
    if (propsWorkProfile) {
      setWorkProfile(propsWorkProfile);
      setLoading(false);
    } else {
      fetchWorkProfile();
    }
  }, [employeeId, propsWorkProfile]);

  const fetchWorkProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employee_work_profiles')
        .select(`
          *,
          sponsored_by_company:companies!sponsored_by_company_id(name)
        `)
        .eq('employee_id', employeeId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const sponsoredByCompany = Array.isArray(data.sponsored_by_company) 
          ? data.sponsored_by_company[0] 
          : data.sponsored_by_company;

        setWorkProfile({
          ...data,
          sponsored_by_company_name: sponsoredByCompany?.name || null,
          skills: (data.skills as any) || {},
          languages: (data.languages as any) || {},
          work_preferences: (data.work_preferences as any) || {},
          availability: (data.availability as any) || {},
          performance_metrics: (data.performance_metrics as any) || {}
        } as EmployeeWorkProfile);
      } else {
        setWorkProfile(null);
      }
    } catch (error) {
      console.error('Error fetching work profile:', error);
      toast({
        title: "Error",
        description: "Failed to load work profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    fetchWorkProfile();
    if (onWorkProfileUpdate) {
      onWorkProfileUpdate();
    }
  };

  if (loading) {
    return <div className="p-6">Loading work profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Work Details */}
      <Card className="shadow-elegant hover:shadow-hero">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Building className="h-4 w-4 text-white" />
            </div>
            Work Details
          </CardTitle>
          {workProfile && permissions.canUpdate && (
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {workProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {workProfile.soc_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SOC Number</label>
                    <p className="font-mono">{workProfile.soc_number}</p>
                  </div>
                )}
                {workProfile.work_email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work Email</label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${workProfile.work_email}`} className="text-primary hover:underline">
                        {workProfile.work_email}
                      </a>
                    </p>
                  </div>
                )}
                {workProfile.work_phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work Phone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {workProfile.work_phone}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {workProfile.work_location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work Location</label>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {workProfile.work_location}
                    </p>
                  </div>
                )}
                {workProfile.weekly_working_hours && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Weekly Working Hours</label>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {workProfile.weekly_working_hours} hours
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sponsored By</label>
                  <p className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {workProfile.sponsored_by_company_name || "None"}
                  </p>
                </div>
                {workProfile.start_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(workProfile.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {workProfile.end_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(workProfile.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No work profile information available</p>
              {permissions.canCreate && (
                <Button variant="outline" className="mt-2" onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Work Profile
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills & Preferences */}
      {workProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills */}
          {workProfile.skills && (
            <Card className="shadow-soft hover:shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-accent flex items-center justify-center">
                    <Users className="h-3 w-3 text-white" />
                  </div>
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(workProfile.skills as WorkProfileSkills).map(([skill, level]) => (
                    <Badge key={skill} variant="secondary">
                      {skill}: {level}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Languages */}
          {workProfile.languages && (
            <Card className="shadow-soft hover:shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-hero flex items-center justify-center">
                    <Building className="h-3 w-3 text-white" />
                  </div>
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(workProfile.languages as WorkProfileLanguages).map(([language, level]) => (
                    <Badge key={language} variant="outline">
                      {language}: {level}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Career Information */}
      {workProfile && (workProfile.career_goals || workProfile.remote_work_preference || workProfile.travel_willingness) && (
        <Card className="shadow-elegant hover:shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-primary flex items-center justify-center">
                <Calendar className="h-3 w-3 text-white" />
              </div>
              Career Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workProfile.career_goals && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Career Goals</label>
                  <p className="mt-1">{workProfile.career_goals}</p>
                </div>
              )}
              {workProfile.remote_work_preference && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Remote Work Preference</label>
                  <Badge variant="outline" className="mt-1">
                    {workProfile.remote_work_preference}
                  </Badge>
                </div>
              )}
              {workProfile.travel_willingness && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Travel Willingness</label>
                  <Badge variant="outline" className="mt-1">
                    {workProfile.travel_willingness}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <WorkProfileForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        employeeId={employeeId}
        workProfile={workProfile}
      />
    </div>
  );
};