import { useState, useEffect } from 'react';

interface Store2User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'attendant' | 'admin';
  isActive: boolean;
  permissions: {
    can_view_orders: boolean;
    can_update_status: boolean;
    can_chat: boolean;
    can_create_manual_orders: boolean;
    can_print_orders: boolean;
  };
  created_at: string;
  last_login?: string;
}

interface Store2Session {
  isAuthenticated: boolean;
  user?: Store2User;
}

export const useStore2Attendance = () => {
  const [session, setSession] = useState<Store2Session>(() => {
    try {
      const storedSession = localStorage.getItem('store2_attendance_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        console.log('🔍 useStore2Attendance - Sessão recuperada do localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão da Loja 2:', error);
      localStorage.removeItem('store2_attendance_session');
    }
    return { isAuthenticated: false };
  });

  // Credenciais padrão para Loja 2
  const DEFAULT_CREDENTIALS = {
    username: 'loja2',
    password: 'elite2024'
  };

  // Usuários padrão da Loja 2
  const DEFAULT_USERS: Store2User[] = [
    {
      id: '1',
      username: 'loja2',
      password: 'elite2024',
      name: 'Administrador Loja 2',
      role: 'admin',
      isActive: true,
      permissions: {
        can_view_orders: false, // Loja 2 não tem delivery
        can_update_status: false,
        can_chat: false,
        can_create_manual_orders: false,
        can_print_orders: true
      },
      created_at: new Date().toISOString()
    }
  ];

  // Login
  const login = (username: string, password: string): boolean => {
    console.log('🔐 useStore2Attendance - Tentativa de login:', { username, password: password ? '***' : 'vazio' });
    
    // Verificar credenciais padrão
    if (username === DEFAULT_CREDENTIALS.username && password === DEFAULT_CREDENTIALS.password) {
      const adminUser = DEFAULT_USERS[0];
      
      const newSession = {
        isAuthenticated: true,
        user: adminUser
      };
      
      setSession(newSession);
      localStorage.setItem('store2_attendance_session', JSON.stringify(newSession));
      
      console.log('✅ useStore2Attendance - Login bem-sucedido (Loja 2)');
      return true;
    }

    console.log('❌ useStore2Attendance - Login falhou para Loja 2:', username);
    return false;
  };

  // Logout
  const logout = () => {
    console.log('🚪 useStore2Attendance - Logout Loja 2');
    setSession({ isAuthenticated: false });
    localStorage.removeItem('store2_attendance_session');
  };

  return {
    session,
    login,
    logout
  };
};