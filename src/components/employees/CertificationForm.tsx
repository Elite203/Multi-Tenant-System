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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CertificationFormData } from "@/types/employeeDocuments";

const certificationSchema = z.object({
  certification_name: z.string().min(1, "Certification name is required"),
  issuing_organization: z.string().min(1, "Issuing organization is required"),
  certification_number: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  requires_renewal: z.boolean(),
  document_path: z.string().optional(),
});

type CertificationFormValues = z.infer<typeof certificationSchema>;

interface CertificationFormProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  certification?: CertificationFormData;
  onSuccess: () => void;
}

export function CertificationForm({ isOpen, onClose, employeeId, certification, onSuccess }: CertificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      certification_name: certification?.certification_name || "",
      issuing_organization: certification?.issuing_organization || "",
      certification_number: certification?.certification_number || "",
      issue_date: certification?.issue_date || "",
      expiry_date: certification?.expiry_date || "",
      requires_renewal: certification?.requires_renewal || false,
      document_path: certification?.document_path || "",
    },
  });

  const onSubmit = async (values: CertificationFormValues) => {
    setIsSubmitting(true);
    try {
      const certificationData = {
        employee_id: employeeId,
        certification_name: values.certification_name,
        issuing_organization: values.issuing_organization,
        certification_number: values.certification_number || null,
        issue_date: values.issue_date || null,
        expiry_date: values.expiry_date || null,
        requires_renewal: values.requires_renewal,
        document_path: values.document_path || null,
      };

      if (certification?.id) {
        const { error } = await supabase
          .from("employee_certifications")
          .update(certificationData)
          .eq("id", certification.id);

        if (error) throw error;
        toast({ title: "Certification updated successfully" });
      } else {
        const { error } = await supabase
          .from("employee_certifications")
          .insert(certificationData);

        if (error) throw error;
        toast({ title: "Certification added successfully" });
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
            {certification ? "Edit Certification" : "Add New Certification"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="certification_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AWS Solutions Architect" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issuing_organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuing Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Amazon Web Services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certification_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter certification number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
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
              name="requires_renewal"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Requires Renewal</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Does this certification require periodic renewal?
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

            <FormField
              control={form.control}
              name="document_path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Path</FormLabel>
                  <FormControl>
                    <Input placeholder="Path to certification document" {...field} />
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
                {isSubmitting ? "Saving..." : certification ? "Update" : "Add"} Certification
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}