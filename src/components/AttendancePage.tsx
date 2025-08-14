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
          role: session.user.role || 'admin',
          password_hash: session.user.password || '',
          permissions: {
            ...session.user.permissions
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
        return success;
      }} 
    />
  );
};

export default AttendancePage;