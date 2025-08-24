import React, { useState, useEffect } from 'react';
import { useTableSales } from '../../hooks/useTableSales';
import { RestaurantTable, TableSale } from '../../types/table-sales';
import { 
  Users, 
  Plus, 
  Eye, 
  Clock, 
  DollarSign, 
  Package, 
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
  User,
  Calendar,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import TableGrid from './TableGrid';
import TableSaleModal from './TableSaleModal';
import TableDetailsModal from './TableDetailsModal';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName = 'Operador' }) => {
  const {
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
    refetch
  } = useTableSales(storeId);

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [saleDetails, setSaleDetails] = useState<TableSale | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    
    if (table.status === 'livre') {
      setShowSaleModal(true);
    } else if (table.current_sale_id) {
      const details = await getSaleDetails(table.current_sale_id);
      if (details) {
        setSaleDetails(details);
        setShowDetailsModal(true);
      }
    }
  };

  const handleCreateSale = async (tableId: string, customerName?: string, customerCount?: number) => {
    try {
      await createTableSale(tableId, customerName || '', customerCount || 1);
      setShowSaleModal(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      alert('Erro ao criar venda da mesa');
    }
  };

  const handleCloseSale = async (saleId: string, paymentType: string) => {
    try {
      await closeSale(saleId, paymentType);
      setShowDetailsModal(false);
      setSaleDetails(null);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao fechar venda:', error);
      alert('Erro ao fechar venda da mesa');
    }
  };

  const handleUpdateStatus = async (tableId: string, status: string) => {
    try {
      await updateTableStatus(tableId, status as any);
      setShowDetailsModal(false);
      setSaleDetails(null);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da mesa');
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-red-600">{error}</p>
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
            <Users size={24} className="text-blue-600" />
            Controle de Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie vendas e status das mesas</p>
        </div>
        <button
          onClick={refetch}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Limpeza</p>
              <p className="text-2xl font-bold text-blue-600">{stats.cleaning}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Mesas da Loja {storeId}
        </h3>
        
        {tables.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma mesa encontrada
            </h3>
            <p className="text-gray-500">
              Configure as mesas da Loja {storeId} no sistema.
            </p>
          </div>
        ) : (
          <TableGrid tables={tables} onTableClick={handleTableClick} />
        )}
      </div>

      {/* Sale Details Modal */}
      {showDetailsModal && selectedTable && saleDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Mesa {selectedTable.number} - Venda #{saleDetails.sale_number}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSaleDetails(null);
                    setSelectedTable(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Sale Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  Informações da Venda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Venda #:</span>
                    <span className="font-medium">{saleDetails.sale_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Status:</span>
                    <span className="font-medium capitalize">{saleDetails.status}</span>
                  </div>
                  {saleDetails.customer_name && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Cliente:</span>
                      <span className="font-medium">{saleDetails.customer_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-blue-700">Pessoas:</span>
                    <span className="font-medium">{saleDetails.customer_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Operador:</span>
                    <span className="font-medium">{saleDetails.operator_name || operatorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Aberta em:</span>
                    <span className="font-medium">{formatDate(saleDetails.opened_at)}</span>
                  </div>
                  {saleDetails.closed_at && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Fechada em:</span>
                      <span className="font-medium">{formatDate(saleDetails.closed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600" />
                  Resumo Financeiro
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Subtotal:</span>
                    <span className="font-medium">{formatPrice(saleDetails.subtotal)}</span>
                  </div>
                  {saleDetails.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Desconto:</span>
                      <span className="font-medium text-red-600">-{formatPrice(saleDetails.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-green-200">
                    <span className="text-green-800">Total:</span>
                    <span className="text-green-800">{formatPrice(saleDetails.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <Package size={18} className="text-gray-600" />
                    Itens da Venda ({saleDetails.items?.length || 0})
                  </h3>
                  {saleDetails.items && saleDetails.items.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          if (selectedTable?.current_sale_id && confirm('Tem certeza que deseja limpar todos os itens desta venda?')) {
                            clearSaleItems(selectedTable.current_sale_id);
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Limpar Todos
                      </button>

                      <div className="flex justify-between">
                        <span className="text-blue-700">Status:</span>
                        <span className="font-medium capitalize">{saleDetails.status}</span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {saleDetails.items.map((item) => (
                          <div key={item.id} className="bg-white rounded p-3 flex justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{item.product_name}</p>
                              <p className="text-sm text-gray-600">
                                {item.weight_kg ? 
                                  `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg` :
                                  `${item.quantity}x × ${formatPrice(item.unit_price || 0)}`
                                }
                              </p>
                              {item.notes && (
                                <p className="text-xs text-gray-500 italic mt-1">
                                  Obs: {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600">
                                {formatPrice(item.subtotal)}
                              </span>
                              <button
                                onClick={() => removeItemFromSale(item.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remover item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {(!saleDetails.items || saleDetails.items.length === 0) && (
                  <div className="text-center py-8">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhum item na venda</p>
                    <p className="text-gray-400 text-sm">Adicione produtos para começar</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {saleDetails.status === 'aberta' && (
               <button
                 onClick={() => {
                   if (selectedTable?.current_sale_id && confirm('Tem certeza que deseja limpar todos os itens desta venda?')) {
                     clearSaleItems(selectedTable.current_sale_id);
                   }
                 }}
                 disabled={!saleDetails?.items || saleDetails.items.length === 0}
                 className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
               >
                 <Trash2 size={16} />
                 Limpar Itens
               </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdateStatus(selectedTable!.id, 'aguardando_conta')}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock size={18} />
                    Solicitar Conta
                  </button>
                  <button
                    onClick={() => handleCloseSale(saleDetails.id, 'dinheiro')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Fechar Mesa
                  </button>
                </div>
              )}
              
              {selectedTable?.status === 'limpeza' && (
                <button
                  onClick={() => handleUpdateStatus(selectedTable.id, 'livre')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Marcar como Livre
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table Sale Modal */}
      {showSaleModal && selectedTable && (
        <TableSaleModal
          table={selectedTable}
          isOpen={showSaleModal}
          onClose={() => {
            setShowSaleModal(false);
            setSelectedTable(null);
          }}
          onCreateSale={handleCreateSale}
        />
      )}

      {/* Table Details Modal */}
      {showDetailsModal && selectedTable && saleDetails && (
        <TableDetailsModal
          table={selectedTable}
          sale={saleDetails}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSaleDetails(null);
            setSelectedTable(null);
          }}
          onCloseSale={handleCloseSale}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default TableSalesPanel;
                     {saleDetails.items && saleDetails.items.length > 0 && (
                       <button
                         onClick={() => {
                           if (selectedTable?.current_sale_id && confirm('Tem certeza que deseja limpar todos os itens desta venda?')) {
                             clearSaleItems(selectedTable.current_sale_id);
                           }
                         }}
                         className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                         title="Limpar todos os itens"
                       >
                         <Trash2 size={16} />
                       </button>
                     )}