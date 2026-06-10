import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function useRotaShifts(startDate: Date, endDate: Date) {
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, let's check if we can connect to Supabase and if the tables exist
      const { data: tablesCheck, error: tablesError } = await supabase
        .from('rota_shifts')
        .select('id')
        .limit(1);

      if (tablesError) {
        // If the table doesn't exist or we can't access it, return empty data gracefully
        setShifts([]);
        setIsLoading(false);
        return;
      }

      // Simplified query without complex JOINs to avoid potential issues
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('rota_shifts')
        .select(`
          *
        `)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (shiftsError) {
        throw shiftsError;
      }

      // If we have shifts, fetch related data separately for better reliability
      if (shiftsData && shiftsData.length > 0) {
        const employeeIds = [...new Set(shiftsData.map(shift => shift.employee_id))];
        const shiftTypeIds = [...new Set(shiftsData.map(shift => shift.shift_type_id))];
        const locationIds = [...new Set(shiftsData.map(shift => shift.location_id))];
        const departmentIds = [...new Set(shiftsData.map(shift => shift.department_id).filter(Boolean))];

        // Fetch related data in parallel
        const [employeesRes, shiftTypesRes, locationsRes, departmentsRes] = await Promise.all([
          supabase.from('employees').select('id, first_name, last_name, profile_photo').in('id', employeeIds),
          supabase.from('rota_shift_types').select('id, name, color').in('id', shiftTypeIds),
          supabase.from('rota_locations').select('id, name, address').in('id', locationIds),
          departmentIds.length > 0 ? supabase.from('departments').select('id, name').in('id', departmentIds) : { data: [] }
        ]);

        // Create lookup maps for better performance
        const employeesMap = new Map();
        const shiftTypesMap = new Map();
        const locationsMap = new Map();
        const departmentsMap = new Map();
        
        employeesRes.data?.forEach((emp: any) => employeesMap.set(emp.id, emp));
        shiftTypesRes.data?.forEach((type: any) => shiftTypesMap.set(type.id, type));
        locationsRes.data?.forEach((loc: any) => locationsMap.set(loc.id, loc));
        departmentsRes.data?.forEach((dept: any) => departmentsMap.set(dept.id, dept));

        // Transform the data with proper fallbacks
        const transformedShifts = shiftsData.map((shift: any) => {
          const employee: any = employeesMap.get(shift.employee_id);
          const shiftType: any = shiftTypesMap.get(shift.shift_type_id);
          const location: any = locationsMap.get(shift.location_id);
          const department: any = departmentsMap.get(shift.department_id);

          return {
            ...shift,
            employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee',
            employee_avatar: employee?.profile_photo,
            shift_type_name: shiftType?.name || 'Unknown Shift Type',
            shift_type_color: shiftType?.color || '#3B82F6',
            location_name: location?.name || 'Unknown Location',
            location_address: location?.address,
            department_name: department?.name || 'N/A'
          };
        });

        setShifts(transformedShifts);
      } else {
        setShifts([]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching shifts:', err);
      // Set empty array instead of keeping loading state
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchShifts();
  };

  useEffect(() => {
    fetchShifts();
  }, [startDate.getTime(), endDate.getTime()]);

  return {
    shifts,
    isLoading,
    error,
    refetch
  };
}