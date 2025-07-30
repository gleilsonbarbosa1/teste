import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, RefreshCw, AlertCircle, Clock, CheckCircle, Utensils, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RestaurantTable, TableSale } from '../../types/table-sales';

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTable, setNewTable] = useState({
    number: '',
    name: '',
    capacity: 4,
    location: ''
  });

  const getStoreName = () => storeId === 1 ? 'Loja 1' : 'Loja 2';
  const getTableName = () => storeId === 1 ? 'store1_tables' : 'store2_tables';
  const getSalesTableName = () => storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.warn(`⚠️ Supabase não configurado - usando dados de demonstração para ${getStoreName()}`);
        
        // Demo data
        const demoTables: RestaurantTable[] = [
          {
            id: '1',
            number: 1,
            name: `Mesa 1 - ${getStoreName()}`,
            capacity: 4,
            status: 'livre',
            location: 'Área Central',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            number: 2,
            name: `Mesa 2 - ${getStoreName()}`,
            capacity: 6,
            status: 'ocupada',
            location: 'Área VIP',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            number: 3,
            name: `Mesa 3 - ${getStoreName()}`,
            capacity: 2,
            status: 'aguardando_conta',
            location: 'Varanda',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setTables(demoTables);
        setLoading(false);
        return;
      }

      const tableName = getTableName();
      const salesTableName = getSalesTableName();
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`*, current_sale:${salesTableName}!${tableName}_current_sale_id_fkey(*)`)
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      
      setTables(data || []);
      console.log(`✅ ${data?.length || 0} mesas carregadas para ${getStoreName()}`);
    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da ${getStoreName()}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
      
      // Fallback to demo data on error
      const demoTables: RestaurantTable[] = [
        {
          id: 'demo-1',
          number: 1,
          name: `Mesa 1 - ${getStoreName()}`,
          capacity: 4,
          status: 'livre',
          location: 'Demonstração',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setTables(demoTables);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTable.number || !newTable.name) {
      alert('Número e nome da mesa são obrigatórios');
      return;
    }

    // Check for duplicate number
    const existingTable = tables.find(t => t.number === parseInt(newTable.number));
    if (existingTable) {
      alert(`Mesa número ${newTable.number} já existe. Escolha um número diferente.`);
      return;
    }

    try {
      const tableName = getTableName();
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([{
          number: parseInt(newTable.number),
          name: newTable.name,
          capacity: newTable.capacity,
          status: 'livre',
          location: newTable.location,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert(`Mesa número ${newTable.number} já existe. Escolha um número diferente.`);
          return;
        }
        throw error;
      }

      setTables(prev => [...prev, data]);
      setShowCreateModal(false);
      setNewTable({ number: '', name: '', capacity: 4, location: '' });
      
      console.log(`✅ Mesa criada na ${getStoreName()}:`, data);
    } catch (err) {
      console.error(`❌ Erro ao criar mesa na ${getStoreName()}:`, err);
      alert(`Erro ao criar mesa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const updateTableStatus = async (tableId: string, newStatus: RestaurantTable['status']) => {
    try {
      const tableName = getTableName();
      
      const { data, error } = await supabase
        .from(tableName)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;

      setTables(prev => prev.map(table => 
        table.id === tableId ? { ...table, status: newStatus } : table
      ));
      
      console.log(`✅ Status da mesa atualizado na ${getStoreName()}`);
    } catch (err) {
      console.error(`❌ Erro ao atualizar status da mesa na ${getStoreName()}:`, err);
      alert('Erro ao atualizar status da mesa');
    }
  };

  const deleteTable = async (tableId: string, tableName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a ${tableName}?`)) return;

    try {
      const tableNameDb = getTableName();
      
      const { error } = await supabase
        .from(tableNameDb)
        .update({ is_active: false })
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.filter(table => table.id !== tableId));
      console.log(`✅ Mesa excluída da ${getStoreName()}`);
    } catch (err) {
      console.error(`❌ Erro ao excluir mesa da ${getStoreName()}:`, err);
      alert('Erro ao excluir mesa');
    }
  };

  const getStatusConfig = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'livre':
        return {
          label: 'Livre',
          color: 'bg-green-100 border-green-300 text-green-800',
          icon: CheckCircle,
          buttonColor: 'bg-green-500 hover:bg-green-600'
        };
      case 'ocupada':
        return {
          label: 'Ocupada',
          color: 'bg-red-100 border-red-300 text-red-800',
          icon: Users,
          buttonColor: 'bg-red-500 hover:bg-red-600'
        };
      case 'aguardando_conta':
        return {
          label: 'Aguardando Conta',
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          icon: Clock,
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
        };
      case 'limpeza':
        return {
          label: 'Limpeza',
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          icon: Sparkles,
          buttonColor: 'bg-blue-500 hover:bg-blue-600'
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'bg-gray-100 border-gray-300 text-gray-800',
          icon: AlertCircle,
          buttonColor: 'bg-gray-500 hover:bg-gray-600'
        };
    }
  };

  const getStatusOptions = (currentStatus: RestaurantTable['status']) => {
    const allStatuses: RestaurantTable['status'][] = ['livre', 'ocupada', 'aguardando_conta', 'limpeza'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  useEffect(() => {
    fetchTables();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mesas da {getStoreName()}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Utensils size={24} className="text-indigo-600" />
            Vendas de Mesas - {getStoreName()}
          </h2>
          <p className="text-gray-600">Gerencie mesas e atendimento presencial</p>
          {operatorName && (
            <p className="text-sm text-indigo-600">Operador: {operatorName}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchTables}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nova Mesa
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
          <p className="text-red-500 text-sm mt-1">
            Exibindo dados de demonstração devido ao erro
          </p>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => {
          const statusConfig = getStatusConfig(table.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div
              key={table.id}
              className={`border-2 rounded-lg p-6 transition-all hover:shadow-md ${statusConfig.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <StatusIcon size={20} />
                  <h3 className="text-lg font-semibold">Mesa {table.number}</h3>
                </div>
                <button
                  onClick={() => deleteTable(table.id, table.name)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Excluir mesa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="font-medium">{table.name}</p>
                <p className="text-sm opacity-75">
                  Capacidade: {table.capacity} pessoas
                </p>
                {table.location && (
                  <p className="text-sm opacity-75">
                    Local: {table.location}
                  </p>
                )}
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                  <StatusIcon size={12} className="mr-1" />
                  {statusConfig.label}
                </div>
              </div>
              
              {/* Status Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium opacity-75">Mudar Status:</p>
                <div className="flex flex-wrap gap-1">
                  {getStatusOptions(table.status).map((status) => {
                    const config = getStatusConfig(status);
                    return (
                      <button
                        key={status}
                        onClick={() => updateTableStatus(table.id, status)}
                        className={`text-xs px-2 py-1 rounded text-white transition-colors ${config.buttonColor}`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {table.current_sale && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium">Venda Ativa:</p>
                  <p className="text-sm">#{table.current_sale.sale_number}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <Utensils size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhuma mesa encontrada
          </h3>
          <p className="text-gray-500 mb-4">
            Comece criando sua primeira mesa para a {getStoreName()}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Criar Primeira Mesa
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Mesa - {getStoreName()}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  value={newTable.number}
                  onChange={(e) => setNewTable(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mesa VIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable(prev => ({ ...prev, capacity: parseInt(e.target.value) || 4 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  value={newTable.location}
                  onChange={(e) => setNewTable(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Área Central"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                disabled={!newTable.number || !newTable.name}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;