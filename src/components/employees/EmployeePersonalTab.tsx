import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, Users, Plus, Edit, Trash2, User } from "lucide-react";
import { PersonalContactForm } from "./PersonalContactForm";
import { EmergencyContactForm } from "./EmergencyContactForm";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmployeePersonalInfo {
  id: string;
  email?: string | null;
  phone?: string | null;
  street_address?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  date_of_birth?: string | null;
  sex?: 'male' | 'female' | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  priority_order: number;
}

interface EmployeePersonalTabProps {
  employee: EmployeePersonalInfo;
  onEmployeeUpdate?: () => void;
}

export const EmployeePersonalTab = ({ employee, onEmployeeUpdate }: EmployeePersonalTabProps) => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | undefined>();
  const { getEmployeePermissions } = usePermissions();
  const { toast } = useToast();

  const permissions = getEmployeePermissions();

  useEffect(() => {
    fetchEmergencyContacts();
  }, [employee.id]);

  const fetchEmergencyContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("employee_id", employee.id)
        .order("priority_order");

      if (error) throw error;
      setEmergencyContacts(data || []);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this emergency contact?")) return;

    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      });
      fetchEmergencyContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contact Information</CardTitle>
            {permissions.canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContactForm(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
        <CardContent className="space-y-4">
          {employee.email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1">
                  <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                    {employee.email}
                  </a>
                </p>
              </div>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="mt-1">{employee.phone}</p>
              </div>
            </div>
          )}
          {(employee.street_address || employee.city || employee.postal_code) && (
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <div className="mt-1 text-sm">
                  {employee.street_address && <p>{employee.street_address}</p>}
                  {employee.address_line_2 && <p>{employee.address_line_2}</p>}
                  {(employee.city || employee.state_province || employee.postal_code) && (
                    <p>
                      {[employee.city, employee.state_province, employee.postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
           {employee.date_of_birth && (
             <div className="flex items-center space-x-2">
               <Calendar className="h-4 w-4 text-muted-foreground" />
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                 <p className="mt-1">{new Date(employee.date_of_birth).toLocaleDateString()}</p>
               </div>
             </div>
           )}
           {employee.sex && (
             <div className="flex items-center space-x-2">
               <User className="h-4 w-4 text-muted-foreground" />
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Sex</label>
                 <p className="mt-1">{employee.sex.charAt(0).toUpperCase() + employee.sex.slice(1)}</p>
               </div>
             </div>
           )}
        </CardContent>
      </Card>

      </div>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          {permissions.canCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingContact(undefined);
                setShowEmergencyForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {emergencyContacts.length > 0 ? (
            <div className="space-y-4">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{contact.name}</h4>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                      <p className="text-sm">{contact.phone}</p>
                      {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                      {contact.address && <p className="text-sm text-muted-foreground">{contact.address}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.is_primary && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Primary</span>
                      )}
                      {permissions.canUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContact(contact);
                            setShowEmergencyForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No emergency contacts added</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setEditingContact(undefined);
                    setShowEmergencyForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forms */}
      <PersonalContactForm
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        employee={employee}
        onSuccess={() => {
          fetchEmergencyContacts();
          if (onEmployeeUpdate) onEmployeeUpdate();
        }}
      />
      
      <EmergencyContactForm
        isOpen={showEmergencyForm}
        onClose={() => {
          setShowEmergencyForm(false);
          setEditingContact(undefined);
        }}
        employeeId={employee.id}
        contact={editingContact}
        onSuccess={fetchEmergencyContacts}
      />
    </div>
  );
};