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

  // Always call all hooks at the top level
  useEffect(() => {
    // Check for existing session on mount
    const checkExistingSession = () => {
      try {
        const storedSession = localStorage.getItem('attendance_session');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession.isAuthenticated && parsedSession.user) {
            setSession(parsedSession);
          }
        }
      } catch (error) {
        console.error('Error loading stored session:', error);
        localStorage.removeItem('attendance_session');
      }
    };

    checkExistingSession();
  }, []);

  useEffect(() => {
    // Load users from database or fallback to hardcoded
    const loadUsers = async () => {
      try {
        setLoading(true);
        
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || 
            supabaseUrl === 'your_supabase_url_here' || 
            supabaseKey === 'your_supabase_anon_key_here' ||
            supabaseUrl.includes('placeholder')) {
          console.warn('⚠️ Supabase não configurado - usando usuários hardcoded');
          setUsers(getHardcodedUsers());
          return;
        }

        const { data, error } = await supabase
          .from('attendance_users')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.warn('Erro ao carregar usuários do banco:', error);
          setUsers(getHardcodedUsers());
        } else {
          console.log(`✅ ${data?.length || 0} usuários carregados do banco`);
          setUsers(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        setUsers(getHardcodedUsers());
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const getHardcodedUsers = (): AttendanceUser[] => {
    return [
      {
        id: '1',
        username: 'admin',
        password_hash: 'elite2024',
        name: 'Administrador',
        role: 'admin',
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
        updated_at: new Date().toISOString()
      }
    ];
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Check if Supabase is properly configured
      const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const envSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const supabaseConfigured = envSupabaseUrl && envSupabaseKey && 
                                envSupabaseUrl !== 'your_supabase_url_here' && 
                                envSupabaseKey !== 'your_supabase_anon_key_here' &&
                                !envSupabaseUrl.includes('placeholder');

      // Check if Supabase is properly configured
      const isSupabaseConfigured = envSupabaseUrl && envSupabaseKey &&
                                   envSupabaseUrl !== 'your_supabase_url_here' &&
                                   envSupabaseKey !== 'your_supabase_anon_key_here' &&
                                   !envSupabaseUrl.includes('placeholder');

      console.log('🔐 Tentando fazer login:', { username, password: password ? '***' : 'vazio' });
      
      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando credenciais hardcoded');
        return checkHardcodedCredentials(username, password);
      }

      // First, try to get the user from database
      console.log('🔍 Buscando usuário no banco de dados:', username);
      const { data: user, error: fetchError } = await supabase
        .from('attendance_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar usuário:', fetchError);
        throw new Error('Erro ao buscar usuário no banco de dados');
      }

      if (user) {
        console.log('✅ Usuário encontrado no banco:', user.username);
        
        // Try to verify password using database function
        try {
          // For users created in the admin panel, check if password matches directly
          // Since the database stores plain text passwords for attendance users
          if (user.password_hash === password) {
            console.log('✅ Senha correta para usuário do banco');
            
            // Update last login
            await supabase
              .from('attendance_users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', user.id);

            setSession({
              isAuthenticated: true,
              user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                permissions: user.permissions
              }
            });
            return true;
          } else {
            console.log('❌ Senha incorreta para usuário do banco');
            // Try hardcoded credentials as fallback
            if (checkHardcodedCredentials(username, password)) {
              console.log('✅ Login bem-sucedido com credenciais hardcoded');
              setSession({
                isAuthenticated: true,
                user: {
                  id: user.id,
                  username: user.username,
                  name: user.name,
                  role: user.role,
                  permissions: user.permissions
                }
              });
              return true;
            }
            throw new Error('Invalid password');
          }
        } catch (verifyError) {
          console.warn('⚠️ Erro na verificação de senha:', verifyError);
          
          // Try hardcoded credentials as fallback
          if (checkHardcodedCredentials(username, password)) {
            console.log('✅ Login bem-sucedido com credenciais hardcoded');
            setSession({
              isAuthenticated: true,
              user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                permissions: user.permissions
              }
            });
            return true;
          }
          
          throw new Error('Invalid password');
        }
      } else {
        console.log('ℹ️ Usuário não encontrado no banco, tentando credenciais hardcoded');
        
        // User not found in database, try hardcoded credentials
        if (checkHardcodedCredentials(username, password)) {
          console.log('✅ Login bem-sucedido com credenciais hardcoded');
          setSession({
            isAuthenticated: true,
            user: {
              id: '1',
              username: username,
              name: 'Administrador',
              role: 'admin',
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
            }
          });
          return true;
        }
        
        throw new Error('User not found or inactive');
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      throw error;
    }
  };

  const handleHardcodedLogin = (username: string, password: string): boolean => {
    console.log('🔐 Verificando credenciais hardcoded');
    
    // Hardcoded credentials for demo/fallback
    const HARDCODED_CREDENTIALS = {
      username: 'admin',
      password: 'elite2024'
    };

    if (username === HARDCODED_CREDENTIALS.username && password === HARDCODED_CREDENTIALS.password) {
      console.log('✅ Login hardcoded bem-sucedido');
      
      const hardcodedUser: AttendanceUser = {
        id: 'hardcoded-admin',
        username: 'admin',
        password_hash: 'elite2024',
        name: 'Administrador',
        role: 'admin',
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
        updated_at: new Date().toISOString()
      };

      const attendanceSession: AttendanceSession = {
        isAuthenticated: true,
        user: hardcodedUser
      };

      setSession(attendanceSession);
      localStorage.setItem('attendance_session', JSON.stringify(attendanceSession));
      return true;
    } else {
      console.log('❌ Credenciais hardcoded inválidas');
      setError('Invalid password');
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 Logout de atendimento');
    setSession({ isAuthenticated: false });
    localStorage.removeItem('attendance_session');
    setError(null);
  };

  const createUser = async (userData: Omit<AttendanceUser, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('attendance_users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<AttendanceUser>) => {
    try {
      const { data, error } = await supabase
        .from('attendance_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => prev.map(user => user.id === id ? data : user));
      return data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendance_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_users')
        .select('*')
        .order('name');

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    users,
    loading,
    error,
    login,
    logout,
    createUser,
    updateUser,
    deleteUser,
    fetchUsers
  };
};