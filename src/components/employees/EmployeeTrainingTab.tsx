import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Archive,
  RotateCcw, 
  Trash2,
  Award,
  User,
  Plus,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { TrainingForm } from "./TrainingForm";
import { TrainingRecord } from "@/types/employeeDocuments";
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

interface EmployeeTraining {
  id: string;
  training_name: string;
  training_provider?: string;
  training_type?: string;
  completion_date?: string;
  expiry_date?: string;
  score?: number;
  status: string;
  is_mandatory: boolean;
  document_path?: string;
  notes?: string;
  archived_at?: string;
}

interface EmployeeTrainingTabProps {
  employeeId: string;
  training: EmployeeTraining[];
  onTrainingUpdated?: () => void;
}

export function EmployeeTrainingTab({ employeeId, training, onTrainingUpdated }: EmployeeTrainingTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getTrainingPermissions } = usePermissions();
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any>(null);

  const trainingPermissions = getTrainingPermissions();

  // Training statistics
  const totalTraining = training.length;
  const completedTraining = training.filter(t => t.status === 'completed').length;
  const mandatoryTraining = training.filter(t => t.is_mandatory).length;
  const optionalTraining = training.filter(t => !t.is_mandatory).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'not_started': return 'bg-gray-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'not_started': return <AlertCircle className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'health & safety': return 'bg-red-100 text-red-800';
      case 'compliance': return 'bg-blue-100 text-blue-800';
      case 'technical training': return 'bg-purple-100 text-purple-800';
      case 'professional development': return 'bg-green-100 text-green-800';
      case 'leadership': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleArchiveTraining = async (trainingId: string) => {
    try {
      const { error } = await supabase
        .from("employee_training")
        .update({ 
          archived_at: new Date().toISOString(),
          archived_by: user?.id 
        })
        .eq("id", trainingId);

      if (error) throw error;

      toast({
        title: "Training archived",
        description: "The training record has been archived successfully.",
      });

      onTrainingUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error archiving training",
        description: error instanceof Error ? error.message : "Failed to archive training",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTraining = async (trainingId: string) => {
    try {
      const { error } = await supabase
        .from("employee_training")
        .delete()
        .eq("id", trainingId);

      if (error) throw error;

      toast({
        title: "Training deleted",
        description: "The training record has been permanently deleted.",
      });

      onTrainingUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error deleting training",
        description: error instanceof Error ? error.message : "Failed to delete training",
        variant: "destructive",
      });
    }
  };

  const handleRestoreTraining = async (trainingId: string) => {
    try {
      const { error } = await supabase
        .from("employee_training")
        .update({ 
          archived_at: null,
          archived_by: null 
        })
        .eq("id", trainingId);

      if (error) throw error;

      toast({
        title: "Training restored",
        description: "The training record has been restored successfully.",
      });

      onTrainingUpdated?.();
    } catch (error: Error | unknown) {
      toast({
        title: "Error restoring training",
        description: error instanceof Error ? error.message : "Failed to restore training",
        variant: "destructive",
      });
    }
  };

  const handleEditTraining = (trainingRecord: EmployeeTraining) => {
    setEditingTraining(trainingRecord);
    setShowTrainingForm(true);
  };

  const renderTrainingCard = (training: EmployeeTraining) => {
    const isArchived = !!training.archived_at;
    
    return (
      <div key={training.id} className={`border rounded-lg p-4 space-y-3 ${isArchived ? 'opacity-60 bg-muted/50' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{training.training_name}</h4>
              {training.is_mandatory && (
                <Badge variant="secondary" className="text-xs">Mandatory</Badge>
              )}
              {isArchived && (
                <Badge variant="outline">Archived</Badge>
              )}
            </div>
            {training.training_provider && (
              <p className="text-sm text-muted-foreground">{training.training_provider}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(training.status)} variant="secondary">
              {getStatusIcon(training.status)}
              <span className="ml-1">{getStatusText(training.status)}</span>
            </Badge>
            {training.training_type && (
              <Badge className={getTypeColor(training.training_type)} variant="outline">
                {training.training_type}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {training.completion_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Completed: {new Date(training.completion_date).toLocaleDateString()}</span>
            </div>
          )}
          {training.expiry_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Expires: {new Date(training.expiry_date).toLocaleDateString()}</span>
            </div>
          )}
          {training.score && (
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>Score: {training.score}%</span>
            </div>
          )}
        </div>

        {training.notes && (
          <div className="text-sm text-muted-foreground">
            <strong>Notes:</strong> {training.notes}
          </div>
        )}
        
        <div className="flex gap-2">
          {trainingPermissions.canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditTraining(training)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}

          {trainingPermissions.canArchive && !training.archived_at && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Archive className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive Training</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to archive this training record? It will be hidden from the main view but can be restored later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleArchiveTraining(training.id)}
                  >
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {trainingPermissions.canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Training</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently delete this training record? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteTraining(training.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {training.archived_at && trainingPermissions.canArchive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestoreTraining(training.id)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Training Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((completedTraining / totalTraining) * 100) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mandatory Training</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mandatoryTraining}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optional Training</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{optionalTraining}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Training Button */}
      {trainingPermissions.canCreate && (
        <div className="flex justify-end">
          <Button onClick={() => setShowTrainingForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Training
          </Button>
        </div>
      )}

      {/* Mandatory Training */}
      {training.filter(t => t.is_mandatory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Mandatory Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {training.filter(t => t.is_mandatory).map(renderTrainingCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optional Training */}
      {training.filter(t => !t.is_mandatory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Optional Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {training.filter(t => !t.is_mandatory).map(renderTrainingCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {training.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-center py-8">
            No training records found. Click "Assign Training" to get started.
          </p>
        </div>
      )}

      {/* Training Form */}
      <TrainingForm
        isOpen={showTrainingForm}
        onClose={() => {
          setShowTrainingForm(false);
          setEditingTraining(null);
        }}
        employeeId={employeeId}
        training={editingTraining}
        onSuccess={() => {
          onTrainingUpdated?.();
          setEditingTraining(null);
        }}
      />
    </div>
  );
}