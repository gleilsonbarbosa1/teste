```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RestaurantTable, TableSale, TableCartItem } from '../../types/table-sales';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Settings,
  Eye
} from 'lucide-react';
import TableSaleModal from './TableSaleModal';
import TableDetailsModal from './TableDetailsModal';
import AddItemModal from './AddItemModal';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showCreateSale, setShowCreateSale] = useState(false);
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabaseConfigured) {
        // Dados de demonstração se Supabase não estiver configurado
        const demoTables: RestaurantTable[] = [
          {
            id: '1',
            number: 1,
            name: 'Mesa 1',
            capacity: 4,
            status: 'livre',
            location: 'Área interna',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            number: 2,
            name: 'Mesa 2',
            capacity: 6,
            status: 'ocupada',
            location: 'Área externa',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            current_sale: {
              id: 'demo-sale-1',
              table_id: '2',
              sale_number: 1001,
              customer_name: 'João Silva',
              customer_count: 4,
              subtotal: 85.50,
              discount_amount: 0,
              total_amount: 85.50,
              status: 'aberta',
              change_amount: 0,
              opened_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: '3',
            number: 3,
            name: 'Mesa 3',
            capacity: 2,
            status: 'aguardando_conta',
            location: 'Área interna',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setTables(demoTables);
        setLoading(false);
        return;
      }

      const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          current_sale:${storeId === 1 ? 'store1_table_sales' : 'store2_table_sales'}(*)
        `)
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTableNumber || !newTableName) {
      alert('Número e nome da mesa são obrigatórios');
      return;
    }

    try {
      const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([{
          number: parseInt(newTableNumber),
          name: newTableName,
          capacity: newTableCapacity,
          status: 'livre',
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      setTables(prev => [...prev, data]);
      setShowAddTable(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
      alert('Erro ao criar mesa');
    }
  };

  const deleteTable = async (tableId: string, tableName: string) => {
    if (!confirm(\`Tem certeza que deseja excluir a ${tableName}?`)) {
      return;
    }

    try {
      const tableDbName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { error } = await supabase
        .from(tableDbName)
        .update({ is_active: false })
        .eq('id', tableId);

      if (error) throw error;
      
      setTables(prev => prev.filter(table => table.id !== tableId));
      
      // Mostrar feedback de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa excluída com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao excluir mesa:', err);
      alert('Erro ao excluir mesa');
    }
  };

  const createSale = async (customerName?: string, customerCount?: number) => {
    if (!selectedTable) return;

    try {
      const saleTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      
      const { data, error } = await supabase
        .from(saleTableName)
        .insert([{
          table_id: selectedTable.id,
          operator_name: operatorName || 'Operador',
          customer_name: customerName,
          customer_count: customerCount || 1,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          status: 'aberta',
          change_amount: 0,
          opened_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar status da mesa
      const tableDbName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      await supabase
        .from(tableDbName)
        .update({ 
          status: 'ocupada',
          current_sale_id: data.id
        })
        .eq('id', selectedTable.id);

      setShowCreateSale(false);
      setSelectedTable(null);
      await fetchTables();
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      alert('Erro ao criar venda');
    }
  };

  const updateTableStatus = async (tableId: string, status: RestaurantTable['status']) => {
    try {
      const tableDbName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { error } = await supabase
        .from(tableDbName)
        .update({ status })
        .eq('id', tableId);

      if (error) throw error;
      await fetchTables();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status da mesa');
    }
  };

  const closeSale = async (paymentType: TableSale['payment_type'], changeAmount?: number, discountAmount?: number) => {
    if (!selectedTable?.current_sale) return;

    try {
      const saleTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      
      const finalTotal = (selectedTable.current_sale.subtotal || 0) - (discountAmount || 0);
      
      const { error } = await supabase
        .from(saleTableName)
        .update({
          payment_type: paymentType,
          change_amount: changeAmount || 0,
          discount_amount: discountAmount || 0,
          total_amount: finalTotal,
          status: 'fechada',
          closed_at: new Date().toISOString()
        })
        .eq('id', selectedTable.current_sale.id);

      if (error) throw error;

      // Atualizar status da mesa
      const tableDbName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      await supabase
        .from(tableDbName)
        .update({ 
          status: 'livre',
          current_sale_id: null
        })
        .eq('id', selectedTable.id);

      setShowTableDetails(false);
      setSelectedTable(null);
      await fetchTables();
    } catch (err) {
      console.error('Erro ao fechar venda:', err);
      alert('Erro ao fechar venda');
    }
  };

  const addItemToSale = async (saleId: string, item: TableCartItem) => {
    try {
      const itemTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
      
      const { error } = await supabase
        .from(itemTableName)
        .insert([{
          sale_id: saleId,
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.quantity,
          weight_kg: item.weight,
          unit_price: item.unit_price,
          price_per_gram: item.price_per_gram,
          discount_amount: 0,
          subtotal: item.subtotal,
          notes: item.notes
        }]);

      if (error) throw error;

      // Atualizar subtotal da venda
      const saleTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      const currentSubtotal = selectedTable?.current_sale?.subtotal || 0;
      const newSubtotal = currentSubtotal + item.subtotal;

      await supabase
        .from(saleTableName)
        .update({ 
          subtotal: newSubtotal,
          total_amount: newSubtotal
        })
        .eq('id', saleId);

      await fetchTables();
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTables();
  }, [storeId]);

  const getStatusColor = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas da Loja {storeId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Modo Demonstração - Loja {storeId}</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Funcionalidades limitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" />
            Vendas de Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie as mesas e vendas presenciais</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTables}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button
            onClick={() => setShowAddTable(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Adicionar Mesa
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div
            key={table.id}
            className={\`bg-white rounded-xl shadow-md border-2 cursor-pointer transition-all duration-200 hover:shadow-lg
              ${getStatusColor(table.status)}`}
            onClick={() => {
              setSelectedTable(table);
              if (table.status === 'livre') {
                setShowCreateSale(true);
              } else {
                setShowTableDetails(true);
              }
            }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold text-gray-800">Mesa {table.number}</h3>
                <span className={\`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(table.status)}`}>
                  {getStatusLabel(table.status)}
                </span>
              </div>
              <p className="text-gray-600 mb-2">
                <Users size={16} className="inline-block mr-1 text-gray-500" />
                Capacidade: {table.capacity} pessoas
              </p>
              {table.location && (
                <p className="text-gray-600 text-sm mb-3">
                  Local: {table.location}
                </p>
              )}
              
              {table.status !== 'livre' && table.current_sale && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Venda Atual:</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(table.current_sale.total_amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Aberta por {table.current_sale.operator_name}
                  </p>
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering table click
                  deleteTable(table.id, table.name);
                }}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Excluir mesa"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhuma mesa cadastrada
          </h3>
          <p className="text-gray-500">
            Adicione mesas para começar a gerenciar as vendas presenciais.
          </p>
        </div>
      )}

      {/* Modals */}
      {selectedTable && showCreateSale && (
        <TableSaleModal
          table={selectedTable}
          storeId={storeId}
          onClose={() => setShowCreateSale(false)}
          onCreateSale={createSale}
        />
      )}

      {selectedTable && showTableDetails && selectedTable.current_sale && (
        <TableDetailsModal
          table={selectedTable}
          sale={selectedTable.current_sale}
          storeId={storeId}
          onClose={() => setShowTableDetails(false)}
          onCloseSale={closeSale}
          onUpdateStatus={updateTableStatus}
          onAddItem={addItemToSale}
        />
      )}

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Adicionar Nova Mesa</h2>
                <button
                  onClick={() => setShowAddTable(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Mesa da Janela"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidade (pessoas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddTable(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createTable}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Adicionar Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;
```