import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Country {
  id: string;
  name: string;
  code: string;
  currency_code: string | null;
  is_eu: boolean;
  is_active: boolean;
}

interface CountriesManagementProps {
  isUpdating: boolean;
}

export const CountriesManagement = ({ isUpdating }: CountriesManagementProps) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [newCountry, setNewCountry] = useState({
    name: "",
    code: "",
    currency_code: "",
    is_eu: false,
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch countries",
        variant: "destructive",
      });
    } else {
      setCountries(data || []);
    }
  };

  const handleAddCountry = async () => {
    if (!newCountry.name.trim() || !newCountry.code.trim()) return;

    const { error } = await supabase
      .from("countries")
      .insert([{
        name: newCountry.name,
        code: newCountry.code.toUpperCase(),
        currency_code: newCountry.currency_code.toUpperCase() || null,
        is_eu: newCountry.is_eu,
        is_active: newCountry.is_active
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add country",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Country added successfully",
      });
      setNewCountry({ name: "", code: "", currency_code: "", is_eu: false, is_active: true });
      fetchCountries();
    }
  };

  const handleUpdateCountry = async () => {
    if (!editingCountry) return;

    const { error } = await supabase
      .from("countries")
      .update({
        name: editingCountry.name,
        code: editingCountry.code.toUpperCase(),
        currency_code: editingCountry.currency_code?.toUpperCase() || null,
        is_eu: editingCountry.is_eu,
        is_active: editingCountry.is_active
      })
      .eq("id", editingCountry.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update country",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Country updated successfully",
      });
      setEditingCountry(null);
      fetchCountries();
    }
  };

  const handleDeleteCountry = async (id: string) => {
    const { error } = await supabase
      .from("countries")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete country. It may be in use.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Country deleted successfully",
      });
      fetchCountries();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("countries")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update country status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Country ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      fetchCountries();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Countries Management</CardTitle>
        <CardDescription>
          Manage supported countries, currencies, and regional classifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Country */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Add New Country</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country-name">Country Name *</Label>
              <Input
                id="country-name"
                placeholder="e.g., United Kingdom"
                value={newCountry.name}
                onChange={(e) => setNewCountry(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="country-code">Country Code *</Label>
              <Input
                id="country-code"
                placeholder="e.g., GB"
                value={newCountry.code}
                onChange={(e) => setNewCountry(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="currency-code">Currency Code</Label>
              <Input
                id="currency-code"
                placeholder="e.g., GBP"
                value={newCountry.currency_code}
                onChange={(e) => setNewCountry(prev => ({ ...prev, currency_code: e.target.value.toUpperCase() }))}
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-eu"
                  checked={newCountry.is_eu}
                  onCheckedChange={(checked) => setNewCountry(prev => ({ ...prev, is_eu: checked }))}
                />
                <Label htmlFor="is-eu">EU Member</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="country-active"
                  checked={newCountry.is_active}
                  onCheckedChange={(checked) => setNewCountry(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="country-active">Active</Label>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleAddCountry} 
            disabled={isUpdating || !newCountry.name.trim() || !newCountry.code.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Country
          </Button>
        </div>

        {/* Existing Countries */}
        <div className="space-y-3">
          <h4 className="font-medium">Existing Countries ({countries.length})</h4>
          {countries.map((country) => (
            <div key={country.id} className={`flex items-center justify-between p-3 border rounded-lg transition-opacity ${!country.is_active ? 'opacity-60' : ''}`}>
              {editingCountry?.id === country.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input
                    value={editingCountry.name}
                    onChange={(e) => setEditingCountry(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Country name"
                  />
                  <Input
                    value={editingCountry.code}
                    onChange={(e) => setEditingCountry(prev => prev ? { ...prev, code: e.target.value.toUpperCase() } : null)}
                    placeholder="Code"
                    maxLength={2}
                  />
                  <Input
                    value={editingCountry.currency_code || ""}
                    onChange={(e) => setEditingCountry(prev => prev ? { ...prev, currency_code: e.target.value.toUpperCase() } : null)}
                    placeholder="Currency"
                    maxLength={3}
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingCountry.is_eu}
                      onCheckedChange={(checked) => setEditingCountry(prev => prev ? { ...prev, is_eu: checked } : null)}
                    />
                    <Label className="text-xs">EU</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateCountry}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingCountry(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{country.name}</span>
                      <Badge variant="secondary">{country.code}</Badge>
                      {country.currency_code && (
                        <Badge variant="outline">{country.currency_code}</Badge>
                      )}
                      {country.is_eu && (
                        <Badge>EU</Badge>
                      )}
                      {!country.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={country.is_active}
                        onCheckedChange={(checked) => handleToggleActive(country.id, checked)}
                        disabled={isUpdating}
                      />
                      <Label className="text-xs font-medium">
                        {country.is_active ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingCountry(country)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCountry(country.id)}
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
