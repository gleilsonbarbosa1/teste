import React from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceLogin from './Orders/AttendanceLogin';
import UnifiedAttendancePage from './UnifiedAttendancePage';
import { useAttendance } from '../hooks/useAttendance';

const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAttendance();

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 AttendancePage - Session state:', {
      isAuthenticated: session.isAuthenticated,
      user: session.user ? {
        username: session.user.username,
        name: session.user.name,
        role: session.user.role,
        permissions: Object.keys(session.user.permissions).filter(key => 
          session.user.permissions[key as keyof typeof session.user.permissions]
        )
      } : 'No user'
    });
  }, [session]);

  // Debug logging adicional
  React.useEffect(() => {
    console.log('🔍 AttendancePage - Dados completos:', {
      session,
      isAuthenticated: session.isAuthenticated,
      hasUser: !!session.user,
      userDetails: session.user
    });
  }, [session]);

  // Se o atendente está logado, mostrar painel de atendimento
  if (session.isAuthenticated) {
    console.log('✅ Usuário autenticado, renderizando UnifiedAttendancePage');
    return (
      <UnifiedAttendancePage 
        operator={session.user ? {
          id: session.user.id,
          name: session.user.username,
          username: session.user.username,
          code: session.user.username.toUpperCase(),
          password_hash: session.user.password_hash || '',
          role: session.user.role || 'admin',
          permissions: {
            can_discount: session.user.permissions?.can_discount || true,
            can_cancel: session.user.permissions?.can_cancel || true,
            can_use_scale: session.user.permissions?.can_use_scale || true,
            can_view_sales: session.user.permissions?.can_view_sales || true,
            can_view_orders: session.user.permissions?.can_view_orders || true,
            can_view_reports: session.user.permissions?.can_view_reports || true,
            can_view_products: session.user.permissions?.can_view_products || true,
            can_view_operators: session.user.permissions?.can_view_operators || true,
            can_manage_products: session.user.permissions?.can_manage_products || true,
            can_manage_settings: session.user.permissions?.can_manage_settings || true,
            can_view_attendance: session.user.permissions?.can_view_attendance || true,
            can_view_cash_report: session.user.permissions?.can_view_cash_report || true,
            can_view_sales_report: session.user.permissions?.can_view_sales_report || true,
            can_view_cash_register: session.user.permissions?.can_view_cash_register || true,
            can_view_expected_balance: session.user.permissions?.can_view_expected_balance || true
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null
        } : undefined}
        onLogout={logout}
      />
    );
  }

  console.log('❌ Usuário não autenticado, renderizando AttendanceLogin');
  // Se não está logado, mostrar tela de login
  return (
    <AttendanceLogin 
      onLogin={(username, password) => {
        console.log('🔐 Tentativa de login via AttendanceLogin:', { username });
        const success = login(username, password);
        console.log('🔐 Resultado do login:', success);
        
        // Forçar recarregamento dos usuários após login bem-sucedido
        if (success) {
          console.log('🔄 Login bem-sucedido, recarregando usuários...');
          // Pequeno delay para garantir que o estado foi atualizado
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
        
        return success;
      }} 
    />
  );
};

export default AttendancePage;