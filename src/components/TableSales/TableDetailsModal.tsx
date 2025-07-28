import React, { useState } from 'react';
import { RestaurantTable, TableSale } from '../../types/table-sales';
import { X, DollarSign, Users, Clock, CreditCard, Banknote, QrCode, Plus } from 'lucide-react';
import AddItemModal from './AddItemModal';
import { useTableSales } from '../../hooks/useTableSales';

interface TableDetailsModalProps {
  table: RestaurantTable;
  sale: TableSale;
  storeId: 1 | 2;
  onClose: () => void;
  onCloseSale: (paymentType: TableSale['payment_type'], changeAmount?: number, discountAmount?: number) => void;
  onUpdateStatus: (tableId: string, status: RestaurantTable['status']) => void;
}

const TableDetailsModal: React.FC<TableDetailsModalProps> = ({
  table,
  sale,
  storeId,
  onClose,
  onCloseSale,
  onUpdateStatus
}) => {
  const { addItemToSale } = useTableSales(storeId);
  const [showPayment, setShowPayment] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [paymentType, setPaymentType] = useState<TableSale['payment_type']>('dinheiro');
  const [changeAmount, setChangeAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleCloseSale = async () => {
    setLoading(true);
    try {
      await onCloseSale(paymentType, changeAmount, discountAmount);
    } catch (error) {
      console.error('Erro ao fechar venda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: RestaurantTable['status']) => {
    try {
      await onUpdateStatus(table.id, status);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleAddItem = async (item: any) => {
    try {
      console.log('📝 Processando adição de item:', item);
      await addItemToSale(sale.id, item);
      
      // Mostrar feedback de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Item adicionado com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
      // Forçar atualização da página para mostrar o novo item
      window.location.reload();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      alert('Erro ao adicionar item. Tente novamente.');
      throw error; // Re-throw para o modal tratar
    }
  };
  const totalWithDiscount = sale.subtotal - discountAmount;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {table.name} - Venda #{sale.sale_number}
              </h2>
              <p className="text-gray-600">Loja {storeId}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações da Venda */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Informações da Venda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                <span>Cliente: {sale.customer_name || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                <span>Pessoas: {sale.customer_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                <span>Aberta em: {formatDateTime(sale.opened_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-blue-600" />
                <span>Operador: {sale.operator_name}</span>
              </div>
            </div>
          </div>

          {/* Itens da Venda */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Itens da Venda</h3>
              <button 
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <Plus size={16} />
                Adicionar Item
              </button>
            </div>

            {sale.items && sale.items.length > 0 ? (
              <div className="space-y-3">
                {sale.items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">Código: {item.product_code}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 italic">Obs: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity}x {formatPrice(item.unit_price || 0)}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum item adicionado ainda</p>
                <p className="text-sm">Clique em "Adicionar Item" para começar</p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-green-800">Total da Venda:</span>
              <span className="text-2xl font-bold text-green-700">
                {formatPrice(sale.subtotal)}
              </span>
            </div>
          </div>

          {/* Ações */}
          {!showPayment ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleUpdateStatus('aguardando_conta')}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Solicitar Conta
              </button>
              <button
                onClick={() => setShowPayment(true)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Fechar Conta
              </button>
            </div>
          ) : (
            /* Formulário de Pagamento */
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Finalizar Pagamento</h3>
              
              {/* Desconto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={sale.subtotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Total com Desconto */}
              {discountAmount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(sale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto:</span>
                    <span className="text-red-600">-{formatPrice(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>{formatPrice(totalWithDiscount)}</span>
                  </div>
                </div>
              )}

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="dinheiro"
                      checked={paymentType === 'dinheiro'}
                      onChange={(e) => setPaymentType(e.target.value as TableSale['payment_type'])}
                      className="text-green-600"
                    />
                    <Banknote size={20} className="text-green-600" />
                    <span>Dinheiro</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="pix"
                      checked={paymentType === 'pix'}
                      onChange={(e) => setPaymentType(e.target.value as TableSale['payment_type'])}
                      className="text-green-600"
                    />
                    <QrCode size={20} className="text-blue-600" />
                    <span>PIX</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="cartao_credito"
                      checked={paymentType === 'cartao_credito'}
                      onChange={(e) => setPaymentType(e.target.value as TableSale['payment_type'])}
                      className="text-green-600"
                    />
                    <CreditCard size={20} className="text-purple-600" />
                    <span>Cartão de Crédito</span>
                  </label>
                </div>
              </div>

              {/* Troco */}
              {paymentType === 'dinheiro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Troco para quanto?
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={totalWithDiscount}
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={`Mínimo: ${formatPrice(totalWithDiscount)}`}
                  />
                  {changeAmount > totalWithDiscount && (
                    <p className="text-sm text-green-600 mt-1">
                      Troco: {formatPrice(changeAmount - totalWithDiscount)}
                    </p>
                  )}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPayment(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCloseSale}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Finalizando...
                    </>
                  ) : (
                    'Finalizar Venda'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para Adicionar Item */}
      <AddItemModal
        isOpen={showAddItem}
        onClose={() => setShowAddItem(false)}
        onAddItem={handleAddItem}
        storeId={storeId}
      />
    </div>
  );
};

export default TableDetailsModal;