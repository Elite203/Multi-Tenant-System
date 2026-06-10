import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModuleSelector } from "./ModuleSelector";
import { FileDropZone } from "./FileDropZone";
import { ImportPreview } from "./ImportPreview";
import { ImportResults } from "./ImportResults";
import { supabase } from "@/integrations/supabase/client";
import type { ImportTemplate, ValidationResult, ImportResult } from "@/types/dataImport";

export function ImportUpload() {
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
    setImportResult(null);
  }, []);

  const handleTemplateDownload = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`https://khxyusmbfpgoftrnbmyk.supabase.co/functions/v1/template-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ templateId: selectedTemplate.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download template');
      }

      const csvContent = await response.text();
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTemplate.module_name}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: `${selectedTemplate.display_name} template has been downloaded.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleValidation = async () => {
    if (!selectedFile || !selectedTemplate) return;

    setIsValidating(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('templateId', selectedTemplate.id);
      formData.append('action', 'validate');

      const { data, error } = await supabase.functions.invoke('data-import', {
        body: formData
      });

      if (error) throw error;

      console.log('Validation response:', data); // Debug log
      setValidationResult(data.validation);
      setJobId(data.jobId);

      toast({
        title: "Validation Complete",
        description: `Found ${data.validRows || data.totalRows} valid rows out of ${data.totalRows} total rows.`,
      });
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to validate file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedTemplate || !validationResult?.valid) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('templateId', selectedTemplate.id);
      formData.append('action', 'import');

      const { data, error } = await supabase.functions.invoke('data-import', {
        body: formData
      });

      if (error) throw error;

      setImportResult(data);
      
      // Show appropriate toast based on actual result
      if (data.success) {
        const hasErrors = (data.errorRows || 0) > 0;
        toast({
          title: hasErrors ? "Import Completed with Errors" : "Import Successful",
          description: hasErrors 
            ? `${data.successRows || 0} rows imported successfully, ${data.errorRows || 0} rows failed.`
            : "Your data has been imported successfully.",
          variant: hasErrors ? "default" : "default",
        });
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "The import process failed. Please check your data and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setImportResult(null);
    setJobId(null);
  };

  return (
    <div className="space-y-6">
      {/* Module Selection */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Import Module
          </CardTitle>
          <CardDescription>
            Choose the type of data you want to import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ModuleSelector 
                selectedTemplate={selectedTemplate}
                onTemplateSelect={(template) => setSelectedTemplate(template)}
              />
            </div>
            {selectedTemplate && (
              <Button 
                variant="outline" 
                onClick={handleTemplateDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            )}
          </div>
          
          {selectedTemplate && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Download the template first to ensure your CSV file has the correct format and required fields.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      {selectedTemplate && (
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Data File
            </CardTitle>
            <CardDescription>
              Upload your CSV file for validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileDropZone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
            
            {selectedFile && (
              <div className="flex items-center justify-center gap-4">
                <Button 
                  onClick={handleValidation}
                  disabled={isValidating}
                  className="gap-2"
                >
                  {isValidating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Validate File
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResult && (
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Validation Results
            </CardTitle>
            <CardDescription>
              Review the validation results before importing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(validationResult.errors.length + validationResult.warnings.length) > 0 
                    ? Math.max(0, (selectedFile?.size || 0) - validationResult.errors.length - validationResult.warnings.length)
                    : "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {validationResult.errors.length}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {validationResult.warnings.length}
                </div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              {validationResult.valid ? (
                <Button 
                  onClick={handleImport}
                  disabled={isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm Import
                    </>
                  )}
                </Button>
              ) : null}
              
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>

              {jobId && (
                <ImportPreview jobId={jobId} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <ImportResults 
          result={importResult}
          onClose={resetForm}
        />
      )}
    </div>
  );
}