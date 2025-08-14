import { useState } from 'react';

interface AttendanceUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'attendant' | 'admin';
  isActive: boolean;
  permissions: {
    can_chat: boolean;
    can_view_orders: boolean;
    can_print_orders: boolean;
    can_update_status: boolean;
    can_create_manual_orders: boolean;
    can_view_cash_register: boolean;
    can_view_sales: boolean;
    can_view_reports: boolean;
    can_view_cash_report: boolean;
    can_view_sales_report: boolean;
    can_manage_products: boolean;
    can_view_operators: boolean;
    can_view_attendance: boolean;
    can_manage_settings: boolean;
    can_use_scale: boolean;
    can_discount: boolean;
    can_cancel: boolean;
    can_view_expected_balance: boolean;
  };
  created_at: string;
  last_login?: string;
}

interface AttendanceSession {
  isAuthenticated: boolean;
  user?: AttendanceUser;
}

export const useAttendance = () => {
  const [session, setSession] = useState<AttendanceSession>(() => {
    // Verificar se há sessão salva
    try {
      const savedSession = localStorage.getItem('attendance_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        console.log('🔄 Sessão de atendimento recuperada:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      localStorage.removeItem('attendance_session');
    }
    return { isAuthenticated: false };
  });

  // 🔐 CREDENCIAIS DE ACESSO - MODIFIQUE AQUI
  const CREDENTIALS = {
    username: 'admin',     // ← ALTERE O USUÁRIO AQUI
    password: 'elite2024'  // ← ALTERE A SENHA AQUI
  };

  const login = (username: string, password: string): boolean => {
    console.log('🔐 Tentativa de login no atendimento:', { username, password: password ? '***' : 'vazio' });
    
    // Verificar credenciais hardcoded primeiro
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      console.log('✅ Login bem-sucedido com credenciais hardcoded');
      
      const adminUser: AttendanceUser = {
        id: '1',
        username: CREDENTIALS.username,
        password: CREDENTIALS.password,
        name: 'Administrador',
        role: 'admin',
        isActive: true,
        permissions: {
          can_chat: true,
          can_view_orders: true,
          can_print_orders: true,
          can_update_status: true,
          can_create_manual_orders: true,
          can_view_cash_register: true,
          can_view_sales: true,
          can_view_reports: true,
          can_view_cash_report: true,
          can_view_sales_report: true,
          can_manage_products: true,
          can_view_operators: true,
          can_view_attendance: true,
          can_manage_settings: true,
          can_use_scale: true,
          can_discount: true,
          can_cancel: true,
          can_view_expected_balance: true
        },
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      const newSession = {
        isAuthenticated: true,
        user: adminUser
      };

      setSession(newSession);
      localStorage.setItem('attendance_session', JSON.stringify(newSession));
      console.log('💾 Sessão salva no localStorage');
      return true;
    }

    // Verificar usuários criados no painel administrativo
    try {
      const savedUsers = localStorage.getItem('attendance_users');
      if (savedUsers) {
        const users: AttendanceUser[] = JSON.parse(savedUsers);
        console.log('👥 Usuários encontrados no localStorage:', users.length);
        
        const user = users.find(u => 
          u.username === username && 
          u.password === password && 
          u.isActive
        );

        if (user) {
          console.log('✅ Login bem-sucedido com usuário do localStorage:', user.username);
          
          // Garantir que o usuário tem todas as permissões necessárias
          const userWithFullPermissions = {
            ...user,
            permissions: {
              can_chat: true,
              can_view_orders: true,
              can_print_orders: true,
              can_update_status: true,
              can_create_manual_orders: true,
              can_view_cash_register: true,
              can_view_sales: true,
              can_view_reports: true,
              can_view_cash_report: true,
              can_view_sales_report: true,
              can_manage_products: true,
              can_view_operators: true,
              can_view_attendance: true,
              can_manage_settings: true,
              can_use_scale: true,
              can_discount: true,
              can_cancel: true,
              can_view_expected_balance: true
            },
            last_login: new Date().toISOString()
          };

          const newSession = {
            isAuthenticated: true,
            user: userWithFullPermissions
          };

          setSession(newSession);
          localStorage.setItem('attendance_session', JSON.stringify(newSession));
          
          // Atualizar o usuário no localStorage com as novas permissões
          const updatedUsers = users.map(u => 
            u.id === user.id ? userWithFullPermissions : u
          );
          localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
          
          console.log('💾 Sessão e permissões atualizadas');
          return true;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar usuários:', error);
    }

    console.log('❌ Login falhou - credenciais inválidas');
    return false;
  };

  const logout = () => {
    console.log('🚪 Logout do atendimento');
    setSession({ isAuthenticated: false });
    localStorage.removeItem('attendance_session');
  };

  // Funções para gerenciar usuários (compatibilidade)
  const users: AttendanceUser[] = [];
  const loading = false;
  const error = null;

  const createUser = async (userData: Omit<AttendanceUser, 'id' | 'created_at'>) => {
    try {
      const savedUsers = localStorage.getItem('attendance_users');
      const existingUsers: AttendanceUser[] = savedUsers ? JSON.parse(savedUsers) : [];
      
      const newUser: AttendanceUser = {
        ...userData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        permissions: {
          can_chat: true,
          can_view_orders: true,
          can_print_orders: true,
          can_update_status: true,
          can_create_manual_orders: true,
          can_view_cash_register: true,
          can_view_sales: true,
          can_view_reports: true,
          can_view_cash_report: true,
          can_view_sales_report: true,
          can_manage_products: true,
          can_view_operators: true,
          can_view_attendance: true,
          can_manage_settings: true,
          can_use_scale: true,
          can_discount: true,
          can_cancel: true,
          can_view_expected_balance: true
        }
      };
      
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
      
      console.log('✅ Usuário criado com permissões completas:', newUser.username);
      return newUser;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<AttendanceUser>) => {
    try {
      const savedUsers = localStorage.getItem('attendance_users');
      if (!savedUsers) return;
      
      const users: AttendanceUser[] = JSON.parse(savedUsers);
      const updatedUsers = users.map(user => 
        user.id === id ? { 
          ...user, 
          ...updates,
          permissions: {
            can_chat: true,
            can_view_orders: true,
            can_print_orders: true,
            can_update_status: true,
            can_create_manual_orders: true,
            can_view_cash_register: true,
            can_view_sales: true,
            can_view_reports: true,
            can_view_cash_report: true,
            can_view_sales_report: true,
            can_manage_products: true,
            can_view_operators: true,
            can_view_attendance: true,
            can_manage_settings: true,
            can_use_scale: true,
            can_discount: true,
            can_cancel: true,
            can_view_expected_balance: true
          }
        } : user
      );
      
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
      console.log('✅ Usuário atualizado com permissões completas');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const savedUsers = localStorage.getItem('attendance_users');
      if (!savedUsers) return;
      
      const users: AttendanceUser[] = JSON.parse(savedUsers);
      const updatedUsers = users.filter(user => user.id !== id);
      
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
      console.log('✅ Usuário excluído');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    // Função de compatibilidade - não faz nada pois os dados já estão no localStorage
  };

  return {
    session,
    login,
    logout,
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    fetchUsers
  };
};