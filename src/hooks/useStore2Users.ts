import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Store2User {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'attendant' | 'admin';
  is_active: boolean;
  permissions: {
    can_view_orders: boolean;
    can_update_status: boolean;
    can_chat: boolean;
    can_create_manual_orders: boolean;
    can_print_orders: boolean;
    can_view_expected_balance: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export const useStore2Users = () => {
  const [users, setUsers] = useState<Store2User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando localStorage para usuários da Loja 2');
        loadUsersFromLocalStorage();
        return;
      }

      console.log('🔄 Carregando usuários da Loja 2 do banco de dados...');
      
      const { data, error } = await supabase
        .from('store2_users')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Erro ao carregar usuários do banco:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} usuários da Loja 2 carregados do banco`);
      setUsers(data || []);
      
      // Se não há usuários no banco, criar usuário padrão
      if (!data || data.length === 0) {
        console.log('🔧 Criando usuário padrão da Loja 2...');
        await createDefaultUser();
      }
    } catch (err) {
      console.error('❌ Erro ao carregar usuários da Loja 2:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      
      // Fallback para localStorage em caso de erro
      loadUsersFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsersFromLocalStorage = () => {
    try {
      const savedUsers = localStorage.getItem('store2_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        const usersWithPermissions = parsedUsers.map(user => ({
          ...user,
          password_hash: user.password || user.password_hash,
          is_active: user.isActive !== undefined ? user.isActive : user.is_active,
          permissions: user.permissions || {
            can_view_orders: false,
            can_update_status: false,
            can_chat: false,
            can_create_manual_orders: false,
            can_print_orders: true,
            can_view_expected_balance: false
          }
        }));
        setUsers(usersWithPermissions);
      } else {
        createDefaultUserLocalStorage();
      }
    } catch (error) {
      console.error('Erro ao carregar usuários do localStorage:', error);
      createDefaultUserLocalStorage();
    }
  };

  const createDefaultUser = async () => {
    try {
      const defaultUser = {
        username: 'loja2',
        password_hash: 'elite2024', // Will be hashed by trigger
        name: 'Administrador Loja 2',
        role: 'admin',
        is_active: true,
        permissions: {
          can_view_orders: false,
          can_update_status: false,
          can_chat: false,
          can_create_manual_orders: false,
          can_print_orders: true,
          can_view_expected_balance: true
        }
      };

      const { data, error } = await supabase
        .from('store2_users')
        .insert([defaultUser])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Usuário padrão da Loja 2 criado:', data);
      setUsers([data]);
    } catch (error) {
      console.error('❌ Erro ao criar usuário padrão:', error);
      createDefaultUserLocalStorage();
    }
  };

  const createDefaultUserLocalStorage = () => {
    const defaultUsers: Store2User[] = [
      {
        id: '1',
        username: 'loja2',
        password_hash: 'elite2024',
        name: 'Administrador Loja 2',
        role: 'admin',
        is_active: true,
        permissions: {
          can_view_orders: false,
          can_update_status: false,
          can_chat: false,
          can_create_manual_orders: false,
          can_print_orders: true,
          can_view_expected_balance: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setUsers(defaultUsers);
    localStorage.setItem('store2_users', JSON.stringify(defaultUsers));
  };

  const saveUser = useCallback(async (user: Store2User) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        // Fallback to localStorage
        const updatedUsers = users.map(u => u.id === user.id ? user : u);
        setUsers(updatedUsers);
        localStorage.setItem('store2_users', JSON.stringify(updatedUsers));
        return user;
      }

      console.log('💾 Salvando usuário da Loja 2 no banco:', user.username);

      const { data, error } = await supabase
        .from('store2_users')
        .update({
          username: user.username,
          password_hash: user.password_hash,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          permissions: user.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Usuário da Loja 2 atualizado no banco');
      setUsers(prev => prev.map(u => u.id === user.id ? data : u));
      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error);
      throw error;
    }
  }, [users]);

  const createUser = useCallback(async (userData: Omit<Store2User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        // Fallback to localStorage
        const newUser: Store2User = {
          ...userData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('store2_users', JSON.stringify(updatedUsers));
        return newUser;
      }

      console.log('🚀 Criando usuário da Loja 2 no banco:', userData.username);

      const { data, error } = await supabase
        .from('store2_users')
        .insert([{
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Usuário da Loja 2 criado no banco:', data);
      setUsers(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }, [users]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        // Fallback to localStorage
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        localStorage.setItem('store2_users', JSON.stringify(updatedUsers));
        return;
      }

      console.log('🗑️ Excluindo usuário da Loja 2 do banco:', id);

      const { error } = await supabase
        .from('store2_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Usuário da Loja 2 excluído do banco');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      throw error;
    }
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    saveUser,
    createUser,
    deleteUser,
    refetch: loadUsers
  };
};