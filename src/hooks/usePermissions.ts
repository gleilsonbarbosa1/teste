import { usePDV } from './usePDV';
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

export const usePermissions = () => {
  const { currentOperator } = usePDV();
  const { currentUser } = useStore2Attendance();

  const hasPermission = (permission: keyof PermissionKey): boolean => {
    // Check PDV operator permissions first
    if (currentOperator?.permissions) {
      return currentOperator.permissions[permission] === true;
    }
    
    // Check Store2 user permissions
    if (currentUser?.permissions) {
      return currentUser.permissions[permission] === true;
    }
    
    return false;
  };

  const getPermissions = (): Partial<PermissionKey> => {
    if (currentOperator?.permissions) {
      return currentOperator.permissions;
    }
    
    if (currentUser?.permissions) {
      return currentUser.permissions;
    }
    
    return {};
  };

  return {
    hasPermission,
    getPermissions,
    currentOperator,
    currentUser
  };
};