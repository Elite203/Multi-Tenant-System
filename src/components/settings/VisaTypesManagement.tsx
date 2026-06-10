import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Country {
  id: string;
  name: string;
  code: string;
}

interface VisaType {
  id: string;
  name: string;
  country_id: string | null;
  description: string | null;
  duration_months: number | null;
  is_active: boolean;
  country?: { name: string; code: string };
}

interface VisaTypesManagementProps {
  isUpdating: boolean;
}

export const VisaTypesManagement = ({ isUpdating }: VisaTypesManagementProps) => {
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [editingVisaType, setEditingVisaType] = useState<VisaType | null>(null);
  const [newVisaType, setNewVisaType] = useState({
    name: "",
    country_id: "",
    description: "",
    duration_months: "",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVisaTypes();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data, error } = await supabase
      .from("countries")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setCountries(data);
    }
  };

  const fetchVisaTypes = async () => {
    const { data, error } = await supabase
      .from("visa_types")
      .select(`
        *,
        country:country_id(name, code)
      `)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch visa types",
        variant: "destructive",
      });
    } else {
      setVisaTypes(data || []);
    }
  };

  const handleAddVisaType = async () => {
    if (!newVisaType.name.trim()) return;

    const { error } = await supabase
      .from("visa_types")
      .insert([{
        name: newVisaType.name,
        country_id: newVisaType.country_id || null,
        description: newVisaType.description || null,
        duration_months: newVisaType.duration_months ? parseInt(newVisaType.duration_months) : null,
        is_active: newVisaType.is_active
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add visa type",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Visa type added successfully",
      });
      setNewVisaType({ name: "", country_id: "", description: "", duration_months: "", is_active: true });
      fetchVisaTypes();
    }
  };

  const handleUpdateVisaType = async () => {
    if (!editingVisaType) return;

    const { error } = await supabase
      .from("visa_types")
      .update({
        name: editingVisaType.name,
        country_id: editingVisaType.country_id || null,
        description: editingVisaType.description || null,
        duration_months: editingVisaType.duration_months,
        is_active: editingVisaType.is_active
      })
      .eq("id", editingVisaType.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update visa type",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Visa type updated successfully",
      });
      setEditingVisaType(null);
      fetchVisaTypes();
    }
  };

  const handleDeleteVisaType = async (id: string) => {
    const { error } = await supabase
      .from("visa_types")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete visa type. It may be in use.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Visa type deleted successfully",
      });
      fetchVisaTypes();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("visa_types")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update visa type status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Visa type ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      fetchVisaTypes();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visa Types Management</CardTitle>
        <CardDescription>
          Manage visa types and their country-specific information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Visa Type */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Add New Visa Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visa-name">Visa Type Name *</Label>
              <Input
                id="visa-name"
                placeholder="e.g., Skilled Worker Visa"
                value={newVisaType.name}
                onChange={(e) => setNewVisaType(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="visa-country">Country</Label>
              <Select
                value={newVisaType.country_id || "none"}
                onValueChange={(value) => setNewVisaType(prev => ({ ...prev, country_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any country</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name} ({country.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="visa-duration">Duration (months)</Label>
              <Input
                id="visa-duration"
                type="number"
                placeholder="e.g., 60"
                value={newVisaType.duration_months}
                onChange={(e) => setNewVisaType(prev => ({ ...prev, duration_months: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="visa-active"
                checked={newVisaType.is_active}
                onCheckedChange={(checked) => setNewVisaType(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="visa-active">Active</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="visa-description">Description</Label>
            <Textarea
              id="visa-description"
              placeholder="Visa type description..."
              value={newVisaType.description}
              onChange={(e) => setNewVisaType(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <Button onClick={handleAddVisaType} disabled={isUpdating || !newVisaType.name.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Visa Type
          </Button>
        </div>

        {/* Existing Visa Types */}
        <div className="space-y-3">
          <h4 className="font-medium">Existing Visa Types ({visaTypes.length})</h4>
          {visaTypes.map((visaType) => (
            <div key={visaType.id} className={`flex items-center justify-between p-3 border rounded-lg transition-opacity ${!visaType.is_active ? 'opacity-60' : ''}`}>
              {editingVisaType?.id === visaType.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    value={editingVisaType.name}
                    onChange={(e) => setEditingVisaType(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Visa type name"
                  />
                  <Select
                    value={editingVisaType.country_id || "none"}
                    onValueChange={(value) => setEditingVisaType(prev => prev ? { ...prev, country_id: value === "none" ? "" : value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any country</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name} ({country.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={editingVisaType.duration_months || ""}
                    onChange={(e) => setEditingVisaType(prev => prev ? { ...prev, duration_months: e.target.value ? parseInt(e.target.value) : null } : null)}
                    placeholder="Duration (months)"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateVisaType}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingVisaType(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{visaType.name}</span>
                      {visaType.country && (
                        <Badge variant="secondary">{visaType.country.code}</Badge>
                      )}
                      {visaType.duration_months && (
                        <Badge variant="outline">{visaType.duration_months}m</Badge>
                      )}
                      {!visaType.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    {visaType.country && (
                      <p className="text-sm text-muted-foreground">
                        Country: {visaType.country.name}
                      </p>
                    )}
                    {visaType.description && (
                      <p className="text-sm text-muted-foreground">{visaType.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={visaType.is_active}
                        onCheckedChange={(checked) => handleToggleActive(visaType.id, checked)}
                        disabled={isUpdating}
                      />
                      <Label className="text-xs font-medium">
                        {visaType.is_active ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingVisaType(visaType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteVisaType(visaType.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
