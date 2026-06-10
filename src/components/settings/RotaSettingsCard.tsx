import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RotaSettingsCardProps {
  getSetting: (key: string) => any;
  updateSetting: (key: string, value: string | number | boolean) => void;
  isUpdating: boolean;
}

export function RotaSettingsCard({ getSetting, updateSetting, isUpdating }: RotaSettingsCardProps) {
  const [shiftTypes, setShiftTypes] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [newShiftType, setNewShiftType] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [enableRotaModule, setEnableRotaModule] = useState(
    getSetting("rota_module_enabled")?.value || true
  );
  const [defaultShiftDuration, setDefaultShiftDuration] = useState(
    getSetting("default_shift_duration")?.value || 8
  );

  // Load actual ROTA data from database
  useEffect(() => {
    loadRotaData();
  }, []);

  const loadRotaData = async () => {
    try {
      setLoading(true);
      
      // Fetch shift types and locations from database
      const [shiftTypesRes, locationsRes] = await Promise.all([
        supabase.from('rota_shift_types').select('*').eq('is_active', true),
        supabase.from('rota_locations').select('*').eq('is_active', true)
      ]);

      if (shiftTypesRes.data) setShiftTypes(shiftTypesRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);
    } catch (error) {
      console.error('Error loading ROTA data:', error);
      toast({
        title: "Error",
        description: "Failed to load ROTA settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addShiftType = async (type: string) => {
    if (!type.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('rota_shift_types')
        .insert({
          name: type.trim(),
          description: `Custom shift type: ${type.trim()}`,
          color: '#3B82F6',
          duration_hours: defaultShiftDuration
        })
        .select()
        .single();

      if (error) throw error;

      setShiftTypes([...shiftTypes, data]);
      setNewShiftType("");
      toast({
        title: "Success",
        description: "Shift type added successfully",
      });
    } catch (error) {
      console.error('Error adding shift type:', error);
      toast({
        title: "Error",
        description: "Failed to add shift type",
        variant: "destructive",
      });
    }
  };

  const removeShiftType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rota_shift_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setShiftTypes(shiftTypes.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Shift type removed successfully",
      });
    } catch (error) {
      console.error('Error removing shift type:', error);
      toast({
        title: "Error",
        description: "Failed to remove shift type",
        variant: "destructive",
      });
    }
  };

  const addLocation = async (location: string) => {
    if (!location.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('rota_locations')
        .insert({
          name: location.trim(),
          description: `Custom location: ${location.trim()}`
        })
        .select()
        .single();

      if (error) throw error;

      setLocations([...locations, data]);
      setNewLocation("");
      toast({
        title: "Success",
        description: "Location added successfully",
      });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: "Error",
        description: "Failed to add location",
        variant: "destructive",
      });
    }
  };

  const removeLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rota_locations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setLocations(locations.filter(l => l.id !== id));
      toast({
        title: "Success",
        description: "Location removed successfully",
      });
    } catch (error) {
      console.error('Error removing location:', error);
      toast({
        title: "Error",
        description: "Failed to remove location",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    updateSetting("rota_module_enabled", enableRotaModule);
    updateSetting("default_shift_duration", defaultShiftDuration);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          ROTA Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ROTA scheduling module is active! Configure shift types and locations below.
          </AlertDescription>
        </Alert>

        {/* Module Enable/Disable */}
        <div className="flex items-center space-x-2">
          <Switch
            id="enable_rota_module"
            checked={enableRotaModule}
            onCheckedChange={setEnableRotaModule}
          />
          <Label htmlFor="enable_rota_module">Enable ROTA Module</Label>
        </div>

        {/* Default Shift Duration */}
        <div className="space-y-2">
          <Label htmlFor="default_shift_duration">Default Shift Duration (Hours)</Label>
          <Input
            id="default_shift_duration"
            type="number"
            min="1"
            max="24"
            value={defaultShiftDuration}
            onChange={(e) => setDefaultShiftDuration(Number(e.target.value))}
          />
        </div>

        {/* Shift Types Management */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Shift Types</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {shiftTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{ backgroundColor: `${type.color}20`, color: type.color }}
                >
                  {type.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeShiftType(type.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newShiftType}
                onChange={(e) => setNewShiftType(e.target.value)}
                placeholder="Add new shift type"
                onKeyPress={(e) => e.key === 'Enter' && addShiftType(newShiftType)}
              />
              <Button onClick={() => addShiftType(newShiftType)} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Locations Management */}
          <div>
            <Label className="text-base font-medium">Work Locations</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {locations.map((location) => (
                <Badge
                  key={location.id}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {location.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeLocation(location.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Add new location"
                onKeyPress={(e) => e.key === 'Enter' && addLocation(newLocation)}
              />
              <Button onClick={() => addLocation(newLocation)} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isUpdating || loading}>
          {isUpdating ? "Saving..." : "Save ROTA Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}