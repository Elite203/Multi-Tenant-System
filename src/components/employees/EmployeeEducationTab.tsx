import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Award, Archive, RotateCcw, Trash2, Plus, Edit, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { CertificationForm } from "./CertificationForm";
import { EducationForm } from "./EducationForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EducationRecord, CertificationRecord } from "@/types/employeeDocuments";

interface EmployeeCertification {
  id: string;
  certification_name: string;
  issuing_organization: string;
  certification_number?: string;
  issue_date?: string;
  expiry_date?: string;
  is_active: boolean;
  requires_renewal: boolean;
  document_path?: string;
  archived_at?: string;
}

interface EmployeeEducationTabProps {
  employeeId: string;
  certifications: EmployeeCertification[];
  education: EducationRecord[];
  onCertificationUpdated?: () => void;
  onEducationUpdated?: () => void;
}

export function EmployeeEducationTab({ 
  employeeId, 
  certifications, 
  education, 
  onCertificationUpdated, 
  onEducationUpdated 
}: EmployeeEducationTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCertificationPermissions, getEducationPermissions } = usePermissions();
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [editingCertification, setEditingCertification] = useState<any>(null);
  const [editingEducation, setEditingEducation] = useState<any>(null);

  const certificationPermissions = getCertificationPermissions();
  const educationPermissions = getEducationPermissions();

  const getExpiryStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return { status: 'no-expiry', color: 'bg-secondary', text: 'No Expiry' };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) {
      return { status: 'expired', color: 'bg-destructive', text: 'Expired' };
    } else if (diffDays <= 30) {
      return { status: 'expiring-soon', color: 'bg-orange-500', text: 'Expiring Soon' };
    } else {
      return { status: 'valid', color: 'bg-green-500', text: 'Valid' };
    }
  };

  const handleArchiveCertification = async (certificationId: string) => {
    try {
      const { error } = await supabase
        .from("employee_certifications")
        .update({ 
          is_active: false,
          archived_at: new Date().toISOString(),
          archived_by: user?.id 
        })
        .eq("id", certificationId);

      if (error) throw error;

      toast({
        title: "Certification archived",
        description: "The certification has been archived successfully.",
      });

      onCertificationUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error archiving certification",
        description: error instanceof Error ? error.message : "Failed to archive certification",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCertification = async (certificationId: string) => {
    try {
      const { error } = await supabase
        .from("employee_certifications")
        .delete()
        .eq("id", certificationId);

      if (error) throw error;

      toast({
        title: "Certification deleted",
        description: "The certification has been permanently deleted.",
      });

      onCertificationUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error deleting certification",
        description: error instanceof Error ? error.message : "Failed to delete certification",
        variant: "destructive",
      });
    }
  };

  const handleRestoreCertification = async (certificationId: string) => {
    try {
      const { error } = await supabase
        .from("employee_certifications")
        .update({ 
          is_active: true,
          archived_at: null,
          archived_by: null 
        })
        .eq("id", certificationId);

      if (error) throw error;

      toast({
        title: "Certification restored",
        description: "The certification has been restored successfully.",
      });

      onCertificationUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error restoring certification",
        description: error instanceof Error ? error.message : "Failed to archive education record",
        variant: "destructive",
      });
    }
  };

  const handleEditCertification = (certification: CertificationRecord) => {
    setEditingCertification(certification);
    setShowCertificationForm(true);
  };

  const handleEditEducation = (educationRecord: EducationRecord) => {
    setEditingEducation(educationRecord);
    setShowEducationForm(true);
  };

  const handleArchiveEducation = async (educationId: string) => {
    try {
      const { error } = await supabase
        .from("employee_education")
        .update({ 
          archived_at: new Date().toISOString(),
          archived_by: user?.id 
        })
        .eq("id", educationId);

      if (error) throw error;

      toast({
        title: "Education record archived",
        description: "The education record has been archived successfully.",
      });

      onEducationUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error archiving education record",
        description: error instanceof Error ? error.message : "Failed to delete education record",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEducation = async (educationId: string) => {
    try {
      const { error } = await supabase
        .from("employee_education")
        .delete()
        .eq("id", educationId);

      if (error) throw error;

      toast({
        title: "Education record deleted",
        description: "The education record has been permanently deleted.",
      });

      onEducationUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error deleting education record",
        description: error instanceof Error ? error.message : "Failed to restore certification",
        variant: "destructive",
      });
    }
  };

  const handleRestoreEducation = async (educationId: string) => {
    try {
      const { error } = await supabase
        .from("employee_education")
        .update({ 
          archived_at: null,
          archived_by: null 
        })
        .eq("id", educationId);

      if (error) throw error;

      toast({
        title: "Education record restored",
        description: "The education record has been restored successfully.",
      });

      onEducationUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error restoring education record",
        description: error instanceof Error ? error.message : "Failed to restore education record",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Professional Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Professional Certifications
            </div>
            {certificationPermissions.canCreate && (
              <Button 
                onClick={() => setShowCertificationForm(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certifications && certifications.length > 0 ? (
            <div className="space-y-4">
              {certifications.map((cert) => {
                const expiryStatus = getExpiryStatus(cert.expiry_date);
                const isArchived = !!cert.archived_at;
                
                return (
                  <div key={cert.id} className={`border rounded-lg p-4 space-y-3 ${isArchived ? 'opacity-60 bg-muted/50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{cert.certification_name}</h4>
                        <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                        {cert.certification_number && (
                          <p className="text-sm font-mono text-muted-foreground">
                            #{cert.certification_number}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={expiryStatus.color}>
                          {expiryStatus.text}
                        </Badge>
                        {!cert.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {isArchived && (
                          <Badge variant="outline">Archived</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {cert.issue_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {cert.expiry_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {cert.requires_renewal && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Award className="h-4 w-4" />
                        <span>Requires periodic renewal</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {certificationPermissions.canUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCertification(cert as any)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {certificationPermissions.canArchive && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive Certification</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to archive this certification? It will be hidden from the main view but can be restored later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleArchiveCertification(cert.id)}
                              >
                                Archive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {certificationPermissions.canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Certification</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete this certification? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCertification(cert.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {cert.archived_at && certificationPermissions.canArchive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreCertification(cert.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No certifications found. Click "Add Certification" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Education History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education History
            </div>
            {educationPermissions.canCreate && (
              <Button 
                onClick={() => setShowEducationForm(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {education && education.length > 0 ? (
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{edu.institution_name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {edu.degree_type && <p>Degree: {edu.degree_type}</p>}
                        {edu.field_of_study && <p>Field: {edu.field_of_study}</p>}
                        {edu.grade_gpa && <p>Grade/GPA: {edu.grade_gpa}</p>}
                        {(edu.start_date || edu.graduation_date) && (
                          <p>
                            {edu.start_date && new Date(edu.start_date).getFullYear()} 
                            {edu.start_date && edu.graduation_date && " - "}
                            {edu.graduation_date && new Date(edu.graduation_date).getFullYear()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={edu.is_completed ? "default" : "secondary"}>
                          {edu.is_completed ? "Completed" : "In Progress"}
                        </Badge>
                        {edu.archived_at && (
                          <Badge variant="outline">Archived</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {educationPermissions.canUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEducation(edu)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {educationPermissions.canArchive && !edu.archived_at && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive Education Record</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to archive this education record? It will be hidden from the main view but can be restored later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleArchiveEducation(edu.id)}
                              >
                                Archive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {educationPermissions.canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Education Record</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete this education record? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteEducation(edu.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {edu.archived_at && educationPermissions.canArchive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreEducation(edu.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No education records found. Click "Add Education" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Forms */}
      <CertificationForm
        isOpen={showCertificationForm}
        onClose={() => {
          setShowCertificationForm(false);
          setEditingCertification(null);
        }}
        employeeId={employeeId}
        certification={editingCertification}
        onSuccess={() => {
          onCertificationUpdated?.();
          setEditingCertification(null);
        }}
      />

      <EducationForm
        isOpen={showEducationForm}
        onClose={() => {
          setShowEducationForm(false);
          setEditingEducation(null);
        }}
        employeeId={employeeId}
        education={editingEducation}
        onSuccess={() => {
          onEducationUpdated?.();
          setEditingEducation(null);
        }}
      />
    </div>
  );
}