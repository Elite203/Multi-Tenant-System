import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, Eye, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Template {
  id: string;
  module_name: string;
  display_name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
  field_mappings: { [key: string]: string };
  sample_data: Array<{ [key: string]: string }>;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('import_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      
      const processedTemplates = (data || []).map(template => ({
        ...template,
        field_mappings: template.field_mappings as { [key: string]: string },
        sample_data: Array.isArray(template.sample_data) 
          ? template.sample_data as Array<{ [key: string]: string }>
          : JSON.parse(template.sample_data as string || '[]')
      }));
      
      console.log('Fetched templates:', processedTemplates);
      processedTemplates.forEach(template => {
        if (template.module_name === 'employees') {
          console.log('Employee template field mappings:', template.field_mappings);
          console.log('Has manager_name?', 'manager_name' in template.field_mappings);
          console.log('Has manager_employee_number?', 'manager_employee_number' in template.field_mappings);
        }
      });
      
      setTemplates(processedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async (template: Template) => {
    try {
      console.log('Downloading template for:', template.module_name, template.id);
      console.log('Template field mappings before download:', template.field_mappings);
      
      const { data, error } = await supabase.functions.invoke('template-generator', {
        body: { templateId: template.id }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.module_name}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: `${template.display_name} template has been downloaded.`,
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

  if (isLoading) {
    return (
      <Card className="shadow-soft border-0">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Templates
          </CardTitle>
          <CardDescription>
            Download CSV templates with the correct format for data import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Required Fields</TableHead>
                <TableHead>Optional Fields</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.display_name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">
                      {template.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {template.required_fields.length} required
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.optional_fields.length} optional
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Collapsible
                        open={expandedTemplate === template.id}
                        onOpenChange={(open) => setExpandedTemplate(open ? template.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-2">
                            {expandedTemplate === template.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Eye className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                      
                      <Button 
                        size="sm" 
                        onClick={() => handleDownloadTemplate(template)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Details */}
      {expandedTemplate && (
        <Collapsible open={true}>
          <CollapsibleContent>
            {templates
              .filter(template => template.id === expandedTemplate)
              .map(template => (
                <Card key={template.id} className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle>{template.display_name} - Field Details</CardTitle>
                    <CardDescription>
                      Field mappings and sample data for this template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Field Mappings */}
                    <div>
                      <h4 className="font-medium mb-3">Field Mappings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-2">Required Fields</h5>
                          <div className="space-y-1">
                            {template.required_fields.map(field => (
                              <div key={field} className="flex items-center gap-2">
                                <Badge variant="default" className="text-xs">Required</Badge>
                                <span className="text-sm">
                                  {template.field_mappings[field] || field}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-2">Optional Fields</h5>
                          <div className="space-y-1">
                            {template.optional_fields.map(field => (
                              <div key={field} className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Optional</Badge>
                                <span className="text-sm">
                                  {template.field_mappings[field] || field}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sample Data */}
                    {template.sample_data.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Sample Data</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(template.sample_data[0]).map(key => (
                                  <TableHead key={key}>
                                    {template.field_mappings[key] || key}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {template.sample_data.map((row, index) => (
                                <TableRow key={index}>
                                  {Object.values(row).map((value, cellIndex) => (
                                    <TableCell key={cellIndex} className="text-sm">
                                      {value}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}