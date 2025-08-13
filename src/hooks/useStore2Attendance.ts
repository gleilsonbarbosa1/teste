import { useState, useEffect } from 'react';
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