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

  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    if (table.currentSale) {
      setSelectedSale(table.currentSale);
      setShowDetailsModal(true);
    } else {
      setShowSaleModal(true);
    }
  };

  const handleCreateSale = async (customersCount: number) => {
    if (!selectedTable) return;
    
    try {
      await createTableSale(selectedTable.id, customersCount, operatorName);
      setShowSaleModal(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    }
  };

  const handleCloseSale = async (paymentMethod: string) => {
    if (!selectedSale) return;
    
    try {
      await closeSale(selectedSale.id, paymentMethod);
      setShowDetailsModal(false);
      setSelectedSale(null);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao fechar venda:', error);
    }
  };

  const handleAddItem = async (productId: string, quantity: number, unitPrice: number) => {
    if (!selectedSale) return;
    
    try {
      await addItemToSale(selectedSale.id, productId, quantity, unitPrice);
      // Recarregar detalhes da venda
      const updatedSale = await getSaleDetails(selectedSale.id);
      setSelectedSale(updatedSale);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  const handleUpdateTableStatus = async (tableId: string, status: 'available' | 'occupied' | 'reserved' | 'cleaning') => {
    try {
      await updateTableStatus(tableId, status);
    } catch (error) {
      console.error('Erro ao atualizar status da mesa:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <h3 className="font-medium text-red-800">Erro ao carregar mesas</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const totalRevenue = tables.reduce((sum, table) => 
    sum + (table.currentSale?.total || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendas por Mesa - Loja {storeId}</h2>
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
        
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Mesas Ocupadas</p>
              <p className="text-2xl font-bold text-gray-900">{occupiedTables}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Faturamento Atual</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-full p-3">
              <Clock size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total de Mesas</p>
              <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Table Grid */}
      <TableGrid 
        tables={tables}
        onTableClick={handleTableClick}
        onUpdateTableStatus={handleUpdateTableStatus}
      />

      {/* Modals */}
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
          onAddItem={handleAddItem}
          storeId={storeId}
        />
      )}
    </div>
  );
};

export default TableSalesPanel;