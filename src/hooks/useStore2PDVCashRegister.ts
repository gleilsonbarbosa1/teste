import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Store2CashRegister {
  id: string;
  opening_amount: number;
  closing_amount?: number;
  difference?: number;
  opened_at: string;
  closed_at?: string;
  operator_id?: string;
  store_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Store2CashEntry {
  id: string;
  register_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  payment_method: string;
  created_at: string;
}

export const useStore2PDVCashRegister = () => {
  const [currentRegister, setCurrentRegister] = useState<Store2CashRegister | null>(null);
  const [entries, setEntries] = useState<Store2CashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOpen = currentRegister && !currentRegister.closed_at;

  const fetchCurrentRegister = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('pdv2_cash_registers')
        .select('*')
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setCurrentRegister(data);
      
      if (data) {
        await fetchEntries(data.id);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error('Erro ao buscar caixa atual da Loja 2:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar caixa');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntries = useCallback(async (registerId: string) => {
    try {
      const { data, error } = await supabase
        .from('pdv2_cash_entries')
        .select('*')
        .eq('register_id', registerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
    } catch (err) {
      console.error('Erro ao buscar entradas do caixa da Loja 2:', err);
    }
  }, []);

  const openRegister = useCallback(async (openingAmount: number, operatorId?: string, storeId?: string) => {
    try {
      const { data, error } = await supabase
        .from('pdv2_cash_registers')
        .insert([{
          opening_amount: openingAmount,
          operator_id: operatorId,
          store_id: storeId
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchCurrentRegister();
      return data;
    } catch (err) {
      console.error('Erro ao abrir caixa da Loja 2:', err);
      throw err;
    }
  }, [fetchCurrentRegister]);

  const closeRegister = useCallback(async (closingAmount: number) => {
    if (!currentRegister) throw new Error('Nenhum caixa aberto');

    try {
      const difference = closingAmount - currentRegister.opening_amount;

      const { error } = await supabase
        .from('pdv2_cash_registers')
        .update({
          closing_amount: closingAmount,
          difference: difference,
          closed_at: new Date().toISOString()
        })
        .eq('id', currentRegister.id);

      if (error) throw error;

      await fetchCurrentRegister();
    } catch (err) {
      console.error('Erro ao fechar caixa da Loja 2:', err);
      throw err;
    }
  }, [currentRegister, fetchCurrentRegister]);

  const addEntry = useCallback(async (
    type: 'income' | 'expense',
    amount: number,
    description: string,
    paymentMethod: string = 'dinheiro'
  ) => {
    if (!currentRegister) throw new Error('Nenhum caixa aberto');

    try {
      const { error } = await supabase
        .from('pdv2_cash_entries')
        .insert([{
          register_id: currentRegister.id,
          type,
          amount,
          description,
          payment_method: paymentMethod
        }]);

      if (error) throw error;

      await fetchEntries(currentRegister.id);
    } catch (err) {
      console.error('Erro ao adicionar entrada no caixa da Loja 2:', err);
      throw err;
    }
  }, [currentRegister, fetchEntries]);

  const refreshData = useCallback(async () => {
    await fetchCurrentRegister();
  }, [fetchCurrentRegister]);

  useEffect(() => {
    fetchCurrentRegister();
  }, [fetchCurrentRegister]);

  // Calcular totais
  const totalIncome = entries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const totalExpenses = entries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const currentBalance = currentRegister 
    ? Number(currentRegister.opening_amount) + totalIncome - totalExpenses
    : 0;

  return {
    currentRegister,
    entries,
    loading,
    error,
    isOpen,
    totalIncome,
    totalExpenses,
    currentBalance,
    openRegister,
    closeRegister,
    addEntry,
    refreshData,
    refetch: fetchCurrentRegister
  };
};