import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RestaurantTable, TableSale, TableSaleItem } from '../types/table-sales';

interface TableStats {
  total: number;
  free: number;
  occupied: number;
  waitingBill: number;
  cleaning: number;
}

export const useTableSales = (storeId: 1 | 2) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TableStats>({
    total: 0,
    free: 0,
    occupied: 0,
    waitingBill: 0,
    cleaning: 0
  });

  const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const salesTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const saleItemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: tablesData, error: tablesError } = await supabase
        .from(tableName)
        .select(`
          *,
          current_sale:${salesTableName}(*)
        `)
        .eq('is_active', true)
        .order('number');

      if (tablesError) throw tablesError;

      console.log(`Loaded ${tablesData?.length || 0} tables for store ${storeId}`);
      setTables(tablesData || []);

      // Calculate stats
      const tableStats = (tablesData || []).reduce((acc, table) => {
        acc.total++;
        switch (table.status) {
          case 'livre': acc.free++; break;
          case 'ocupada': acc.occupied++; break;
          case 'aguardando_conta': acc.waitingBill++; break;
          case 'limpeza': acc.cleaning++; break;
        }
        return acc;
      }, { total: 0, free: 0, occupied: 0, waitingBill: 0, cleaning: 0 });

      setStats(tableStats);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  const createTableSale = async (tableId: string, customerName: string, customerCount: number) => {
    try {
      const { data, error } = await supabase
        .from(salesTableName)
        .insert({
          table_id: tableId,
          customer_name: customerName || null,
          customer_count: customerCount,
          operator_name: 'Sistema',
          status: 'aberta'
        })
        .select()
        .single();

      if (error) throw error;

      // Update table status and link to sale
      await supabase
        .from(tableName)
        .update({
          status: 'ocupada',
          current_sale_id: data.id
        })
        .eq('id', tableId);

      await fetchTables();
      return data;
    } catch (err) {
      console.error('Error creating table sale:', err);
      throw err;
    }
  };

  const closeSale = async (saleId: string, paymentType: string, changeAmount: number = 0) => {
    try {
      // Close the sale
      const { error: saleError } = await supabase
        .from(salesTableName)
        .update({
          status: 'fechada',
          payment_type: paymentType,
          change_amount: changeAmount,
          closed_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (saleError) throw saleError;

      // Update table status
      const { error: tableError } = await supabase
        .from(tableName)
        .update({
          status: 'limpeza',
          current_sale_id: null
        })
        .eq('current_sale_id', saleId);

      if (tableError) throw tableError;

      await fetchTables();
    } catch (err) {
      console.error('Error closing sale:', err);
      throw err;
    }
  };

  const getSaleDetails = async (saleId: string): Promise<TableSale | null> => {
    try {
      const { data: saleData, error: saleError } = await supabase
        .from(salesTableName)
        .select('*')
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      const { data: itemsData, error: itemsError } = await supabase
        .from(saleItemsTableName)
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at');

      if (itemsError) throw itemsError;

      return {
        ...saleData,
        items: itemsData || []
      };
    } catch (err) {
      console.error('Error fetching sale details:', err);
      return null;
    }
  };

  const updateTableStatus = async (tableId: string, status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza') => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ status })
        .eq('id', tableId);

      if (error) throw error;
      await fetchTables();
    } catch (err) {
      console.error('Error updating table status:', err);
      throw err;
    }
  };

  const addItemToSale = async (saleId: string, item: Omit<TableSaleItem, 'id' | 'sale_id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from(saleItemsTableName)
        .insert({
          sale_id: saleId,
          ...item
        });

      if (error) throw error;

      // Update sale totals
      await updateSaleTotals(saleId);
      await fetchTables();
    } catch (err) {
      console.error('Error adding item to sale:', err);
      throw err;
    }
  };

  const removeItemFromSale = async (itemId: string) => {
    try {
      if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
        throw new Error('ID do item inválido');
      }

      const { error } = await supabase
        .from(saleItemsTableName)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Get sale_id to update totals
      const { data: itemData } = await supabase
        .from(saleItemsTableName)
        .select('sale_id')
        .eq('id', itemId)
        .single();

      if (itemData?.sale_id) {
        await updateSaleTotals(itemData.sale_id);
      }

      await fetchTables();
    } catch (err) {
      console.error('Error removing item from sale:', err);
      throw err;
    }
  };

  const clearSaleItems = async (saleId: string) => {
    try {
      const { error } = await supabase
        .from(saleItemsTableName)
        .delete()
        .eq('sale_id', saleId);

      if (error) throw error;

      // Update sale totals
      await updateSaleTotals(saleId);
      await fetchTables();
    } catch (err) {
      console.error('Error clearing sale items:', err);
      throw err;
    }
  };

  const updateSaleTotals = async (saleId: string) => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from(saleItemsTableName)
        .select('subtotal')
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      const subtotal = items?.reduce((sum, item) => sum + Number(item.subtotal), 0) || 0;

      const { error: updateError } = await supabase
        .from(salesTableName)
        .update({
          subtotal: subtotal,
          total_amount: subtotal
        })
        .eq('id', saleId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating sale totals:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTables();
  }, [storeId]);

  return {
    tables,
    loading,
    error,
    stats,
    createTableSale,
    closeSale,
    getSaleDetails,
    updateTableStatus,
    addItemToSale,
    removeItemFromSale,
    clearSaleItems,
    refetch: fetchTables
  };
};