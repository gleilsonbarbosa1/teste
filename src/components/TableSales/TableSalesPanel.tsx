import React, { useState } from 'react';
import { useTableSales } from '../../hooks/useTableSales';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { RestaurantTable, TableSale } from '../../types/table-sales';
import TableGrid from './TableGrid';
import TableSaleModal from './TableSaleModal';
import TableDetailsModal from './TableDetailsModal';
import { 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName = 'Operador' }) => {
  const { tables, loading, error, createTableSale, addItemToSale, closeSale, getSaleDetails, updateTableStatus, refetch } = useTableSales(storeId);
  
  // Verificar status do caixa apenas para Loja 1 (Loja 2 opera independentemente)
  const cashRegister = storeId === 1 ? usePDVCashRegister() : null;
  
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<TableSale | null>(null);
  const [showTableInfo, setShowTableInfo] = useState(false);

  const handleTableClick = async (table: RestaurantTable) => {
    console.log(`🔍 Mesa ${table.number} clicada - Status: ${table.status}`);
    
    setSelectedTable(table);
    
    if (table.status === 'livre') {
      // Mesa livre - abrir modal para criar nova venda
      setShowSaleModal(true);
    } else if (table.status === 'ocupada' && table.current_sale_id) {
      // Mesa ocupada - mostrar detalhes da venda
      try {
        const saleDetails = await getSaleDetails(table.current_sale_id);
        if (saleDetails) {
          setSelectedSale(saleDetails);
          setShowDetailsModal(true);
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes da venda:', error);
        alert('Erro ao carregar detalhes da venda');
      }
    } else if (table.status === 'aguardando_conta') {
      // Mesa aguardando conta - mostrar opções de finalização
      try {
        const saleDetails = await getSaleDetails(table.current_sale_id!);
        if (saleDetails) {
          setSelectedSale(saleDetails);
          setShowDetailsModal(true);
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes da venda:', error);
        alert('Erro ao carregar detalhes da venda');
      }
    } else if (table.status === 'limpeza') {
      // Mesa em limpeza - opção para liberar
      if (confirm(`Finalizar limpeza da ${table.name}?`)) {
        try {
          await updateTableStatus(table.id, 'livre');
        } catch (error) {
          console.error('Erro ao atualizar status da mesa:', error);
          alert('Erro ao atualizar status da mesa');
        }
      }
    }
  };

  const handleCreateSale = async (customerName?: string, customerCount: number = 1) => {
    if (!selectedTable) return;

    try {
      console.log(`🚀 Criando venda para mesa ${selectedTable.number}`);
      await createTableSale(selectedTable.id, operatorName, customerName, customerCount);
      setShowSaleModal(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      alert('Erro ao criar venda para a mesa');
    }
  };

  const handleCloseSale = async (paymentType: string, changeAmount?: number) => {
    if (!selectedSale) return;

    try {
      await closeSale(selectedSale.id, paymentType, changeAmount);
      setShowDetailsModal(false);
      setSelectedSale(null);
    } catch (error) {
      console.error('Erro ao fechar venda:', error);
      alert('Erro ao fechar venda');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="text-red-600" />
          <div>
            <h3 className="font-medium text-red-800">Erro ao carregar mesas</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calcular estatísticas
  const totalTables = tables.length;
  const freeTables = tables.filter(t => t.status === 'livre').length;
  const occupiedTables = tables.filter(t => t.status === 'ocupada').length;
  const waitingTables = tables.filter(t => t.status === 'aguardando_conta').length;
  const cleaningTables = tables.filter(t => t.status === 'limpeza').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" />
            Gerenciar Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie vendas e status das mesas</p>
          {storeId === 1 && cashRegister && !cashRegister.isOpen && (
            <p className="text-yellow-600 text-sm font-medium">
              ⚠️ Caixa fechado - vendas não serão registradas no caixa
            </p>
          )}
          {storeId === 2 && (
            <p className="text-blue-600 text-sm font-medium">
              ℹ️ Loja 2 - Sistema independente de mesas
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowTableInfo(!showTableInfo)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Users size={16} />
            {showTableInfo ? 'Ocultar' : 'Ver'} Info
          </button>
          <button
            onClick={refetch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Informações das Mesas */}
      {showTableInfo && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Mesas Cadastradas - Loja {storeId}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Número</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Capacidade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Localização</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Venda Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tables.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-bold text-blue-600">#{table.number}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-800">{table.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-gray-400" />
                        <span>{table.capacity} pessoas</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        table.status === 'livre' ? 'bg-green-100 text-green-800' :
                        table.status === 'ocupada' ? 'bg-blue-100 text-blue-800' :
                        table.status === 'aguardando_conta' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {table.status === 'livre' ? 'Livre' :
                         table.status === 'ocupada' ? 'Ocupada' :
                         table.status === 'aguardando_conta' ? 'Aguardando Conta' :
                         'Em Limpeza'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600 text-sm">{table.location || 'Não informado'}</span>
                    </td>
                    <td className="py-4 px-4">
                      {table.current_sale_id ? (
                        <div className="text-sm">
                          <span className="text-blue-600 font-medium">Venda ativa</span>
                          {table.current_sale && (
                            <div className="text-xs text-gray-500">
                              Total: R$ {(table.current_sale.total_amount || 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sem venda</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium text-sm">ℹ️ Sobre as Mesas Cadastradas</p>
                <p className="text-blue-700 text-sm mt-1">
                  As mesas são cadastradas diretamente no banco de dados na tabela `{storeId === 1 ? 'store1_tables' : 'store2_tables'}`. 
                  Se você vê uma mesa com nome "Gleilson", ela foi criada anteriormente no banco.
                </p>
                <p className="text-blue-600 text-xs mt-2">
                  💡 Para gerenciar mesas (criar, editar, excluir), acesse o banco de dados diretamente ou use o painel administrativo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aviso sobre Caixa */}
      {storeId === 1 && cashRegister && !cashRegister.isOpen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Caixa Fechado - Loja {storeId}</h3>
              <p className="text-yellow-700 text-sm">
                As vendas das mesas podem ser realizadas, mas não serão registradas automaticamente no caixa. 
                Para integração completa, abra um caixa na aba "Caixas".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{freeTables}</p>
              <p className="text-gray-600 text-sm">Mesas Livres</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{occupiedTables}</p>
              <p className="text-gray-600 text-sm">Mesas Ocupadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{waitingTables}</p>
              <p className="text-gray-600 text-sm">Aguardando Conta</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-3">
              <RefreshCw size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{cleaningTables}</p>
              <p className="text-gray-600 text-sm">Em Limpeza</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Layout das Mesas</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Ocupada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Aguardando</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Limpeza</span>
            </div>
          </div>
        </div>

        <TableGrid 
          tables={tables} 
          onTableClick={handleTableClick}
        />
      </div>

      {/* Modais */}
      {showSaleModal && selectedTable && (
        <TableSaleModal
          table={selectedTable}
          onClose={() => {
            setShowSaleModal(false);
            setSelectedTable(null);
          }}
          onCreateSale={handleCreateSale}
        />
      )}

      {showDetailsModal && selectedSale && selectedTable && (
        <TableDetailsModal
          sale={selectedSale}
          table={selectedTable}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSale(null);
            setSelectedTable(null);
          }}
          onCloseSale={handleCloseSale}
          onAddItem={() => setShowAddItemModal(true)}
        />
      )}

      {showAddItemModal && selectedSale && (
        <AddItemModal
          saleId={selectedSale.id}
          onClose={() => setShowAddItemModal(false)}
          onItemAdded={async () => {
            // Recarregar detalhes da venda
            if (selectedSale) {
              const updatedSale = await getSaleDetails(selectedSale.id);
              if (updatedSale) {
                setSelectedSale(updatedSale);
              }
            }
            setShowAddItemModal(false);
          }}
        />
      )}
    </div>
  );
};

export default TableSalesPanel;