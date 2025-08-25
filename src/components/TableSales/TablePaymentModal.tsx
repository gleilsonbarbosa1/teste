import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, AlertCircle } from 'lucide-react';

interface TablePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto', changeFor?: number) => void;
  totalAmount: number;
  isCashRegisterOpen: boolean;
}

const TablePaymentModal: React.FC<TablePaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  isCashRegisterOpen
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleConfirm = () => {
    onConfirm(paymentMethod, changeFor);
  };

  const isButtonEnabled = () => {
    // Button is enabled if:
    // 1. Cash register is open
    // 2. Payment method is selected
    // 3. If cash payment, change amount is valid (if provided)
    if (!isCashRegisterOpen) return false;
    if (!paymentMethod) return false;
    
    if (paymentMethod === 'dinheiro' && changeFor !== undefined) {
      return changeFor >= totalAmount;
    }
    
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CreditCard size={24} className="text-blue-600" />
              Forma de Pagamento - Mesa
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Total Amount */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium text-center">
              Total a pagar: {formatPrice(totalAmount)}
            </p>
          </div>

          {/* Cash Register Warning */}
          {!isCashRegisterOpen && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Caixa Fechado</p>
                  <p className="text-sm text-red-700">
                    Não é possível processar pagamentos sem um caixa aberto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Selecione a forma de pagamento:
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="dinheiro"
                  checked={paymentMethod === 'dinheiro'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-green-600 h-5 w-5"
                />
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Banknote size={20} className="text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Dinheiro</span>
                    <p className="text-sm text-gray-600">Pagamento em espécie</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-blue-600 h-5 w-5"
                />
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <QrCode size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">PIX</span>
                    <p className="text-sm text-gray-600">Chave: 85989041010</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cartao_credito"
                  checked={paymentMethod === 'cartao_credito'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-purple-600 h-5 w-5"
                />
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <CreditCard size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Cartão de Crédito</span>
                    <p className="text-sm text-gray-600">Máquina de cartão</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cartao_debito"
                  checked={paymentMethod === 'cartao_debito'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-indigo-600 h-5 w-5"
                />
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 rounded-full p-2">
                    <CreditCard size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Cartão de Débito</span>
                    <p className="text-sm text-gray-600">Máquina de cartão</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="voucher"
                  checked={paymentMethod === 'voucher'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-yellow-600 h-5 w-5"
                />
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Voucher</span>
                    <p className="text-sm text-gray-600">Vale alimentação</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Change Amount for Cash */}
          {paymentMethod === 'dinheiro' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Troco para quanto? (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min={totalAmount}
                value={changeFor || ''}
                onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={`Mínimo: ${formatPrice(totalAmount)}`}
              />
              {changeFor && changeFor > totalAmount && (
                <p className="text-sm text-green-600">
                  Troco: {formatPrice(changeFor - totalAmount)}
                </p>
              )}
              {changeFor && changeFor < totalAmount && (
                <p className="text-sm text-red-600">
                  Valor insuficiente para o troco
                </p>
              )}
            </div>
          )}

          {/* PIX Information */}
          {paymentMethod === 'pix' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <QrCode size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Dados para PIX</p>
                  <p className="text-sm text-blue-700">
                    <strong>Chave:</strong> 85989041010
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Nome:</strong> Amanda Suyelen da Costa Pereira
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Valor:</strong> {formatPrice(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isButtonEnabled()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <CreditCard size={16} />
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePaymentModal;