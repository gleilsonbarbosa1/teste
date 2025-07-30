import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RestaurantTable, TableSale } from '../../types/table-sales';
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
  Eye,
  Utensils,
  X
} from 'lucide-react';

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
      const saleTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`*, current_sale:${saleTableName}(*)`)
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
    if (!confirm(`Tem certeza que deseja excluir a ${tableName}?`)) {
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
            <Utensils size={24} className="text-indigo-600" />
            Vendas de Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie vendas presenciais por mesa</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchTables}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
          
          <button
            onClick={() => setShowAddTable(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nova Mesa
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`relative rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${getStatusColor(table.status)}`}
          >
            {/* Table Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={20} />
                <div>
                  <h3 className="font-bold text-lg">{table.name}</h3>
                  <p className="text-sm opacity-75">Capacidade: {table.capacity} pessoas</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1">
                {table.status === 'livre' && (
                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setShowCreateSale(true);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Abrir comanda"
                  >
                    <Plus size={16} />
                  </button>
                )}
                
                {table.current_sale && (
                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setShowTableDetails(true);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye size={16} />
                  </button>
                )}
                
                <button
                  onClick={() => deleteTable(table.id, table.name)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-red-600"
                  title="Excluir mesa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border">
                {getStatusLabel(table.status)}
              </span>
              
              {table.current_sale && (
                <span className="text-sm font-medium">
                  Comanda #{table.current_sale.sale_number}
                </span>
              )}
            </div>

            {/* Sale Info */}
            {table.current_sale && (
              <div className="space-y-2 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between text-sm">
                  <span>Cliente:</span>
                  <span className="font-medium">{table.current_sale.customer_name || 'Não informado'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Pessoas:</span>
                  <span className="font-medium">{table.current_sale.customer_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-bold">{formatPrice(table.current_sale.total_amount)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs opacity-75">
                  <Clock size={12} />
                  <span>Aberta em {new Date(table.current_sale.opened_at).toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-3 pt-3 border-t border-white/20 flex gap-2">
              {table.status === 'ocupada' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'aguardando_conta')}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-xs py-2 px-3 rounded-lg transition-colors"
                >
                  Conta
                </button>
              )}
              
              {table.status === 'aguardando_conta' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'livre')}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-xs py-2 px-3 rounded-lg transition-colors"
                >
                  Liberar
                </button>
              )}
              
              {table.status === 'livre' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'limpeza')}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-xs py-2 px-3 rounded-lg transition-colors"
                >
                  Limpeza
                </button>
              )}
              
              {table.status === 'limpeza' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'livre')}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-xs py-2 px-3 rounded-lg transition-colors"
                >
                  Limpo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <Utensils size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhuma mesa cadastrada
          </h3>
          <p className="text-gray-500 mb-4">
            Cadastre mesas para começar as vendas presenciais
          </p>
          <button
            onClick={() => setShowAddTable(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Adicionar Mesa
          </button>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Mesa - Loja {storeId}</h3>
              <button
                onClick={() => setShowAddTable(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Mesa 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade (pessoas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddTable(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createTable}
                  disabled={!newTableNumber || !newTableName}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Criar Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Sale Modal */}
      {showCreateSale && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Abrir Comanda - {selectedTable.name}</h3>
              <button
                onClick={() => {
                  setShowCreateSale(false);
                  setSelectedTable(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center py-8">
              <Utensils size={48} className="mx-auto text-blue-500 mb-4" />
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Funcionalidade em Desenvolvimento
              </h4>
              <p className="text-gray-600 mb-6">
                O sistema de comandas de mesa está sendo desenvolvido. 
                Em breve você poderá criar vendas completas para mesas.
              </p>
              <button
                onClick={() => {
                  setShowCreateSale(false);
                  setSelectedTable(null);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Details Modal */}
      {showTableDetails && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes - {selectedTable.name}</h3>
              <button
                onClick={() => {
                  setShowTableDetails(false);
                  setSelectedTable(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {selectedTable.current_sale ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Comanda #{selectedTable.current_sale.sale_number}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Cliente:</span>
                      <p className="font-medium">{selectedTable.current_sale.customer_name || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Pessoas:</span>
                      <p className="font-medium">{selectedTable.current_sale.customer_count}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Total:</span>
                      <p className="font-bold text-lg">{formatPrice(selectedTable.current_sale.total_amount)}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Status:</span>
                      <p className="font-medium">{selectedTable.current_sale.status}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center py-8">
                  <Settings size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    Funcionalidade em Desenvolvimento
                  </h4>
                  <p className="text-gray-500">
                    O gerenciamento completo de comandas será implementado em breve.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto text-yellow-500 mb-4" />
                <h4 className="text-lg font-medium text-gray-800 mb-2">
                  Mesa sem comanda ativa
                </h4>
                <p className="text-gray-600">
                  Esta mesa não possui uma comanda aberta no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;