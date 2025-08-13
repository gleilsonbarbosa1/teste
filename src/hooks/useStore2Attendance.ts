import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

import React from 'react';
import { supabase } from '../lib/supabase';

interface Store2User {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: string;
  is_active: boolean;
  permissions: {
    can_view_cash: boolean;
    can_view_sales: boolean;
    can_view_reports: boolean;
    can_view_products: boolean;
    can_manage_settings: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

interface Store2Session {
  isAuthenticated: boolean;
  user: Store2User | null;
}

export const useStore2Attendance = () => {
  // Check Supabase configuration
  const supabaseConfigured = React.useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return supabaseUrl && supabaseKey && 
           supabaseUrl !== 'your_supabase_url_here' && 
           supabaseKey !== 'your_supabase_anon_key_here' &&
           !supabaseUrl.includes('placeholder');
  }, []);

  const [session, setSession] = useState<Store2Session>({
    isAuthenticated: false,
    user: null
  });
  const [loading, setLoading] = useState(true);

  // Create default admin user if none exists
  const createDefaultAdminUser = async () => {
    try {
      const { data: existingAdmin } = await supabase
        .from('store2_users')
        .select('*')
        .eq('username', 'admin')
        .single();

      if (!existingAdmin) {
        const { error } = await supabase
          .from('store2_users')
          .insert({
            username: 'admin',
            password_hash: 'elite2024', // Will be hashed by trigger
            name: 'Administrador',
            role: 'admin',
            is_active: true,
            permissions: {
              can_view_cash: true,
              can_view_sales: true,
              can_view_reports: true,
              can_view_products: true,
              can_manage_settings: true
            }
          });

        if (error) {
          console.error('Error creating default admin user:', error);
        }
      }
    } catch (error) {
      console.error('Error checking/creating admin user:', error);
    }
  };

  // Initialize and create default admin if needed
  useEffect(() => {
    const initializeStore2 = async () => {
      try {
        await createDefaultAdminUser();
        
        // Check for existing session in localStorage
        const savedSession = localStorage.getItem('store2_attendance_session');
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          setSession(parsedSession);
        }
      } catch (error) {
        console.error('Error initializing Store2 attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeStore2();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Tentando login na Loja 2 com:', { username, password: password ? '***' : 'vazio' });

      if (!supabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando credenciais hardcoded para Loja 2');
        // Fallback para credenciais hardcoded se Supabase não configurado
        const hardcodedUser = users.find(u => u.username === username && u.password === password && u.isActive);
        
        if (hardcodedUser) {
          console.log('✅ Login bem-sucedido com credenciais hardcoded da Loja 2:', hardcodedUser.username);
          const sessionData = {
            isAuthenticated: true,
            user: hardcodedUser
          };
          setSession(sessionData);
          localStorage.setItem('store2_attendance_session', JSON.stringify(sessionData));
          return true;
        } else {
          console.log('❌ Credenciais hardcoded inválidas para Loja 2');
          throw new Error('Credenciais inválidas');
        }
      }

      // Tentar buscar usuário no banco de dados primeiro
      console.log('🔍 Buscando usuário no banco de dados...');
      const { data: dbUser, error: fetchError } = await supabase
        .from('attendance_users')
        .select('*')
        .eq('username', username.trim())
        .eq('is_active', true)
        .single();

      if (dbUser && !fetchError) {
        console.log('👤 Usuário encontrado no banco:', dbUser.username);
        
        // Verificar senha usando função do banco de dados
        const { data: authData, error: authError } = await supabase.rpc(
          'verify_attendance_user_password',
          {
            user_username: username.trim(),
            password_to_check: password
          }
        );

        if (authData && !authError) {
          console.log('✅ Senha verificada com sucesso no banco');
          
          // Atualizar último login
          await supabase
            .from('attendance_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', dbUser.id);

          // Converter usuário do banco para formato esperado
          const sessionUser: Store2AttendanceUser = {
            id: dbUser.id,
            username: dbUser.username,
            password: '', // Não armazenar senha na sessão
            name: dbUser.name,
            role: dbUser.role || 'attendant',
            isActive: dbUser.is_active,
            permissions: dbUser.permissions || {
              can_view_orders: false, // Loja 2 não tem delivery
              can_update_status: false,
              can_chat: false,
              can_create_manual_orders: false,
              can_print_orders: true
            },
            created_at: dbUser.created_at,
            last_login: new Date().toISOString()
          };

          const sessionData = {
            isAuthenticated: true,
            user: sessionUser
          };
          
          setSession(sessionData);
          localStorage.setItem('store2_attendance_session', JSON.stringify(sessionData));
          return true;
        } else {
          console.log('❌ Senha incorreta no banco de dados');
          throw new Error('Senha incorreta');
        }
      } else {
        console.log('👤 Usuário não encontrado no banco, tentando credenciais hardcoded...');
        
        // Fallback para credenciais hardcoded se usuário não encontrado no banco
        const hardcodedUser = users.find(u => u.username === username && u.password === password && u.isActive);
        
        if (hardcodedUser) {
          console.log('✅ Login bem-sucedido com credenciais hardcoded da Loja 2:', hardcodedUser.username);
          const sessionData = {
            isAuthenticated: true,
            user: hardcodedUser
          };
          setSession(sessionData);
          localStorage.setItem('store2_attendance_session', JSON.stringify(sessionData));
          return true;
        } else {
          console.log('❌ Credenciais inválidas (banco e hardcoded)');
          throw new Error('Credenciais inválidas');
        }
      }
    } catch (error) {
      console.error('❌ Erro durante login da Loja 2:', error);
      throw error;
    }
  };

  const loginOld = (username: string, password: string): boolean => {
    try {
      setLoading(true);

      // First, try to get the user
      const { data: user, error: fetchError } = await supabase
        .from('store2_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (fetchError || !user) {
        console.error('User not found or inactive:', fetchError);
        return false;
      }

      // Verify password using RPC function
      const { data: isValid, error: rpcError } = await supabase
        .rpc('verify_store2_user_password', {
          p_username: username,
          p_password_to_check: password
        });

      if (rpcError) {
        console.error('Error verifying password:', rpcError);
        return false;
      }

      if (!isValid) {
        return false;
      }

      // Update last login
      await supabase
        .from('store2_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Create session
      const newSession: Store2Session = {
        isAuthenticated: true,
        user: user
      };

      setSession(newSession);
      localStorage.setItem('store2_attendance_session', JSON.stringify(newSession));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setSession({
      isAuthenticated: false,
      user: null
    });
    localStorage.removeItem('store2_attendance_session');
  };

  return {
    session,
    login,
    logout,
    loading
  };
};