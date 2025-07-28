@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
-import { usePermissions } from '../../hooks/usePermissions';
 import PermissionGuard from '../PermissionGuard';
@@ .. @@
 import CashRegisterPrintView from './CashRegisterPrintView';

-const CashRegisterMenu: React.FC = () => {
-  const { hasPermission } = usePermissions();
+interface CashRegisterMenuProps {
+  operator?: any;
+}
+
+const CashRegisterMenu: React.FC<CashRegisterMenuProps> = ({ operator }) => {
   const {
@@ .. @@
       {/* Close Confirmation Modal */}
       <CashRegisterCloseConfirmation
         isOpen={showCloseConfirmation}
         onClose={() => setShowCloseConfirmation(false)}
         onConfirm={handleConfirmClose}
         register={currentRegister}
         summary={summary}
         isProcessing={isClosing}
+        operator={operator}
       />
@@ .. @@
   return (
-    <PermissionGuard hasPermission={hasPermission('can_view_cash_register') || hasPermission('can_view_cash_report')} showMessage={true}>
+    <PermissionGuard hasPermission={operator?.permissions?.can_view_cash_register || operator?.permissions?.can_view_cash_report} showMessage={true}>
       <div className="space-y-6">