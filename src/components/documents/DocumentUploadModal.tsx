import { useState, useRef, useEffect } from "react";
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
import { 
  CalendarIcon, 
  Upload, 
  FileText, 
  X, 
  Users, 
  Building2,
  Sparkles,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from "@/hooks/useDocuments";

const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  category: z.enum(["personal", "certificate", "employment", "financial", "compliance"]),
  expiry_date: z.date().optional(),
  notes: z.string().optional(),
  entity_id: z.string().min(1, "Please select an entity"),
  file: z.instanceof(File, { message: "Please select a file" }),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'employee' | 'company';
  onUploadComplete: () => void;
}

export function DocumentUploadModal({ 
  open, 
  onOpenChange, 
  entityType, 
  onUploadComplete 
}: DocumentUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [entities, setEntities] = useState<Array<{id: string; name: string}>>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    suggestedCategory?: string;
    suggestedName?: string;
    detectedExpiry?: Date;
    confidence?: number;
  }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadDocument, uploading } = useDocuments();

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      category: undefined,
      expiry_date: undefined,
      notes: "",
      entity_id: "",
      file: undefined,
    },
  });

  const selectedFile = form.watch("file");

  // Fetch entities when modal opens
  useEffect(() => {
    if (open) {
      fetchEntities();
    }
  }, [open, entityType]);

  const fetchEntities = async () => {
    try {
      setLoadingEntities(true);
      
      if (entityType === 'employee') {
        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .eq('status', 'active');

        if (error) throw error;

        const formattedEntities = (data || []).map(item => ({
          id: item.id,
          name: `${item.first_name} ${item.last_name}`
        }));

        setEntities(formattedEntities);
      } else {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .eq('is_active', true);

        if (error) throw error;

        const formattedEntities = (data || []).map(item => ({
          id: item.id,
          name: item.name
        }));

        setEntities(formattedEntities);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast({
        title: "Error",
        description: `Failed to load ${entityType}s`,
        variant: "destructive",
      });
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    form.setValue("file", file);
    
    // Auto-suggest name from filename
    if (!form.getValues("name")) {
      const suggestedName = file.name.split('.')[0].replace(/[_-]/g, ' ');
      form.setValue("name", suggestedName);
      setExtractedData(prev => ({ ...prev, suggestedName }));
    }

    // Simulate AI processing for PDFs
    if (file.type === 'application/pdf' && file.size < 10 * 1024 * 1024) {
      await processWithAI(file);
    }
  };

  const processWithAI = async (file: File) => {
    try {
      setAiProcessing(true);
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI extraction results based on filename patterns
      const fileName = file.name.toLowerCase();
      let suggestedCategory = "personal";
      let confidence = 0.7;
      
      if (fileName.includes('certificate') || fileName.includes('cert')) {
        suggestedCategory = "certificate";
        confidence = 0.9;
      } else if (fileName.includes('contract') || fileName.includes('employment')) {
        suggestedCategory = "employment";
        confidence = 0.85;
      } else if (fileName.includes('financial') || fileName.includes('bank')) {
        suggestedCategory = "financial";
        confidence = 0.8;
      } else if (fileName.includes('compliance') || fileName.includes('policy')) {
        suggestedCategory = "compliance";
        confidence = 0.75;
      }

      // Mock expiry date detection
      let detectedExpiry: Date | undefined;
      if (suggestedCategory === "certificate") {
        detectedExpiry = new Date();
        detectedExpiry.setFullYear(detectedExpiry.getFullYear() + 1);
      }

      setExtractedData({
        suggestedCategory: suggestedCategory as any,
        detectedExpiry,
        confidence
      });

      // Auto-fill if confidence is high
      if (confidence > 0.8) {
        form.setValue("category", suggestedCategory as any);
        if (detectedExpiry) {
          form.setValue("expiry_date", detectedExpiry);
        }
      }

      toast({
        title: "AI Processing Complete",
        description: `Document analyzed with ${Math.round(confidence * 100)}% confidence`,
      });

    } catch (error) {
      console.error('Error processing with AI:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const removeFile = () => {
    form.setValue("file", undefined as any);
    setExtractedData({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    try {
      const metadata = {
        name: data.name,
        category: data.category,
        expiry_date: data.expiry_date,
        notes: data.notes,
        [entityType === 'employee' ? 'employee_id' : 'company_id']: data.entity_id,
      };

      await uploadDocument(data.file, metadata);
      
      form.reset();
      setExtractedData({});
      onUploadComplete();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-card border-0 shadow-hero flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              {entityType === 'employee' ? (
                <Users className="h-5 w-5 text-white" />
              ) : (
                <Building2 className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Upload {entityType === 'employee' ? 'Employee' : 'Company'} Document
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Upload documents with AI-powered categorization and metadata extraction
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Entity Selection */}
              <FormField
                control={form.control}
                name="entity_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select {entityType === 'employee' ? 'Employee' : 'Company'} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={loadingEntities}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Choose ${entityType}...`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-50 bg-popover max-h-60">
                        {entities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
                  dragActive ? "border-primary bg-primary/10 scale-105" : "border-muted-foreground/25",
                  selectedFile ? "border-primary bg-primary/5" : ""
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-3 p-4 bg-background/80 rounded-lg border">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {aiProcessing && (
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processing with AI...</span>
                      </div>
                    )}
                    
                    {extractedData.confidence && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">
                          AI analysis complete ({Math.round(extractedData.confidence * 100)}% confidence)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-glow">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supports PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="hover-scale"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Employment Contract" />
                      </FormControl>
                      {extractedData.suggestedName && (
                        <p className="text-xs text-muted-foreground">
                          AI suggested: {extractedData.suggestedName}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-50 bg-popover">
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="certificate">Certificate</SelectItem>
                          <SelectItem value="employment">Employment</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                        </SelectContent>
                      </Select>
                      {extractedData.suggestedCategory && (
                        <p className="text-xs text-muted-foreground">
                          AI suggested: {extractedData.suggestedCategory}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
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
                                <span>Pick an expiry date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3"
                          />
                        </PopoverContent>
                      </Popover>
                      {extractedData.detectedExpiry && (
                        <p className="text-xs text-muted-foreground">
                          AI detected expiry: {format(extractedData.detectedExpiry, "PPP")}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Additional notes about this document..."
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploading || !selectedFile}
                  className="bg-gradient-primary hover:opacity-90 text-white"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}