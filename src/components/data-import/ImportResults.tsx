import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, X, Download, AlertTriangle, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImportJobDetailsModal } from "./ImportJobDetailsModal";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ImportResult } from "@/types/dataImport";

interface ImportResultsProps {
  result: ImportResult;
  onClose: () => void;
}

export function ImportResults({ result, onClose }: ImportResultsProps) {
  const { toast } = useToast();
  const [showJobDetails, setShowJobDetails] = useState(false);
  const successRate = result.totalRows 
    ? Math.round((result.successRows || 0) / result.totalRows * 100)
    : 100;

  // Determine import status
  const getImportStatus = () => {
    if (!result.success) return 'failed';
    if ((result.errorRows || 0) === 0) return 'success';
    if ((result.successRows || 0) > 0) return 'partial';
    return 'failed';
  };

  const status = getImportStatus();

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'partial': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'failed': return <X className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success': return 'Import Completed Successfully';
      case 'partial': return 'Import Completed with Errors';
      case 'failed': return 'Import Failed';
    }
  };

  const getStatusBadgeColor = () => {
    switch (status) {
      case 'success': return 'bg-success/10 text-success';
      case 'partial': return 'bg-warning/10 text-warning';
      case 'failed': return 'bg-destructive/10 text-destructive';
    }
  };

  const handleExportErrors = async () => {
    if (!result.jobId || (result.errorRows || 0) === 0) return;

    try {
      // Fetch all errors for this job
      const { data: allErrors, error } = await supabase
        .from('import_errors')
        .select('*')
        .eq('job_id', result.jobId)
        .order('row_number');

      if (error) throw error;

      // Create CSV content
      const headers = ['Row Number', 'Field Name', 'Error Type', 'Error Message', 'Raw Value'];
      const csvContent = [
        headers.join(','),
        ...allErrors.map(err => [
          err.row_number,
          `"${err.field_name || ''}"`,
          `"${err.error_type || ''}"`,
          `"${err.error_message || ''}"`,
          `"${err.raw_value || ''}"`
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-errors-${result.jobId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Downloaded ${allErrors.length} import errors to CSV file.`,
      });
    } catch (error) {
      console.error('Error exporting errors:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export error data.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Import Complete
          </DialogTitle>
          <DialogDescription>
            Import results for job {result.jobId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span className="font-medium">{successRate}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-soft border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{result.totalRows || 0}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">{result.successRows || 0}</div>
                <div className="text-sm text-muted-foreground">Success</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{result.errorRows || 0}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">{result.warningRows || 0}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </CardContent>
            </Card>
          </div>

          {/* Status Message */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusBadgeColor()}`}>
              {getStatusIcon()}
              {getStatusMessage()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowJobDetails(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
            
            {(result.errorRows || 0) > 0 && (
              <Button 
                variant="outline" 
                onClick={handleExportErrors}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Errors
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
      
      {/* Job Details Modal */}
      {showJobDetails && (
        <ImportJobDetailsModal
          isOpen={showJobDetails}
          onClose={() => setShowJobDetails(false)}
          jobId={result.jobId}
        />
      )}
    </Dialog>
  );
}