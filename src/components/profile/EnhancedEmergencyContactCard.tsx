import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Star,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';
import { EmergencyContact } from '@/types/profile';

interface EnhancedEmergencyContactCardProps {
  isEditing: boolean;
  emergencyContacts: EmergencyContact[];
  onAddContact: (contact: Omit<EmergencyContact, 'id' | 'employee_id'>) => Promise<boolean>;
  onUpdateContact: (id: string, updates: Partial<EmergencyContact>) => Promise<boolean>;
  onDeleteContact: (id: string) => Promise<boolean>;
  isUpdating: boolean;
}

interface ContactFormData {
  name: string;
  phone: string;
  relationship: string;
  email: string;
  address: string;
  is_primary: boolean;
}

export const EnhancedEmergencyContactCard = ({
  isEditing,
  emergencyContacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  isUpdating
}: EnhancedEmergencyContactCardProps) => {
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    relationship: '',
    email: '',
    address: '',
    is_primary: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      relationship: '',
      email: '',
      address: '',
      is_primary: false,
    });
  };

  const handleAddContact = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.relationship.trim()) {
      return;
    }

    const success = await onAddContact({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      relationship: formData.relationship.trim(),
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      is_primary: formData.is_primary,
    });

    if (success) {
      resetForm();
      setIsAddingContact(false);
    }
  };

  const handleUpdateContact = async (contactId: string) => {
    const success = await onUpdateContact(contactId, {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      relationship: formData.relationship.trim(),
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      is_primary: formData.is_primary,
    });

    if (success) {
      setEditingContactId(null);
      resetForm();
    }
  };

  const startEditingContact = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      email: contact.email || '',
      address: contact.address || '',
      is_primary: contact.is_primary,
    });
    setEditingContactId(contact.id);
  };

  const cancelEditing = () => {
    setEditingContactId(null);
    setIsAddingContact(false);
    resetForm();
  };

  const handleSetPrimary = async (contactId: string) => {
    await onUpdateContact(contactId, { is_primary: true });
  };

  const relationshipOptions = [
    'Spouse/Partner',
    'Parent',
    'Sibling',
    'Child',
    'Friend',
    'Colleague',
    'Other'
  ];

  if (emergencyContacts.length === 0 && !isEditing) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Emergency Contacts</h3>
        <p className="text-muted-foreground">
          Emergency contacts will appear here once they are added.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Contact Button */}
      {isEditing && !isAddingContact && !editingContactId && (
        <Button
          onClick={() => setIsAddingContact(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Emergency Contact
        </Button>
      )}

      {/* Add Contact Form */}
      {isAddingContact && (
        <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Name *</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone *</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-relationship">Relationship *</Label>
                <select
                  id="add-relationship"
                  value={formData.relationship}
                  onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select relationship</option>
                  {relationshipOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address (optional)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-address">Address</Label>
              <Input
                id="add-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address (optional)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add-primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData(prev => ({ ...prev, is_primary: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="add-primary">Set as primary contact</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleAddContact}
                disabled={!formData.name.trim() || !formData.phone.trim() || !formData.relationship.trim() || isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Contact
              </Button>
              <Button variant="outline" onClick={cancelEditing}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts List */}
      {emergencyContacts.map((contact) => (
        <Card key={contact.id} className={`transition-all duration-200 ${contact.is_primary ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
          <CardContent className="p-6">
            {editingContactId === contact.id ? (
              // Edit Form
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`edit-name-${contact.id}`}>Name *</Label>
                    <Input
                      id={`edit-name-${contact.id}`}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-phone-${contact.id}`}>Phone *</Label>
                    <Input
                      id={`edit-phone-${contact.id}`}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-relationship-${contact.id}`}>Relationship *</Label>
                    <select
                      id={`edit-relationship-${contact.id}`}
                      value={formData.relationship}
                      onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      {relationshipOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-email-${contact.id}`}>Email</Label>
                    <Input
                      id={`edit-email-${contact.id}`}
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-address-${contact.id}`}>Address</Label>
                  <Input
                    id={`edit-address-${contact.id}`}
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`edit-primary-${contact.id}`}
                    checked={formData.is_primary}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_primary: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`edit-primary-${contact.id}`}>Set as primary contact</Label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleUpdateContact(contact.id)}
                    disabled={!formData.name.trim() || !formData.phone.trim() || !formData.relationship.trim() || isUpdating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // Display View
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{contact.name}</h3>
                      {contact.is_primary && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{contact.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{contact.relationship}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{contact.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex space-x-2">
                      {!contact.is_primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(contact.id)}
                          disabled={isUpdating}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingContact(contact)}
                        disabled={isUpdating}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteContact(contact.id)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Helper Text */}
      {isEditing && emergencyContacts.length === 0 && !isAddingContact && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Add emergency contacts so we know who to contact in case of an emergency.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};