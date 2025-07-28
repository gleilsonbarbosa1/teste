import React, { useState } from 'react';
import { X, AlertTriangle, DollarSign, CheckCircle, Printer } from 'lucide-react';
import { PDVCashRegister, PDVCashRegisterSummary } from '../../types/pdv';

interface Store2CashRegisterCloseConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (closingAmount: number, justification?: string) => void;
  register: PDVCashRegister | null;
  summary: PDVCashRegisterSummary | null;
  isProcessing: boolean;
}

const Store2CashRegisterCloseConfirmation: React.FC<Store2CashRegisterCloseConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  register,
  summary,
  isProcessing
}) => {
  const [closingAmount, setClosingAmount] = useState(0);
  const [hasInformedAmount, setHasInformedAmount] = useState(false);
  const [justification, setJustification] = useState('');
  const [printMovements, setPrintMovements] = useState(true);

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleAmountConfirm = () => {
    if (closingAmount > 0) {
      setHasInformedAmount(true);
    }
  };

  const expectedBalance = summary?.expected_balance || 0;
  const difference = closingAmount - expectedBalance;
  const hasDifference = Math.abs(difference) > 0.01; // Tolerância de 1 centavo
  const needsJustification = hasDifference && hasInformedAmount;

  const canProceed = hasInformedAmount && (!needsJustification || justification.trim().length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              Confirmar Fechamento de Caixa - Loja 2
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600">
            {!hasInformedAmount 
              ? 'Informe o valor contado no caixa da Loja 2 para prosseguir com o fechamento.'
              : 'Confirme os dados do fechamento de caixa da Loja 2.'
            }
          </p>
        </div>

        <div className="p-6 overflow-y-auto">
          {!hasInformedAmount ? (
            // ETAPA 1: Informar valor contado
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <DollarSign size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Contagem do Caixa - Loja 2</h3>
                    <p className="text-blue-700 text-sm">
                      Conte todo o dinheiro físico presente no caixa da Loja 2 e informe o valor total.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor contado no caixa *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informe o valor total em dinheiro presente no caixa da Loja 2
                </p>
              </div>
            </div>
          ) : (
            // ETAPA 2: Mostrar comparação e solicitar justificativa se necessário
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <DollarSign size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                  <div className="w-full">
                    <h3 className="text-lg font-bold text-blue-800 mb-3">Conferência do Fechamento - Loja 2</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Valor informado (contado):</span>
                        <span className="font-bold text-blue-800">{formatPrice(closingAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-blue-700">Saldo esperado (sistema):</span>
                        <span className="font-medium text-blue-800">{formatPrice(expectedBalance)}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-blue-200">
                        <div className="flex justify-between">
                          <span className="font-medium text-blue-800">Diferença:</span>
                          <span className={`font-bold ${
                            difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-blue-800'
                          }`}>
                            {difference === 0 ? 'Exato' : 
                             difference > 0 ? `+${formatPrice(difference)} (sobra)` : 
                             `${formatPrice(difference)} (falta)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo das movimentações (sempre visível) */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="font-medium text-gray-800 mb-2">Resumo das Movimentações - Loja 2</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor de abertura:</span>
                    <span className="font-medium">{formatPrice(summary?.opening_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendas Loja 2:</span>
                    <span className="font-medium text-green-600">{formatPrice(summary?.sales_total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Outras entradas:</span>
                    <span className="font-medium text-green-600">{formatPrice(summary?.other_income_total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saídas:</span>
                    <span className="font-medium text-red-600">{formatPrice(summary?.total_expense || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Justificativa obrigatória para diferenças */}
              {needsJustification && (
                <div className={`border rounded-xl p-4 ${
                  difference > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className={`mt-1 flex-shrink-0 ${
                      difference > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                    <div className="w-full">
                      <h4 className={`font-medium mb-2 ${
                        difference > 0 ? 'text-yellow-800' : 'text-red-800'
                      }`}>
                        Justificativa Obrigatória
                      </h4>
                      <p className={`text-sm mb-3 ${
                        difference > 0 ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        Foi detectada uma diferença de {formatPrice(Math.abs(difference))}. 
                        É obrigatório informar a justificativa para esta diferença.
                      </p>
                      <textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Descreva o motivo da diferença encontrada..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Printer size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={printMovements}
                        onChange={(e) => setPrintMovements(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-blue-800 font-medium">
                        Imprimir relatório de movimentações da Loja 2
                      </span>
                    </label>
                    <p className="text-xs text-blue-600 mt-1 ml-6">
                      Imprime um resumo detalhado de todas as movimentações do caixa da Loja 2
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {!hasInformedAmount ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAmountConfirm}
                  disabled={closingAmount <= 0}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Confirmar Valor
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setHasInformedAmount(false);
                    setJustification('');
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={() => onConfirm(closingAmount, justification || undefined)}
                  disabled={isProcessing || !canProceed}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Confirmar Fechamento
                    </>
                  )}
                </button>
              </>
            )}
          </div>
          
          {needsJustification && !justification.trim() && (
            <div className="mt-2 text-center">
              <p className="text-sm text-red-600">
                ⚠️ Justificativa obrigatória para diferenças no caixa
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Store2CashRegisterCloseConfirmation;