import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'hr' | 'manager' | 'employee' | 'director';

export interface PermissionConfig {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canManageTeam: boolean;
  canSubmit?: boolean;
  canApprove?: boolean;
}

export const usePermissions = () => {
  const { user, profile } = useAuth();
  const role = profile?.role as UserRole;

  const isAdmin = role === 'admin';
  const isHR = role === 'hr';
  const isManager = role === 'manager' || role === 'director';
  const isEmployee = role === 'employee';

  // Helper functions for role checks
  const canManageEmployees = isAdmin || isHR;
  const canArchiveRecords = isAdmin || isHR;
  const canHardDelete = isAdmin;
  const canViewSensitiveData = isAdmin || isHR;
  const canViewTeamStructure = isAdmin || isHR || isManager;

  // Get permissions for different data types
  const getEmployeePermissions = (): PermissionConfig => ({
    canView: canManageEmployees,
    canCreate: canManageEmployees,
    canUpdate: canManageEmployees,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: isManager || canManageEmployees,
  });

  const getCertificationPermissions = (): PermissionConfig => ({
    canView: true,
    canCreate: canManageEmployees,
    canUpdate: canManageEmployees,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getTrainingPermissions = (): PermissionConfig => ({
    canView: true,
    canCreate: canManageEmployees || isManager,
    canUpdate: canManageEmployees || isManager,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: isManager || canManageEmployees,
  });

  const getEducationPermissions = (): PermissionConfig => ({
    canView: true,
    canCreate: canManageEmployees,
    canUpdate: canManageEmployees,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getFinancialPermissions = (): PermissionConfig => ({
    canView: canViewSensitiveData,
    canCreate: canViewSensitiveData,
    canUpdate: canViewSensitiveData,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getImmigrationPermissions = (): PermissionConfig => ({
    canView: canViewSensitiveData,
    canCreate: canViewSensitiveData,
    canUpdate: canViewSensitiveData,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getWorkProfilePermissions = (): PermissionConfig => ({
    canView: true,
    canCreate: canManageEmployees,
    canUpdate: canManageEmployees,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getTimesheetPermissions = (): PermissionConfig => ({
    canView: true, // Everyone can view their own timesheets
    canCreate: true, // Everyone can create timesheets
    canUpdate: true, // Everyone can update their own timesheets
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: isManager || canManageEmployees,
    canSubmit: true, // Everyone can submit their timesheets
    canApprove: isManager || canManageEmployees, // Only managers and above can approve
  });

  const getPayslipPermissions = (): PermissionConfig => ({
    canView: canViewSensitiveData,
    canCreate: canViewSensitiveData,
    canUpdate: canViewSensitiveData,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getPassportPermissions = (): PermissionConfig => ({
    canView: canViewSensitiveData,
    canCreate: canViewSensitiveData,
    canUpdate: canViewSensitiveData,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getVisaPermissions = (): PermissionConfig => ({
    canView: canViewSensitiveData,
    canCreate: canViewSensitiveData,
    canUpdate: canViewSensitiveData,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getRTWPermissions = (): PermissionConfig => ({
    canView: canViewSensitiveData,
    canCreate: canViewSensitiveData,
    canUpdate: canViewSensitiveData,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getCOSPermissions = (): PermissionConfig => ({
    canView: canViewSensitiveData,
    canCreate: canViewSensitiveData,
    canUpdate: canViewSensitiveData,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  const getLeavePermissions = (): PermissionConfig => ({
    canView: true,
    canCreate: true, // Employees can create their own leave requests
    canUpdate: canManageEmployees, // Only HR/Admin can update leave balances
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: isManager || canManageEmployees,
  });

  const getDocumentPermissions = (): PermissionConfig => ({
    canView: true,
    canCreate: true, // Employees can upload their own documents
    canUpdate: canManageEmployees,
    canArchive: canArchiveRecords,
    canDelete: canHardDelete,
    canManageTeam: false,
  });

  return {
    role,
    isAdmin,
    isHR,
    isManager,
    isEmployee,
    canManageEmployees,
    canArchiveRecords,
    canHardDelete,
    canViewSensitiveData,
    canViewTeamStructure,
    getEmployeePermissions,
    getCertificationPermissions,
    getTrainingPermissions,
    getEducationPermissions,
    getFinancialPermissions,
    getImmigrationPermissions,
    getWorkProfilePermissions,
    getTimesheetPermissions,
    getPayslipPermissions,
    getPassportPermissions,
    getVisaPermissions,
    getRTWPermissions,
    getCOSPermissions,
    getLeavePermissions,
    getDocumentPermissions,
  };
};