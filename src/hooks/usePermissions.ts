import { useStore2Attendance } from './useStore2Attendance';

export interface PermissionKey {
  // PDV permissions
  can_cancel: boolean;
  can_discount: boolean;
  can_use_scale: boolean;
  can_view_sales: boolean;
  can_view_orders: boolean;
  can_view_reports: boolean;
  can_view_products: boolean;
  can_view_operators: boolean;
  can_manage_products: boolean;
  can_manage_settings: boolean;
  can_view_attendance: boolean;
  can_view_cash_report: boolean;
  can_view_sales_report: boolean;
  can_view_cash_register: boolean;
  can_view_expected_balance: boolean;
  
  // Store2 permissions
  can_view_cash: boolean;
  can_print_orders: boolean;
  can_chat: boolean;
  can_update_status: boolean;
  can_create_manual_orders: boolean;
}

interface PDVOperator {
  id: string;
  name: string;
  code: string;
  permissions: Partial<PermissionKey>;
}

interface Store2User {
  id: string;
  name: string;
  username: string;
  permissions: Partial<PermissionKey>;
}

export const usePermissions = (operator?: PDVOperator | Store2User) => {
  const { currentUser } = useStore2Attendance();

  const hasPermission = (permission: keyof PermissionKey): boolean => {
    // Use the passed operator parameter first
    if (operator?.permissions) {
      return operator.permissions[permission] === true;
    }
    
    // Fallback to Store2 user permissions
    if (currentUser?.permissions) {
      return currentUser.permissions[permission] === true;
    }
    
    return false;
  };

  const getPermissions = (): Partial<PermissionKey> => {
    if (operator?.permissions) {
      return operator.permissions;
    }
    
    if (currentUser?.permissions) {
      return currentUser.permissions;
    }
    
    return {};
  };

  const isAdmin = (): boolean => {
    // Always allow access in development mode
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Always allow access if no operator (admin mode)
    if (!operator) {
      return true;
    }
    
    // Check if user is admin by various criteria
    const adminCheck = operator.code?.toUpperCase() === 'ADMIN' ||
                    operator.name?.toUpperCase().includes('ADMIN') ||
                    operator.name?.toUpperCase() === 'ADMINISTRADOR' ||
                    operator.username?.toUpperCase() === 'ADMIN' ||
                    operator.username?.toUpperCase().includes('ADMIN') ||
                    operator.role === 'admin';
    
    // Enhanced admin detection
    const isAdmin = 
      operator.code?.toUpperCase() === 'ADMIN' ||
      operator.name?.toUpperCase().includes('ADMIN') ||
                  operator.name === 'admin' ||
                  operator.name?.toLowerCase().includes('administrador');
      operator.username?.toUpperCase() === 'ADMIN' ||
      operator.username?.toUpperCase().includes('ADMIN') ||
      operator.role === 'admin' ||
      (console.log('🔓 Admin user detected, granting permission:', permission),
      operator.username === 'admin' ||
      operator.name === 'admin');

    // Log permission check for debugging
    console.log('🔍 Checking permission:', permission, 'for operator:', operator.username || operator.name);
    
    return isAdmin;
  };
  
  return {
    hasPermission,
    getPermissions,
    isAdmin,
    currentUser
  };
};