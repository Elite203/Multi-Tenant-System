import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportPreviewProps {
  jobId: string;
}

interface PreviewData {
  rows: Array<{ [key: string]: string }>;
}

interface ValidationResults {
  valid: boolean;
  errors: Array<{ row: number; field: string; error: string; value: any }>;
  warnings: Array<{ row: number; field: string; error: string; value: any }>;
}

export function ImportPreview({ jobId }: ImportPreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPreviewData = async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('import_previews')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error) throw error;

      setPreviewData(data.preview_data as unknown as PreviewData);
      setValidationResults(data.validation_results as unknown as ValidationResults);
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast({
        title: "Error",
        description: "Failed to load preview data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRowStatus = (rowIndex: number) => {
    const errors = validationResults?.errors.filter(e => e.row === rowIndex) || [];
    const warnings = validationResults?.warnings.filter(w => w.row === rowIndex) || [];

    if (errors.length > 0) return 'error';
    if (warnings.length > 0) return 'warning';
    return 'success';
  };

  const getRowErrors = (rowIndex: number) => {
    const errors = validationResults?.errors.filter(e => e.row === rowIndex) || [];
    const warnings = validationResults?.warnings.filter(w => w.row === rowIndex) || [];
    return [...errors, ...warnings];
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Warning</Badge>;
      default:
        return <Badge variant="default" className="bg-success/10 text-success">Valid</Badge>;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          onClick={fetchPreviewData}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          View Detailed Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full h-full flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Import Preview & Validation Results</DialogTitle>
          <DialogDescription>
            Review all rows and their validation status before importing
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : previewData && validationResults ? (
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="min-w-max">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    {previewData.rows.length > 0 && Object.keys(previewData.rows[0]).map((header) => (
                      <TableHead key={header} className="min-w-32">{header}</TableHead>
                    ))}
                    <TableHead className="min-w-48">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.slice(1).map((row, index) => {
                    const rowNumber = index + 1;
                    const status = getRowStatus(rowNumber);
                    const rowErrors = getRowErrors(rowNumber);
                    
                    return (
                      <TableRow 
                        key={index}
                        className={`
                          ${status === 'error' ? 'border-l-4 border-l-destructive bg-destructive/5' : ''}
                          ${status === 'warning' ? 'border-l-4 border-l-warning bg-warning/5' : ''}
                          ${status === 'success' ? 'border-l-4 border-l-success bg-success/5' : ''}
                        `}
                      >
                        <TableCell className="font-mono text-sm">#{rowNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon status={status} />
                            <StatusBadge status={status} />
                          </div>
                        </TableCell>
                        {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex} className="min-w-32">
                            <div className="truncate" title={String(value)}>
                              {value}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="min-w-48">
                          {rowErrors.length > 0 && (
                            <div className="space-y-1">
                              {rowErrors.map((error, errorIndex) => (
                                <div 
                                  key={errorIndex}
                                  className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded"
                                >
                                  <span className="font-medium">{error.field}:</span> {error.error}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No preview data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}