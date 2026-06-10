import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus, Edit, Trash2, AlertCircle, User } from "lucide-react";
import { EmergencyContactForm } from "./EmergencyContactForm";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  priority_order?: number;
}

interface EmployeeEmergencyContactTabProps {
  employeeId: string;
  onUpdate: () => void;
}

export const EmployeeEmergencyContactTab = ({ employeeId, onUpdate }: EmployeeEmergencyContactTabProps) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | undefined>();
  const { getEmployeePermissions } = usePermissions();
  const permissions = getEmployeePermissions();
  const { toast } = useToast();

  const fetchEmergencyContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('employee_id', employeeId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyContacts();
  }, [employeeId]);

  const handleDeleteContact = async (contactId: string) => {
    if (!permissions.canDelete) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete emergency contacts",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      });
      fetchEmergencyContacts();
      onUpdate();
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingContact(undefined);
    fetchEmergencyContacts();
    onUpdate();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Emergency Contacts Overview */}
      <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </div>
            {permissions.canCreate && (
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Emergency Contact
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {contacts.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Contacts</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {contacts.filter(contact => contact.is_primary).length}
              </div>
              <p className="text-sm text-muted-foreground">Primary Contacts</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {contacts.filter(contact => contact.email).length}
              </div>
              <p className="text-sm text-muted-foreground">With Email</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No emergency contacts found</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Emergency Contact
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                      </div>
                    </div>
                    
                    {contact.is_primary && (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        Primary Contact
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.phone}</span>
                    </div>
                    
                    {contact.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{contact.email}</span>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-muted-foreground">Relationship:</span>
                      <span className="ml-2 font-medium">{contact.relationship}</span>
                    </div>
                  </div>

                  {contact.address && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="ml-2">{contact.address}</span>
                    </div>
                  )}

                    {contact.address && (
                      <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                        <span className="text-muted-foreground font-medium">Address:</span>
                        <p className="mt-1">{contact.address}</p>
                      </div>
                    )}

                  {(permissions.canUpdate || permissions.canDelete) && (
                    <div className="mt-3 flex items-center gap-2">
                      {permissions.canUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContact(contact);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      
                      {permissions.canDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EmergencyContactForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingContact(undefined);
        }}
        employeeId={employeeId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};