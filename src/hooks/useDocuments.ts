import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DocumentCategory = "personal" | "certificate" | "employment" | "financial" | "compliance";

export interface Document {
  id: string;
  name: string;
  category: string; // Use string to match database enum
  file_path: string;
  file_size?: number;
  size_mb?: number;
  content_type?: string;
  expiry_date?: string;
  created_at: string;
  updated_at?: string;
  uploaded_by?: string;
  employee_id?: string;
  company_id?: string;
  profile_id?: string;
  status?: string;
  notes?: string;
  ai_processed?: boolean;
  extraction_method?: string;
  type_confidence?: number;
  document_hash?: string;
  document_category?: string;
  company_type?: string;
  is_active?: boolean;
  // Employee information
  employee_name?: string;
  employee_number?: string;
  // Company information  
  company_name?: string;
}

export interface DocumentFilters {
  searchTerm?: string;
  category?: string;
  entityType?: 'employee' | 'company' | 'all';
  status?: string;
  showExpiringSoon?: boolean;
}

export interface DocumentSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DocumentStats {
  total: number;
  employee: number;
  company: number;
  totalSizeMB: number;
  expired: number;
  expiringSoon: number;
}

export const useDocuments = (entityId?: string, entityType?: 'employee' | 'company') => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    employee: 0,
    company: 0,
    totalSizeMB: 0,
    expired: 0,
    expiringSoon: 0
  });
  const { toast } = useToast();

  const fetchDocuments = useCallback(async (filters?: DocumentFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('documents')
        .select(`
          *,
          employees!documents_employee_id_fkey(first_name, last_name, employee_number),
          companies!documents_company_id_fkey(name)
        `)
        .eq('is_active', true);

      // Apply entity filtering
      if (entityId && entityType) {
        if (entityType === 'employee') {
          query = query.eq('employee_id', entityId);
        } else if (entityType === 'company') {
          query = query.eq('company_id', entityId);
        }
      }

      // Apply additional filters
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category as any);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.searchTerm) {
        query = query.ilike('name', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      let filteredData = data || [];

      // Apply expiry filtering if needed
      if (filters?.showExpiringSoon) {
        filteredData = filteredData.filter(doc => {
          if (!doc.expiry_date) return false;
          const daysUntilExpiry = Math.ceil(
            (new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );
          return daysUntilExpiry <= 30;
        });
      }

      setDocuments(filteredData.map(doc => ({
        ...doc,
        employee_name: doc.employees ? `${doc.employees.first_name} ${doc.employees.last_name}` : undefined,
        employee_number: doc.employees?.employee_number,
        company_name: doc.companies?.name
      })) as Document[]);
      
      // Calculate statistics
      const stats = calculateStats(filteredData as Document[]);
      setStats(stats);

    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, toast]);

  const fetchAllDocuments = useCallback(async (filters?: DocumentFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('documents')
        .select(`
          *,
          employees!documents_employee_id_fkey(first_name, last_name, employee_number),
          companies!documents_company_id_fkey(name)
        `)
        .eq('is_active', true);

      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category as any);
      }

      if (filters?.entityType && filters.entityType !== 'all') {
        if (filters.entityType === 'employee') {
          query = query.not('employee_id', 'is', null);
        } else if (filters.entityType === 'company') {
          query = query.not('company_id', 'is', null);
        }
      }

      if (filters?.searchTerm) {
        query = query.ilike('name', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      let filteredData = data || [];

      // Apply expiry filtering if needed
      if (filters?.showExpiringSoon) {
        filteredData = filteredData.filter(doc => {
          if (!doc.expiry_date) return false;
          const daysUntilExpiry = Math.ceil(
            (new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );
          return daysUntilExpiry <= 30;
        });
      }

      setDocuments(filteredData.map(doc => ({
        ...doc,
        employee_name: doc.employees ? `${doc.employees.first_name} ${doc.employees.last_name}` : undefined,
        employee_number: doc.employees?.employee_number,
        company_name: doc.companies?.name
      })) as Document[]);
      
      // Calculate statistics
      const stats = calculateStats(filteredData as Document[]);
      setStats(stats);

    } catch (error) {
      console.error('Error fetching all documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const calculateStats = (docs: Document[]): DocumentStats => {
    const today = new Date();
    
    return {
      total: docs.length,
      employee: docs.filter(doc => doc.employee_id).length,
      company: docs.filter(doc => doc.company_id).length,
      totalSizeMB: docs.reduce((sum, doc) => sum + (doc.size_mb || 0), 0),
      expired: docs.filter(doc => {
        if (!doc.expiry_date) return false;
        return new Date(doc.expiry_date) < today;
      }).length,
      expiringSoon: docs.filter(doc => {
        if (!doc.expiry_date) return false;
        const daysUntilExpiry = Math.ceil(
          (new Date(doc.expiry_date).getTime() - today.getTime()) / (1000 * 3600 * 24)
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      }).length
    };
  };

  const uploadDocument = async (
    file: File,
    metadata: {
      name: string;
      category: DocumentCategory;
      expiry_date?: Date;
      employee_id?: string;
      company_id?: string;
      notes?: string;
    }
  ) => {
    try {
      setUploading(true);

      // Generate file path
      const entityPrefix = metadata.employee_id ? 'employees' : 'companies';
      const entityId = metadata.employee_id || metadata.company_id;
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${entityPrefix}/${entityId}/documents/${fileName}`;

      // Calculate file size in MB
      const sizeMB = file.size / (1024 * 1024);

      // Insert document record
      const documentData = {
        name: metadata.name,
        category: metadata.category,
        file_path: filePath,
        file_size: file.size,
        size_mb: sizeMB,
        content_type: file.type,
        expiry_date: metadata.expiry_date ? metadata.expiry_date.toISOString().split('T')[0] : null,
        employee_id: metadata.employee_id || null,
        company_id: metadata.company_id || null,
        notes: metadata.notes || null,
        status: 'active',
        ai_processed: false
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Refresh documents list
      if (entityId && entityType) {
        fetchDocuments();
      } else {
        fetchAllDocuments();
      }

      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_active: false })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      // Refresh documents list
      if (entityId && entityType) {
        fetchDocuments();
      } else {
        fetchAllDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const updateDocument = async (documentId: string, updates: Partial<Document>) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update(updates as any)
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document updated successfully",
      });

      // Refresh documents list
      if (entityId && entityType) {
        fetchDocuments();
      } else {
        fetchAllDocuments();
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (entityId && entityType) {
      fetchDocuments();
    } else {
      // If no specific entity, fetch all documents
      fetchAllDocuments();
    }
  }, [fetchDocuments, fetchAllDocuments, entityId, entityType]);

  return {
    documents,
    loading,
    uploading,
    stats,
    fetchDocuments,
    fetchAllDocuments,
    uploadDocument,
    deleteDocument,
    updateDocument,
    refetch: entityId && entityType ? fetchDocuments : fetchAllDocuments
  };
};