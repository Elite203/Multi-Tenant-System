import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ImportTemplate } from "@/types/dataImport";

interface ModuleSelectorProps {
  selectedTemplate: ImportTemplate | null;
  onTemplateSelect: (template: ImportTemplate | null) => void;
}

export function ModuleSelector({ selectedTemplate, onTemplateSelect }: ModuleSelectorProps) {
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('import_templates')
          .select('*')
          .eq('is_active', true)
          .order('display_name');

        if (error) throw error;
        
        if (mounted) {
          setTemplates((data || []) as ImportTemplate[]);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to load import templates.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTemplates();
    
    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    onTemplateSelect(template || null);
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading templates..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select 
      value={selectedTemplate?.id || ""} 
      onValueChange={handleTemplateChange}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a data module to import..." />
      </SelectTrigger>
      <SelectContent className="bg-background border shadow-md z-50">
        {templates.length === 0 ? (
          <SelectItem value="" disabled>
            No templates available
          </SelectItem>
        ) : (
          templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex flex-col">
                <span className="font-medium">{template.display_name}</span>
                <span className="text-sm text-muted-foreground">
                  {template.description}
                </span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}