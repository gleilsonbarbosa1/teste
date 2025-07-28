import { useState, useCallback } from 'react';

interface Store2AttendanceSession {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    role: 'attendant' | 'admin';
    permissions: {
      can_view_orders: boolean;
      can_update_status: boolean;
      can_chat: boolean;
      can_create_manual_orders: boolean;
      can_print_orders: boolean;
      can_view_expected_balance: boolean;
    };
  };
}

export const useStore2Attendance = () => {
  const [session, setSession] = useState<Store2AttendanceSession>({
    isAuthenticated: false
  });

  const login = useCallback((username: string, password: string): boolean => {
    console.log('🔐 Tentativa de login na Loja 2:', username);
    
    // Carregar usuários do localStorage
    const savedUsers = localStorage.getItem('store2_users');
    let users = [];
    
    if (savedUsers) {
      try {
        users = JSON.parse(savedUsers);
        console.log('👥 Usuários carregados do localStorage:', users.length);
      } catch (error) {
        console.error('Erro ao carregar usuários da Loja 2:', error);
        return false;
      }
    } else {
      console.log('⚠️ Nenhum usuário encontrado no localStorage, criando usuário padrão');
      // Criar usuário padrão se não existir
      users = [{
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
          can_print_orders: true,
          can_view_expected_balance: true
        },
        created_at: new Date().toISOString()
      }];
      localStorage.setItem('store2_users', JSON.stringify(users));
    }
    
    // Verificar credenciais
    const user = users.find(u => 
      u.username === username && 
      u.password === password && 
      u.isActive
    );
    
    if (user) {
      console.log('✅ Login da Loja 2 bem-sucedido para:', user.name);
      
      // Atualizar último login
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, last_login: new Date().toISOString() } : u
      );
      localStorage.setItem('store2_users', JSON.stringify(updatedUsers));
      
      setSession({
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions || {
            can_view_orders: false,
            can_update_status: false,
            can_chat: false,
            can_create_manual_orders: false,
            can_print_orders: true,
            can_view_expected_balance: false
          }
        }
      });
      return true;
    } else {
      console.log('❌ Login da Loja 2 falhou - credenciais inválidas ou usuário inativo');
      console.log('🔍 Usuários disponíveis:', users.map(u => ({ 
        username: u.username, 
        isActive: u.isActive,
        hasPassword: !!u.password 
      })));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Logout da Loja 2');
    setSession({
      isAuthenticated: false
    });
  }, []);

  // Função para obter o usuário atual
  const getCurrentUser = useCallback(() => {
    return session.user || null;
  }, [session.user]);

  return {
    session,
    login,
    logout,
    getCurrentUser,
    currentUser: session.user
  };
};