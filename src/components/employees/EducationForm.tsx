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
import { EducationFormData } from "@/types/employeeDocuments";

const educationSchema = z.object({
  institution_name: z.string().min(1, "Institution name is required"),
  degree_type: z.string().optional(),
  field_of_study: z.string().optional(),
  start_date: z.string().optional(),
  graduation_date: z.string().optional(),
  grade_gpa: z.string().optional(),
  is_completed: z.boolean(),
});

type EducationFormValues = z.infer<typeof educationSchema>;

interface EducationFormProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  education?: EducationFormData;
  onSuccess: () => void;
}

const degreeTypes = [
  "High School Diploma",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctoral Degree",
  "Professional Certificate",
  "Other"
];

export function EducationForm({ isOpen, onClose, employeeId, education, onSuccess }: EducationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution_name: education?.institution_name || "",
      degree_type: education?.degree_type || "",
      field_of_study: education?.field_of_study || "",
      start_date: education?.start_date || "",
      graduation_date: education?.graduation_date || "",
      grade_gpa: education?.grade_gpa || "",
      is_completed: education?.is_completed || false,
    },
  });

  const onSubmit = async (values: EducationFormValues) => {
    setIsSubmitting(true);
    try {
      const educationData = {
        employee_id: employeeId,
        institution_name: values.institution_name,
        degree_type: values.degree_type || null,
        field_of_study: values.field_of_study || null,
        start_date: values.start_date || null,
        graduation_date: values.graduation_date || null,
        grade_gpa: values.grade_gpa || null,
        is_completed: values.is_completed,
      };

      if (education?.id) {
        const { error } = await supabase
          .from("employee_education")
          .update(educationData)
          .eq("id", education.id);

        if (error) throw error;
        toast({ title: "Education record updated successfully" });
      } else {
        const { error } = await supabase
          .from("employee_education")
          .insert(educationData);

        if (error) throw error;
        toast({ title: "Education record added successfully" });
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {education ? "Edit Education Record" : "Add Education Record"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="institution_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., University of Oxford" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="degree_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {degreeTypes.map((type) => (
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
              name="field_of_study"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field of Study</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="graduation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Graduation Date</FormLabel>
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
              name="grade_gpa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade/GPA</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 3.8 GPA, First Class Honours" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_completed"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Completed</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Has this education been completed?
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

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : education ? "Update" : "Add"} Education
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}