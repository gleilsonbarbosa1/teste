import { useState, useEffect, useCallback } from 'react';

export interface Store2User {
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
    can_view_expected_balance: boolean;
  };
  created_at: string;
  last_login?: string;
}

export const useStore2Users = () => {
  const [users, setUsers] = useState<Store2User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(() => {
    try {
      const savedUsers = localStorage.getItem('store2_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        const usersWithPermissions = parsedUsers.map(user => ({
          ...user,
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
        // Initialize with default admin user
        const defaultUsers: Store2User[] = [
          {
            id: '1',
            username: 'loja2',
            password: 'elite2024',
            name: 'Administrador Loja 2',
            role: 'admin',
            isActive: true,
            permissions: {
              can_view_orders: false,
              can_update_status: false,
              can_chat: false,
              can_create_manual_orders: false,
              can_print_orders: true,
              can_view_expected_balance: true
            },
            created_at: new Date().toISOString()
          }
        ];
        setUsers(defaultUsers);
        localStorage.setItem('store2_users', JSON.stringify(defaultUsers));
      }
    } catch (error) {
      console.error('Erro ao carregar usuários da Loja 2:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUser = useCallback((user: Store2User) => {
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    setUsers(updatedUsers);
    localStorage.setItem('store2_users', JSON.stringify(updatedUsers));
  }, [users]);

  const createUser = useCallback((user: Omit<Store2User, 'id' | 'created_at'>) => {
    const newUser: Store2User = {
      ...user,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('store2_users', JSON.stringify(updatedUsers));
    return newUser;
  }, [users]);

  const deleteUser = useCallback((id: string) => {
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('store2_users', JSON.stringify(updatedUsers));
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    saveUser,
    createUser,
    deleteUser,
    refetch: loadUsers
  };
};