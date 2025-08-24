import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Eye, 
  DollarSign, 
  Clock, 
  User,
  Package,
  AlertCircle,
  RefreshCw,
  Utensils,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTableSales } from '../../hooks/useTableSales';
import { RestaurantTable, TableSale } from '../../types/table-sales';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName = 'Operador' }) => {
  const { tables, loading, error, stats, createTableSale, closeSale, getSaleDetails, updateTableStatus, refetch } = useTableSales(storeId);
  
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [saleDetails, setSaleDetails] = useState<TableSale | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'livre': return <CheckCircle size={16} />;
      case 'ocupada': return <User size={16} />;
      case 'aguardando_conta': return <DollarSign size={16} />;
      case 'limpeza': return <Package size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    
    if (table.status === 'livre') {
      setShowNewSaleModal(true);
    } else if (table.current_sale_id) {
      const details = await getSaleDetails(table.current_sale_id);
      setSaleDetails(details);
      setShowDetailsModal(true);
    }
  };

  const handleCreateSale = async () => {
    if (!selectedTable) return;
    
    try {
      await createTableSale(selectedTable.id, customerName, customerCount);
      setShowNewSaleModal(false);
      setCustomerName('');
      setCustomerCount(1);
      setSelectedTable(null);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa ${selectedTable.number} aberta com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      alert('Erro ao abrir mesa. Tente novamente.');
    }
  };

  const handleUpdateStatus = async (tableId: string, newStatus: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza') => {
    try {
      await updateTableStatus(tableId, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status da mesa.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
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
              <h3 className="font-medium text-yellow-800">Modo Demonstração</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Sistema de mesas limitado.
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
            Sistema de Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie mesas e vendas presenciais</p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Livres</p>
              <p className="text-2xl font-bold text-green-600">{stats.free}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupadas</p>
              <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
            </div>
            <User className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aguardando</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.waitingBill}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Mesas ({tables.length})
        </h3>
        
        {tables.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma mesa encontrada
            </h3>
            <p className="text-gray-500">
              {supabaseConfigured 
                ? 'Não há mesas cadastradas para esta loja.'
                : 'Configure o Supabase para acessar as mesas.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(table.status)}`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(table.status)}
                  </div>
                  <h4 className="font-bold text-lg mb-1">Mesa {table.number}</h4>
                  <p className="text-sm font-medium mb-2">{getStatusLabel(table.status)}</p>
                  
                  {table.current_sale && (
                    <div className="text-xs space-y-1">
                      {table.current_sale.customer_name && (
                        <p>Cliente: {table.current_sale.customer_name}</p>
                      )}
                      <p>Pessoas: {table.current_sale.customer_count}</p>
                      <p className="font-semibold">
                        Total: {formatPrice(table.current_sale.total_amount)}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-600">
                    Capacidade: {table.capacity} pessoas
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Sale Modal */}
      {showNewSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Abrir Mesa {selectedTable.number}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pessoas
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomerCount(Math.max(1, customerCount - 1))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{customerCount}</span>
                  <button
                    onClick={() => setCustomerCount(customerCount + 1)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Mesa:</strong> {selectedTable.name} (Capacidade: {selectedTable.capacity} pessoas)
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowNewSaleModal(false);
                  setSelectedTable(null);
                  setCustomerName('');
                  setCustomerCount(1);
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSale}
                disabled={!supabaseConfigured}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors"
              >
                Abrir Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Details Modal */}
      {showDetailsModal && selectedTable && saleDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Mesa {selectedTable.number} - Detalhes
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedTable(null);
                    setSaleDetails(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Sale Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Informações da Venda</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Venda #:</span>
                    <span className="ml-2 font-medium">{saleDetails.sale_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{saleDetails.status}</span>
                  </div>
                  {saleDetails.customer_name && (
                    <div>
                      <span className="text-gray-600">Cliente:</span>
                      <span className="ml-2 font-medium">{saleDetails.customer_name}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Pessoas:</span>
                    <span className="ml-2 font-medium">{saleDetails.customer_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Aberta em:</span>
                    <span className="ml-2 font-medium">
                      {new Date(saleDetails.opened_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-bold text-green-600">
                      {formatPrice(saleDetails.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              {saleDetails.items && saleDetails.items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">
                    Itens ({saleDetails.items.length})
                  </h3>
                  <div className="space-y-2">
                    {saleDetails.items.map((item) => (
                      <div key={item.id} className="bg-white rounded p-3 flex justify-between">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">
                            {item.weight_kg ? 
                              `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg` :
                              `${item.quantity}x × ${formatPrice(item.unit_price || 0)}`
                            }
                          </p>
                        </div>
                        <p className="font-semibold text-green-600">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {saleDetails.status === 'aberta' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedTable.id, 'aguardando_conta')}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Solicitar Conta
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await closeSale(saleDetails.id, 'dinheiro');
                          setShowDetailsModal(false);
                          setSelectedTable(null);
                          setSaleDetails(null);
                        } catch (err) {
                          alert('Erro ao fechar mesa.');
                        }
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Fechar Mesa
                    </button>
                  </>
                )}
                
                {selectedTable.status === 'limpeza' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTable.id, 'livre')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Marcar como Livre
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Utensils size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como usar o Sistema de Mesas</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Mesa Livre:</strong> Clique para abrir uma nova venda</li>
              <li>• <strong>Mesa Ocupada:</strong> Clique para ver detalhes da venda</li>
              <li>• <strong>Aguardando Conta:</strong> Cliente solicitou a conta</li>
              <li>• <strong>Limpeza:</strong> Mesa sendo limpa após fechamento</li>
              <li>• Use o PDV para adicionar itens às vendas das mesas</li>
              <li>• O sistema sincroniza automaticamente com o caixa</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSalesPanel;