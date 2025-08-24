import React from 'react';
import { X, User, Clock, DollarSign, Package } from 'lucide-react';
import { RestaurantTable, TableSale } from '../../types/table-sales';

interface TableDetailsModalProps {
  table: RestaurantTable;
  sale: TableSale;
  isOpen: boolean;
  onClose: () => void;
  onCloseSale: (saleId: string, paymentType: string) => Promise<void>;
  onUpdateStatus: (tableId: string, status: string) => Promise<void>;
}

const TableDetailsModal: React.FC<TableDetailsModalProps> = ({
  table,
  sale,
  isOpen,
  onClose,
  onCloseSale,
  onUpdateStatus
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Mesa {table.number} - Venda #{sale.sale_number}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Sale Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Informações da Venda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Venda #:</span>
                <span className="font-medium">{sale.sale_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{sale.status}</span>
              </div>
              {sale.customer_name && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{sale.customer_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Pessoas:</span>
                <span className="font-medium">{sale.customer_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-600">Aberta:</span>
                <span className="font-medium">{formatDate(sale.opened_at)}</span>
              </div>
              {sale.closed_at && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-gray-600">Fechada:</span>
                  <span className="font-medium">{formatDate(sale.closed_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
              <DollarSign size={18} className="text-green-600" />
              Resumo Financeiro
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Subtotal:</span>
                <span className="font-medium">{formatPrice(sale.subtotal)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-700">Desconto:</span>
                  <span className="font-medium text-red-600">-{formatPrice(sale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-green-200">
                <span className="text-green-800">Total:</span>
                <span className="text-green-800">{formatPrice(sale.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          {sale.items && sale.items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Package size={18} className="text-gray-600" />
                Itens da Venda ({sale.items.length})
              </h3>
              <div className="space-y-2">
                {sale.items.map((item) => (
                  <div key={item.id} className="bg-white rounded p-3 flex justify-between items-start">
                    <div className="flex-1">
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
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {sale.status === 'aberta' && (
            <div className="flex gap-3">
              <button
                onClick={() => onUpdateStatus(table.id, 'aguardando_conta')}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Solicitar Conta
              </button>
              <button
                onClick={() => onCloseSale(sale.id, 'dinheiro')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Fechar Mesa
              </button>
            </div>
          )}
          
          {table.status === 'limpeza' && (
            <button
              onClick={() => onUpdateStatus(table.id, 'livre')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Marcar como Livre
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableDetailsModal;