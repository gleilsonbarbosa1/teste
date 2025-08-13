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
          can_create_manual_orders: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      console.log('🔐 Tentando login de atendimento:', { username });

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando credenciais hardcoded');
        return handleHardcodedLogin(username, password);
      }

      // Try database authentication first
      try {
        const { data: user, error: fetchError } = await supabase
          .from('attendance_users')
          .select('*')
          .eq('username', username)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Erro ao buscar usuário:', fetchError);
          throw fetchError;
        }

        if (user) {
          console.log('👤 Usuário encontrado no banco:', user.username);
          
          // Verify password using database function
          const { data: authData, error: authError } = await supabase.rpc(
            'verify_attendance_user_password',
            {
              user_username: username,
              password_to_check: password
            }
          );

          if (authError) {
            console.warn('Erro na verificação de senha do banco:', authError);
            // Fallback to hardcoded credentials
            return handleHardcodedLogin(username, password);
          }

          if (authData) {
            console.log('✅ Senha verificada com sucesso no banco');
            
            // Update last login
            await supabase
              .from('attendance_users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', user.id);

            const attendanceSession: AttendanceSession = {
              isAuthenticated: true,
              user
            };

            setSession(attendanceSession);
            localStorage.setItem('attendance_session', JSON.stringify(attendanceSession));
            return true;
          } else {
            console.log('❌ Senha incorreta no banco, tentando credenciais hardcoded');
            // Fallback to hardcoded credentials
            return handleHardcodedLogin(username, password);
          }
        } else {
          console.log('👤 Usuário não encontrado no banco, tentando credenciais hardcoded');
          // Fallback to hardcoded credentials
          return handleHardcodedLogin(username, password);
        }
      } catch (dbError) {
        console.warn('Erro na autenticação do banco, usando fallback:', dbError);
        return handleHardcodedLogin(username, password);
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      setError(error instanceof Error ? error.message : 'Erro no login');
      return false;
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
          can_create_manual_orders: true
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