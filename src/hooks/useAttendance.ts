import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AttendanceUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'attendant' | 'admin';
  is_active: boolean;
  permissions: {
    can_chat: boolean;
    can_view_orders: boolean;
    can_print_orders: boolean;
    can_update_status: boolean;
    can_create_manual_orders: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AttendanceSession {
  isAuthenticated: boolean;
  user?: AttendanceUser;
}

export const useAttendance = () => {
  const [session, setSession] = useState<AttendanceSession>({ isAuthenticated: false });
  const [users, setUsers] = useState<AttendanceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Define admin user credentials
  const adminUser = {
    username: 'admin',
    password: 'elite2024'
  };

  // Check if Supabase is configured
  const isSupabaseConfigured = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return supabaseUrl && supabaseKey && 
           supabaseUrl !== 'your_supabase_url_here' && 
           supabaseKey !== 'your_supabase_anon_key_here' &&
           !supabaseUrl.includes('placeholder');
  };

  // Initialize session from localStorage
  useEffect(() => {
    const storedSession = localStorage.getItem('attendance_session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        setSession(parsedSession);
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('attendance_session');
      }
    }
  }, []);

  // Fetch all attendance users from Supabase
  const fetchUsers = async (): Promise<AttendanceUser[]> => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - using localStorage fallback');
      return getLocalStorageUsers();
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching attendance users from Supabase...');

      const { data, error } = await supabase
        .from('attendance_users')
        .select('*')
        .order('name');

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} attendance users loaded from Supabase`);
      
      const formattedUsers = (data || []).map(user => ({
        ...user,
        permissions: user.permissions || {
          can_chat: true,
          can_view_orders: true,
          can_print_orders: true,
          can_update_status: true,
          can_create_manual_orders: false
        }
      }));

      setUsers(formattedUsers);
      return formattedUsers;
    } catch (err) {
      console.error('❌ Error fetching attendance users:', err);
      setError(err instanceof Error ? err.message : 'Error fetching users');
      
      // Fallback to localStorage
      return getLocalStorageUsers();
    } finally {
      setLoading(false);
    }
  };

  // Create new attendance user in Supabase
  const createUser = async (userData: Omit<AttendanceUser, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceUser> => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - using localStorage fallback');
      return createLocalStorageUser(userData);
    }

    try {
      console.log('🚀 Creating attendance user in Supabase:', userData.username);

      const { data, error } = await supabase
        .from('attendance_users')
        .insert([{
          username: userData.username,
          password_hash: userData.password_hash, // Will be hashed by trigger
          name: userData.name,
          role: userData.role,
          is_active: userData.is_active,
          permissions: userData.permissions
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Attendance user created in Supabase:', data);
      
      // Refresh users list
      await fetchUsers();
      
      return data;
    } catch (err) {
      console.error('❌ Error creating attendance user:', err);
      throw new Error(err instanceof Error ? err.message : 'Error creating user');
    }
  };

  // Update attendance user in Supabase
  const updateUser = async (id: string, updates: Partial<AttendanceUser>): Promise<AttendanceUser> => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - using localStorage fallback');
      return updateLocalStorageUser(id, updates);
    }

    try {
      console.log('✏️ Updating attendance user in Supabase:', id);

      // Prepare update data
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_at;

      const { data, error } = await supabase
        .from('attendance_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Attendance user updated in Supabase:', data);
      
      // Refresh users list
      await fetchUsers();
      
      return data;
    } catch (err) {
      console.error('❌ Error updating attendance user:', err);
      throw new Error(err instanceof Error ? err.message : 'Error updating user');
    }
  };

  // Delete attendance user from Supabase
  const deleteUser = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - using localStorage fallback');
      return deleteLocalStorageUser(id);
    }

    try {
      console.log('🗑️ Deleting attendance user from Supabase:', id);

      const { error } = await supabase
        .from('attendance_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Attendance user deleted from Supabase');
      
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      console.error('❌ Error deleting attendance user:', err);
      throw new Error(err instanceof Error ? err.message : 'Error deleting user');
    }
  };

  // Login function with Supabase authentication
  const login = async (username: string, password: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - using localStorage fallback');
      return loginWithLocalStorage(username, password);
    }

    try {
      console.log('🔐 Attempting login for attendance user:', username);

      // Always try hardcoded credentials first for demo purposes
      if (username === 'admin' && password === 'elite2024') {
        console.log('✅ Login com credenciais hardcoded bem-sucedido');
        const adminUser = {
          id: '1',
          username: 'admin',
          name: 'Administrador',
          role: 'admin',
          password_hash: 'elite2024',
          name: 'Administrador',
          role: 'admin' as const,
          is_active: true,
          permissions: {
            can_chat: true,
            can_view_orders: true,
            can_create_manual_orders: true,
            can_view_sales: true,
            can_view_cash_register: true,
            can_view_products: true,
            can_view_reports: true,
            can_view_sales_report: true,
            can_view_cash_report: true,
            can_view_operators: true,
            can_view_attendance: true,
            can_manage_settings: true,
            can_use_scale: true,
            can_view_expected_balance: true,
            can_update_status: true,
            can_view_expected_balance: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setSession({
          isAuthenticated: true,
          user: adminUser
        });
        
        // Save to localStorage as backup
        localStorage.setItem('attendance_session', JSON.stringify({
          isAuthenticated: true,
          user: adminUser
        }));
        
        return true;
      }
      
      if (!supabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando autenticação local');
        return loginWithLocalStorage(username, password);
      }

      // First, get the user data
      const { data: userData, error: userError } = await supabase
        .from('attendance_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        console.log('ℹ️ Usuário não encontrado no banco, tentando criar admin padrão...');
        
        // Try to create default admin user if it doesn't exist
        if (username === 'admin') {
          try {
            const { data: newAdmin, error: createError } = await supabase
              .from('attendance_users')
              .insert([{
                username: 'admin',
                password_hash: 'elite2024', // Will be hashed by trigger
                name: 'Administrador',
                role: 'admin',
                is_active: true,
                permissions: {
                  can_chat: true,
                  can_view_orders: true,
                  can_print_orders: true,
                  can_update_status: true,
                  can_create_manual_orders: true
                }
              }])
              .select()
              .single();
              
            if (createError) {
              console.error('❌ Erro ao criar usuário admin:', createError);
              throw new Error('Erro ao criar usuário administrador');
            }
            
            if (newAdmin && password === 'elite2024') {
              console.log('✅ Usuário admin criado e login bem-sucedido');
              setSession({
                isAuthenticated: true,
                user: newAdmin
              });
              
              localStorage.setItem('attendance_session', JSON.stringify({
                isAuthenticated: true,
                user: newAdmin
              }));
              
              return true;
            }
          } catch (createErr) {
            console.error('❌ Erro na criação do admin:', createErr);
            // Fallback to localStorage
            return loginWithLocalStorage(username, password);
          }
        }
        
        console.error('❌ Usuário não encontrado:', fetchError);
        throw new Error('Usuário não encontrado ou inativo');
      }

      // Verify password using RPC function
      const { data: isValidPassword, error: authError } = await supabase.rpc(
        'verify_attendance_user_password',
        {
          user_username: username,
          password_to_check: password
        }
      );

      if (authError || !isValidPassword) {
        console.warn('⚠️ Erro na verificação de senha via RPC, tentando fallback:', authError);
        
        // Fallback: check if it's the admin with hardcoded password
        if (username === 'admin' && password === 'elite2024') {
          console.log('✅ Login admin via fallback bem-sucedido');
          setSession({
            isAuthenticated: true,
            user
          });
          
          localStorage.setItem('attendance_session', JSON.stringify({
            isAuthenticated: true,
            user
          }));
          
          return true;
        }
        
        console.error('❌ Senha incorreta');
        throw new Error('Senha incorreta');
      }

      // Update last login
      await supabase
        .from('attendance_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      // Create session
      const userSession: AttendanceSession = {
        isAuthenticated: true,
        user: {
          ...userData,
          permissions: userData.permissions || {
            can_chat: true,
            can_view_orders: true,
            can_print_orders: true,
            can_update_status: true,
            can_create_manual_orders: false
          }
        }
      };

      setSession(userSession);
      localStorage.setItem('attendance_session', JSON.stringify(userSession));

      console.log('✅ Login successful for attendance user:', username);
      return true;
    } catch (err) {
      console.error('❌ Error during login:', err);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setSession({ isAuthenticated: false });
    localStorage.removeItem('attendance_session');
    console.log('🚪 Attendance user logged out');
  };

  // LocalStorage fallback functions
  const getLocalStorageUsers = (): AttendanceUser[] => {
    try {
      const savedUsers = localStorage.getItem('attendance_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        return parsedUsers.map((user: any) => ({
          ...user,
          permissions: user.permissions || {
            can_chat: true,
            can_view_orders: true,
            can_print_orders: true,
            can_update_status: true,
            can_create_manual_orders: false
          }
        }));
      }
    } catch (error) {
      console.error('Error loading users from localStorage:', error);
    }

    // Return default admin user
    const defaultUsers: AttendanceUser[] = [
      {
        id: '1',
        username: 'admin',
        name: 'Administrador',
        role: 'admin',
        password_hash: 'elite2024',
        is_active: true,
        permissions: {
          can_chat: true,
          can_view_orders: true,
          can_print_orders: true,
          can_update_status: true,
          can_create_manual_orders: true,
          can_view_cash_register: true,
          can_view_sales: true,
          can_view_reports: true,
          can_manage_products: true,
          can_view_operators: true,
          can_manage_settings: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    localStorage.setItem('attendance_users', JSON.stringify(defaultUsers));
    setUsers(defaultUsers);
    return defaultUsers;
  };

      // Save session to localStorage for PermissionGuard
      localStorage.setItem('attendance_session', JSON.stringify({
        isAuthenticated: true,
        user: adminUser
      }));
      
  const createLocalStorageUser = (userData: Omit<AttendanceUser, 'id' | 'created_at' | 'updated_at'>): AttendanceUser => {
    const newUser: AttendanceUser = {
      ...userData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const currentUsers = getLocalStorageUsers();
    const updatedUsers = [...currentUsers, newUser];
    localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    
    return newUser;
  };

  const updateLocalStorageUser = (id: string, updates: Partial<AttendanceUser>): AttendanceUser => {
    const currentUsers = getLocalStorageUsers();
    const updatedUsers = currentUsers.map(user => 
      user.id === id ? { ...user, ...updates, updated_at: new Date().toISOString() } : user
    );
    
    localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    
    const updatedUser = updatedUsers.find(u => u.id === id);
    if (!updatedUser) throw new Error('User not found after update');
    
    return updatedUser;
  };

  const deleteLocalStorageUser = (id: string): void => {
    const currentUsers = getLocalStorageUsers();
    const updatedUsers = currentUsers.filter(user => user.id !== id);
    localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const loginWithLocalStorage = (username: string, password: string): boolean => {
    const currentUsers = getLocalStorageUsers();
    const user = currentUsers.find(u => u.username === username && u.is_active);
    
    if (!user || user.password_hash !== password) {
      return false;
    }

    const userSession: AttendanceSession = {
      isAuthenticated: true,
      user
    };

    setSession(userSession);
    localStorage.setItem('attendance_session', JSON.stringify(userSession));
    
    return true;
  };

  // Initialize users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    session,
    users,
    loading,
    error,
    login,
    logout,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
};