import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrainingFormData } from "@/types/employeeDocuments";

const trainingSchema = z.object({
  training_name: z.string().min(1, "Training name is required"),
  training_type: z.string().optional(),
  training_provider: z.string().optional(),
  status: z.string(),
  is_mandatory: z.boolean(),
  completion_date: z.string().optional(),
  expiry_date: z.string().optional(),
  score: z.string().optional(),
  notes: z.string().optional(),
  document_path: z.string().optional(),
});

type TrainingFormValues = z.infer<typeof trainingSchema>;

interface TrainingFormProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  training?: TrainingFormData;
  onSuccess: () => void;
}

const trainingStatuses = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
];

const trainingTypes = [
  "Health & Safety",
  "Technical Training", 
  "Compliance",
  "Professional Development",
  "Leadership",
  "Software Training",
  "Other"
];

export function TrainingForm({ isOpen, onClose, employeeId, training, onSuccess }: TrainingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      training_name: training?.training_name || "",
      training_type: training?.training_type || "",
      training_provider: training?.training_provider || "",
      status: training?.status || "not_started",
      is_mandatory: training?.is_mandatory || false,
      completion_date: training?.completion_date || "",
      expiry_date: training?.expiry_date || "",
      score: training?.score?.toString() || "",
      notes: training?.notes || "",
      document_path: training?.document_path || "",
    },
  });

  const onSubmit = async (values: TrainingFormValues) => {
    setIsSubmitting(true);
    try {
      const trainingData = {
        employee_id: employeeId,
        training_name: values.training_name,
        training_type: values.training_type || null,
        training_provider: values.training_provider || null,
        status: values.status,
        is_mandatory: values.is_mandatory,
        completion_date: values.completion_date || null,
        expiry_date: values.expiry_date || null,
        score: values.score ? parseFloat(values.score) : null,
        notes: values.notes || null,
        document_path: values.document_path || null,
      };

      if (training?.id) {
        const { error } = await supabase
          .from("employee_training")
          .update(trainingData)
          .eq("id", training.id);

        if (error) throw error;
        toast({ title: "Training updated successfully" });
      } else {
        const { error } = await supabase
          .from("employee_training")
          .insert(trainingData);

        if (error) throw error;
        toast({ title: "Training assigned successfully" });
      }

      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {training ? "Edit Training" : "Assign New Training"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="training_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fire Safety Training" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="training_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trainingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trainingStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="training_provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., External Training Company" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_mandatory"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Mandatory Training</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Is this training mandatory for the employee?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter score (0-100)" 
                      min="0" 
                      max="100" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the training..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document_path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Path</FormLabel>
                  <FormControl>
                    <Input placeholder="Path to training certificate/document" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : training ? "Update" : "Assign"} Training
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}