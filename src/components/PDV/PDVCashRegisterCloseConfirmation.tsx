@@ .. @@
 import React, { useState } from 'react';
 import { X, AlertTriangle, DollarSign, CheckCircle, Printer } from 'lucide-react';
 import { PDVCashRegister, PDVCashRegisterSummary, PDVCashRegisterEntry } from '../../types/pdv';
-import { usePermissions } from '../../hooks/usePermissions';

 interface CashRegisterCloseConfirmationProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: (closingAmount: number, justification?: string) => void;
   register: PDVCashRegister | null;
   summary: PDVCashRegisterSummary | null;
   isProcessing: boolean;
+  operator?: any;
 }

 const CashRegisterCloseConfirmation: React.FC<CashRegisterCloseConfirmationProps> = ({
@@ .. @@
   onConfirm,
   register,
   summary,
-  isProcessing
+  isProcessing,
+  operator
 }) => {
-  const { hasPermission }
} = usePermissions();
-  const canViewExpectedBalance = hasPermission('can_view_expected_balance');
+  const canViewExpectedBalance = operator?.permissions?.can_view_expected_balance === true;

   if (!isOpen) return null;