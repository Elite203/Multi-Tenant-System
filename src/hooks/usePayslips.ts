import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Payslip {
  id: string;
  employee_id: string;
  period: string;
  net_pay?: number;
  gross_pay?: number;
  tax?: number;
  ni?: number;
  pension?: number;
  other_deductions?: number;
  pay_date?: string;
  status: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

export interface PayslipSummary {
  totalPayslips: number;
  latestNetPay: number;
  yearToDate: number;
  pendingCount: number;
}

export const usePayslips = (employeeId?: string) => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PayslipSummary>({
    totalPayslips: 0,
    latestNetPay: 0,
    yearToDate: 0,
    pendingCount: 0
  });
  const { toast } = useToast();

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(id, first_name, last_name, employee_number)
        `);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query.order('pay_date', { ascending: false });

      if (error) {
        console.error('Error fetching payslips:', error);
        toast({
          title: "Error",
          description: "Failed to load payslips",
          variant: "destructive",
        });
        return;
      }

      const payslipData = data || [];
      setPayslips(payslipData);
      calculateSummary(payslipData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (payslipData: Payslip[]) => {
    const currentYear = new Date().getFullYear();
    const currentYearPayslips = payslipData.filter(p => 
      p.pay_date && new Date(p.pay_date).getFullYear() === currentYear
    );
    
    const latestPayslip = payslipData
      .filter(p => p.net_pay && p.pay_date)
      .sort((a, b) => new Date(b.pay_date!).getTime() - new Date(a.pay_date!).getTime())[0];

    const yearToDate = currentYearPayslips.reduce((sum, p) => sum + (p.net_pay || 0), 0);
    const pendingCount = payslipData.filter(p => p.status === 'pending').length;

    setSummary({
      totalPayslips: payslipData.length,
      latestNetPay: latestPayslip?.net_pay || 0,
      yearToDate,
      pendingCount
    });
  };

  const createPayslip = async (payslipData: Partial<Payslip> & { month: number; year: number; employee_id: string }) => {
    try {
      const { error } = await supabase
        .from('payslips')
        .insert(payslipData);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Payslip created successfully",
      });

      await fetchPayslips();
      return true;
    } catch (error) {
      console.error('Error creating payslip:', error);
      toast({
        title: "Error",
        description: "Failed to create payslip",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePayslip = async (id: string, updates: Partial<Payslip>) => {
    try {
      const { error } = await supabase
        .from('payslips')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Payslip updated successfully",
      });

      await fetchPayslips();
      return true;
    } catch (error) {
      console.error('Error updating payslip:', error);
      toast({
        title: "Error",
        description: "Failed to update payslip",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePayslip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payslips')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Payslip deleted successfully",
      });

      await fetchPayslips();
      return true;
    } catch (error) {
      console.error('Error deleting payslip:', error);
      toast({
        title: "Error",
        description: "Failed to delete payslip",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [employeeId]);

  return {
    payslips,
    loading,
    summary,
    fetchPayslips,
    createPayslip,
    updatePayslip,
    deletePayslip
  };
};