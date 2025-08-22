import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore2PDVCashRegister } from './useStore2PDVCashRegister';

interface Table {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza';
  current_sale_id: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TableSale {
  id: string;
  table_id: string;
  sale_number: number;
  operator_name: string | null;
  customer_name: string | null;
  customer_count: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_type: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto' | null;
  change_amount: number;
  status: 'aberta' | 'fechada' | 'cancelada';
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TableSaleItem {
  id: string;
  sale_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  weight_kg: number | null;
  unit_price: number | null;
  price_per_gram: number | null;
  discount_amount: number;
  subtotal: number;
  notes: string | null;
  created_at: string;
  weight?: number | null;
}

export const useTableSales = (storeId: string = 'store1') => {
  const [tables, setTables] = useState<Table[]>([]);
  const [sales, setSales] = useState<TableSale[]>([]);
  const [saleItems, setSaleItems] = useState<TableSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentRegister } = useStore2PDVCashRegister();

  // Determine table names based on store
  const getTableName = (suffix: string) => {
    return storeId === 'store2' ? `store2_${suffix}` : `store1_${suffix}`;
  };

  // Fetch tables
  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from(getTableName('tables'))
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao buscar mesas:', err);
      setError('Erro ao carregar mesas');
    }
  };

  // Fetch sales
  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from(getTableName('table_sales'))
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Erro ao buscar vendas:', err);
      setError('Erro ao carregar vendas');
    }
  };

  // Fetch sale items
  const fetchSaleItems = async () => {
    try {
      const { data, error } = await supabase
        .from(getTableName('table_sale_items'))
        .select('*')
        .order('created_at');

      if (error) throw error;
      setSaleItems(data || []);
    } catch (err) {
      console.error('Erro ao buscar itens das vendas:', err);
      setError('Erro ao carregar itens das vendas');
    }
  };

  // Create new sale for table
  const createSale = async (tableId: string, operatorName: string, customerName?: string, customerCount?: number) => {
    try {
      const { data, error } = await supabase
        .from(getTableName('table_sales'))
        .insert({
          table_id: tableId,
          operator_name: operatorName,
          customer_name: customerName || null,
          customer_count: customerCount || 1,
          status: 'aberta'
        })
        .select()
        .single();

      if (error) throw error;

      // Update table status to occupied
      await supabase
        .from(getTableName('tables'))
        .update({ 
          status: 'ocupada',
          current_sale_id: data.id
        })
        .eq('id', tableId);

      await fetchTables();
      await fetchSales();
      return data;
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      throw new Error('Erro ao criar venda');
    }
  };

  // Add item to sale
  const addItemToSale = async (saleId: string, item: Omit<TableSaleItem, 'id' | 'sale_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from(getTableName('table_sale_items'))
        .insert({
          sale_id: saleId,
          ...item
        })
        .select()
        .single();

      if (error) throw error;

      // Update sale totals
      await updateSaleTotals(saleId);
      await fetchSaleItems();
      await fetchSales();
      return data;
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      throw new Error('Erro ao adicionar item');
    }
  };

  // Update sale totals
  const updateSaleTotals = async (saleId: string) => {
    try {
      const { data: items, error } = await supabase
        .from(getTableName('table_sale_items'))
        .select('subtotal')
        .eq('sale_id', saleId);

      if (error) throw error;

      const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

      await supabase
        .from(getTableName('table_sales'))
        .update({
          subtotal,
          total_amount: subtotal // Assuming no additional fees for table sales
        })
        .eq('id', saleId);

    } catch (err) {
      console.error('Erro ao atualizar totais:', err);
    }
  };

  // Close sale
  const closeSale = async (saleId: string, paymentType: TableSale['payment_type'], changeAmount?: number) => {
    try {
      const { error } = await supabase
        .from(getTableName('table_sales'))
        .update({
          status: 'fechada',
          payment_type: paymentType,
          change_amount: changeAmount || 0,
          closed_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (error) throw error;

      // Update table status
      const sale = sales.find(s => s.id === saleId);
      if (sale) {
        await supabase
          .from(getTableName('tables'))
          .update({ 
            status: 'aguardando_conta',
            current_sale_id: null
          })
          .eq('id', sale.table_id);
      }

      await fetchTables();
      await fetchSales();
    } catch (err) {
      console.error('Erro ao fechar venda:', err);
      throw new Error('Erro ao fechar venda');
    }
  };

  // Cancel sale
  const cancelSale = async (saleId: string) => {
    try {
      const { error } = await supabase
        .from(getTableName('table_sales'))
        .update({
          status: 'cancelada',
          closed_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (error) throw error;

      // Update table status
      const sale = sales.find(s => s.id === saleId);
      if (sale) {
        await supabase
          .from(getTableName('tables'))
          .update({ 
            status: 'livre',
            current_sale_id: null
          })
          .eq('id', sale.table_id);
      }

      await fetchTables();
      await fetchSales();
    } catch (err) {
      console.error('Erro ao cancelar venda:', err);
      throw new Error('Erro ao cancelar venda');
    }
  };

  // Update table status
  const updateTableStatus = async (tableId: string, status: Table['status']) => {
    try {
      const { error } = await supabase
        .from(getTableName('tables'))
        .update({ status })
        .eq('id', tableId);

      if (error) throw error;
      await fetchTables();
    } catch (err) {
      console.error('Erro ao atualizar status da mesa:', err);
      throw new Error('Erro ao atualizar status da mesa');
    }
  };

  // Get sale items for a specific sale
  const getSaleItems = (saleId: string) => {
    return saleItems.filter(item => item.sale_id === saleId);
  };

  // Get active sale for table
  const getActiveSale = (tableId: string) => {
    return sales.find(sale => sale.table_id === tableId && sale.status === 'aberta');
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTables(),
          fetchSales(),
          fetchSaleItems()
        ]);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId]);

  // Set up real-time subscriptions
  useEffect(() => {
    const tablesSubscription = supabase
      .channel(`${getTableName('tables')}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: getTableName('tables') },
        () => fetchTables()
      )
      .subscribe();

    const salesSubscription = supabase
      .channel(`${getTableName('table_sales')}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: getTableName('table_sales') },
        () => fetchSales()
      )
      .subscribe();

    const itemsSubscription = supabase
      .channel(`${getTableName('table_sale_items')}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: getTableName('table_sale_items') },
        () => fetchSaleItems()
      )
      .subscribe();

    return () => {
      tablesSubscription.unsubscribe();
      salesSubscription.unsubscribe();
      itemsSubscription.unsubscribe();
    };
  }, [storeId]);

  return {
    tables,
    sales,
    saleItems,
    loading,
    error,
    currentRegister,
    createSale,
    addItemToSale,
    closeSale,
    cancelSale,
    updateTableStatus,
    getSaleItems,
    getActiveSale,
    refreshData: async () => {
      await Promise.all([
        fetchTables(),
        fetchSales(),
        fetchSaleItems()
      ]);
    }
  };
};