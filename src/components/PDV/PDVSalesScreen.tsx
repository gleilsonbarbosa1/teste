import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Trash2, Calculator, Scale, ShoppingCart, CreditCard, Banknote, QrCode, Users, Gift, AlertCircle, Check, X, DollarSign } from 'lucide-react';
import { usePDVCart, usePDVSales } from '../../hooks/usePDV';
import { useCashback } from '../../hooks/useCashback';
import { useScale } from '../../hooks/useScale';
import { useWeightFromScale } from '../../hooks/useWeightFromScale';
import { PesagemModal } from './PesagemModal';
import { PDVProduct, PDVOperator, PDVCartItem } from '../../types/pdv';
import { Customer, CustomerBalance } from '../../types/cashback';
import { formatPrice, getPaymentMethodName } from '../../utils/formatters';
import CashbackDisplay from '../Cashback/CashbackDisplay';
import CashbackButton from '../Cashback/CashbackButton';

interface PDVSalesScreenProps {
  operator?: PDVOperator;
  scaleHook?: ReturnType<typeof useScale>;
  storeSettings?: any;
}

interface MixedPayment {
  method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher';
  amount: number;
}

const PDVSalesScreen: React.FC<PDVSalesScreenProps> = ({ operator, scaleHook, storeSettings }) => {
  const {
    items,
    discount,
    paymentInfo,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemWeight,
    applyItemDiscount,
    setDiscount,
    updatePaymentInfo,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    itemCount,
    totalItems
  } = usePDVCart();

  const { createSale, loading: saleLoading } = usePDVSales();
  const { 
    getOrCreateCustomer, 
    getCustomerBalance, 
    createPurchaseTransaction, 
    createRedemptionTransaction,
    validateCashbackAmount,
    getCustomerByPhone,
    searchCustomersByName
  } = useCashback();

  const [showPesagem, setShowPesagem] = useState(false);
  const [produtoParaPesar, setProdutoParaPesar] = useState<PDVProduct | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerBalance, setCustomerBalance] = useState<CustomerBalance | null>(null);
  const [appliedCashback, setAppliedCashback] = useState(0);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [showMixedPaymentModal, setShowMixedPaymentModal] = useState(false);
  const [mixedPayments, setMixedPayments] = useState<MixedPayment[]>([]);

  const { fetchWeight, loading: weightLoading } = useWeightFromScale();

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    updatePaymentInfo({ customerPhone: formatted });
  };

  // Carregar dados do cliente quando o telefone for preenchido
  useEffect(() => {
    const loadCustomerData = async () => {
      const phoneNumbers = paymentInfo.customerPhone?.replace(/\D/g, '') || '';
      if (phoneNumbers.length >= 11) {
        try {
          setLoadingCustomer(true);
          
          const existingCustomer = await getCustomerByPhone(phoneNumbers);
          
          if (existingCustomer) {
            setCustomer(existingCustomer);
            updatePaymentInfo({ customerName: existingCustomer.name || paymentInfo.customerName });
            
            const balance = await getCustomerBalance(existingCustomer.id);
            setCustomerBalance(balance);
          } else {
            setCustomer(null);
            setCustomerBalance(null);
            setAppliedCashback(0);
          }
        } catch (error) {
          console.error('Erro ao buscar cliente:', error);
          setCustomer(null);
          setCustomerBalance(null);
          setAppliedCashback(0);
        } finally {
          setLoadingCustomer(false);
        }
      } else {
        setCustomer(null);
        setCustomerBalance(null);
        setAppliedCashback(0);
      }
    };

    const timeoutId = setTimeout(loadCustomerData, 500);
    return () => clearTimeout(timeoutId);
  }, [paymentInfo.customerPhone, getCustomerByPhone, getCustomerBalance, updatePaymentInfo]);

  const searchCustomerSuggestions = async (name: string) => {
    if (name.length < 3) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const suggestions = await searchCustomersByName(name);
      setCustomerSuggestions(suggestions.slice(0, 5));
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setCustomerSuggestions([]);
    }
  };

  useEffect(() => {
    if (paymentInfo.customerName && !customer) {
      const timeoutId = setTimeout(() => {
        searchCustomerSuggestions(paymentInfo.customerName || '');
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setCustomerSuggestions([]);
    }
  }, [paymentInfo.customerName, customer]);

  const selectCustomerSuggestion = async (selectedCustomer: Customer) => {
    setCustomer(selectedCustomer);
    updatePaymentInfo({
      customerName: selectedCustomer.name || paymentInfo.customerName,
      customerPhone: formatPhone(selectedCustomer.phone)
    });
    setCustomerSuggestions([]);
    
    try {
      const balance = await getCustomerBalance(selectedCustomer.id);
      setCustomerBalance(balance);
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
    }
  };

  const handleApplyCashback = async (amount: number) => {
    if (!customer || !customerBalance) return;

    try {
      const validation = await validateCashbackAmount(customer.id, amount);
      if (validation.valid) {
        setAppliedCashback(amount);
      } else {
        alert(validation.message);
      }
    } catch (error) {
      console.error('Erro ao validar cashback:', error);
      alert('Erro ao aplicar cashback');
    }
  };

  const handleRemoveCashback = () => {
    setAppliedCashback(0);
  };

  const handleMixedPaymentSetup = () => {
    const total = getTotal() - appliedCashback;
    setMixedPayments([
      { method: 'dinheiro', amount: total * 0.5 },
      { method: 'cartao_credito', amount: total * 0.5 }
    ]);
    setShowMixedPaymentModal(true);
  };

  const updateMixedPayment = (index: number, field: 'method' | 'amount', value: any) => {
    setMixedPayments(prev => prev.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    ));
  };

  const addMixedPayment = () => {
    setMixedPayments(prev => [...prev, { method: 'dinheiro', amount: 0 }]);
  };

  const removeMixedPayment = (index: number) => {
    if (mixedPayments.length > 1) {
      setMixedPayments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getMixedPaymentTotal = () => {
    return mixedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const isMixedPaymentValid = () => {
    const total = getTotal() - appliedCashback;
    const mixedTotal = getMixedPaymentTotal();
    return Math.abs(total - mixedTotal) < 0.01; // Tolerância de 1 centavo
  };

  const handleFinalizeSale = async () => {
    if (items.length === 0) {
      alert('Adicione pelo menos um item ao carrinho');
      return;
    }

    if (paymentInfo.method === 'misto' && !isMixedPaymentValid()) {
      alert('O valor total dos pagamentos mistos deve ser igual ao total da venda');
      return;
    }

    try {
      let currentCustomer = customer;
      
      if (!currentCustomer && paymentInfo.customerPhone && paymentInfo.customerName) {
        const phoneNumbers = paymentInfo.customerPhone.replace(/\D/g, '');
        currentCustomer = await getOrCreateCustomer(phoneNumbers, paymentInfo.customerName);
        setCustomer(currentCustomer);
      }

      if (currentCustomer && appliedCashback > 0) {
        const roundedCashback = Math.round(appliedCashback * 100) / 100;
        await createRedemptionTransaction(currentCustomer.id, roundedCashback);
      }

      const saleData = {
        operator_id: operator?.id,
        customer_name: paymentInfo.customerName,
        customer_phone: paymentInfo.customerPhone,
        subtotal: getSubtotal(),
        discount_amount: getDiscountAmount(),
        discount_percentage: discount.type === 'percentage' ? discount.value : 0,
        total_amount: getTotal() - appliedCashback,
        payment_type: paymentInfo.method,
        payment_details: paymentInfo.method === 'misto' ? { mixed_payments: mixedPayments } : undefined,
        change_amount: paymentInfo.changeFor ? Math.max(0, paymentInfo.changeFor - (getTotal() - appliedCashback)) : 0,
        notes: '',
        is_cancelled: false,
        channel: 'pdv'
      };

      const saleItems = items.map(item => ({
        product_id: item.product.id,
        product_code: item.product.code,
        product_name: item.product.name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.product.unit_price,
        price_per_gram: item.product.price_per_gram,
        discount_amount: item.discount || 0,
        subtotal: item.subtotal
      }));

      await createSale(saleData, saleItems);

      if (currentCustomer) {
        await createPurchaseTransaction(
          currentCustomer.id, 
          getTotal() - appliedCashback
        );
      }

      clearCart();
      setCustomer(null);
      setCustomerBalance(null);
      setAppliedCashback(0);
      setMixedPayments([]);
      setShowMixedPaymentModal(false);
      updatePaymentInfo({ 
        method: 'dinheiro', 
        customerName: '', 
        customerPhone: '', 
        changeFor: undefined 
      });

      alert('Venda realizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda. Tente novamente.');
    }
  };

  const handlePesarProduto = async (produto: PDVProduct) => {
    if (scaleHook) {
      try {
        const weight = await scaleHook.requestStableWeight();
        if (weight && weight.value > 0) {
          addItem(produto, 1, weight.value);
          return;
        }
      } catch (error) {
        console.error('Erro ao usar balança:', error);
      }
    }

    try {
      const peso = await fetchWeight();
      if (peso && peso > 0) {
        addItem(produto, 1, peso);
      } else {
        setProdutoParaPesar(produto);
        setShowPesagem(true);
      }
    } catch (error) {
      console.error('Erro ao obter peso:', error);
      setProdutoParaPesar(produto);
      setShowPesagem(true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Produtos */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Produtos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Produtos de demonstração */}
            <button
              onClick={() => addItem({
                id: 'demo-acai-300',
                code: 'ACAI300',
                name: 'Açaí 300ml',
                category: 'acai',
                is_weighable: false,
                unit_price: 15.90,
                stock_quantity: 100,
                min_stock: 10,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <div className="text-center">
                <div className="font-medium text-purple-800">Açaí 300ml</div>
                <div className="text-sm text-purple-600">{formatPrice(15.90)}</div>
              </div>
            </button>
            
            <button
              onClick={() => addItem({
                id: 'demo-acai-500',
                code: 'ACAI500',
                name: 'Açaí 500ml',
                category: 'acai',
                is_weighable: false,
                unit_price: 22.90,
                stock_quantity: 100,
                min_stock: 10,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <div className="text-center">
                <div className="font-medium text-green-800">Açaí 500ml</div>
                <div className="text-sm text-green-600">{formatPrice(22.90)}</div>
              </div>
            </button>
            
            <button
              onClick={() => handlePesarProduto({
                id: 'demo-acai-1kg',
                code: 'ACAI1KG',
                name: 'Açaí 1kg (Pesável)',
                category: 'acai',
                is_weighable: true,
                price_per_gram: 0.04499,
                stock_quantity: 50,
                min_stock: 5,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <div className="text-center">
                <div className="font-medium text-blue-800 flex items-center justify-center gap-1">
                  <Scale size={16} />
                  Açaí 1kg
                </div>
                <div className="text-sm text-blue-600">{formatPrice(44.99)}/kg</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Carrinho e Pagamento */}
      <div className="space-y-4">
        {/* Carrinho */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingCart size={20} />
              Carrinho ({totalItems})
            </h3>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Limpar
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart size={32} className="mx-auto mb-2 text-gray-300" />
              <p>Carrinho vazio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{item.product.name}</h4>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                  
                  {item.product.is_weighable && (
                    <div className="mt-2 text-sm text-gray-600">
                      Peso: {item.weight ? `${item.weight.toFixed(3)}kg` : 'Não pesado'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dados do Cliente */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados do Cliente</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={paymentInfo.customerName || ''}
                  onChange={(e) => updatePaymentInfo({ customerName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do cliente"
                />
                
                {customerSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                    {customerSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => selectCustomerSuggestion(suggestion)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">{suggestion.name}</div>
                        <div className="text-sm text-gray-500">{formatPhone(suggestion.phone)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={paymentInfo.customerPhone || ''}
                  onChange={handlePhoneChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(85) 99999-9999"
                />
                {loadingCustomer && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {customerBalance && (
            <div className="mt-4">
              <CashbackDisplay balance={customerBalance} />
            </div>
          )}
        </div>

        {/* Forma de Pagamento */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Forma de Pagamento</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="dinheiro"
                checked={paymentInfo.method === 'dinheiro'}
                onChange={(e) => updatePaymentInfo({ method: e.target.value as any })}
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
                checked={paymentInfo.method === 'pix'}
                onChange={(e) => updatePaymentInfo({ method: e.target.value as any })}
                className="text-blue-600"
              />
              <QrCode size={20} className="text-blue-600" />
              <span>PIX</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="cartao_credito"
                checked={paymentInfo.method === 'cartao_credito'}
                onChange={(e) => updatePaymentInfo({ method: e.target.value as any })}
                className="text-purple-600"
              />
              <CreditCard size={20} className="text-purple-600" />
              <span>Cartão de Crédito</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="cartao_debito"
                checked={paymentInfo.method === 'cartao_debito'}
                onChange={(e) => updatePaymentInfo({ method: e.target.value as any })}
                className="text-indigo-600"
              />
              <CreditCard size={20} className="text-indigo-600" />
              <span>Cartão de Débito</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="voucher"
                checked={paymentInfo.method === 'voucher'}
                onChange={(e) => updatePaymentInfo({ method: e.target.value as any })}
                className="text-orange-600"
              />
              <Gift size={20} className="text-orange-600" />
              <span>Voucher</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="misto"
                checked={paymentInfo.method === 'misto'}
                onChange={(e) => {
                  updatePaymentInfo({ method: e.target.value as any });
                  if (e.target.value === 'misto') {
                    handleMixedPaymentSetup();
                  }
                }}
                className="text-yellow-600"
              />
              <DollarSign size={20} className="text-yellow-600" />
              <span>Pagamento Misto</span>
            </label>
          </div>

          {paymentInfo.method === 'misto' && mixedPayments.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-yellow-800">Pagamento Misto Configurado</h4>
                <button
                  onClick={() => setShowMixedPaymentModal(true)}
                  className="text-yellow-600 hover:text-yellow-800 text-sm"
                >
                  Editar
                </button>
              </div>
              <div className="space-y-2">
                {mixedPayments.map((payment, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{getPaymentMethodName(payment.method)}:</span>
                    <span className="font-medium">{formatPrice(payment.amount)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-yellow-200">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span className={isMixedPaymentValid() ? 'text-green-600' : 'text-red-600'}>
                      {formatPrice(getMixedPaymentTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentInfo.method === 'dinheiro' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Troco para
              </label>
              <input
                type="number"
                step="0.01"
                value={paymentInfo.changeFor || ''}
                onChange={(e) => updatePaymentInfo({ changeFor: parseFloat(e.target.value) || undefined })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Valor para troco"
              />
            </div>
          )}
        </div>

        {/* Cashback */}
        {customerBalance && customerBalance.available_balance > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <CashbackButton
              availableBalance={customerBalance.available_balance}
              onApplyCashback={handleApplyCashback}
              onRemoveCashback={handleRemoveCashback}
              appliedAmount={appliedCashback}
              maxAmount={getTotal()}
            />
          </div>
        )}

        {/* Resumo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            
            {getDiscountAmount() > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto:</span>
                <span>-{formatPrice(getDiscountAmount())}</span>
              </div>
            )}
            
            {appliedCashback > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Cashback:</span>
                <span>-{formatPrice(appliedCashback)}</span>
              </div>
            )}
            
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">{formatPrice(getTotal() - appliedCashback)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleFinalizeSale}
            disabled={items.length === 0 || saleLoading || (paymentInfo.method === 'misto' && !isMixedPaymentValid())}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {saleLoading ? 'Processando...' : 'Finalizar Venda'}
          </button>
        </div>
      </div>

      {/* Modal de Pesagem */}
      {showPesagem && produtoParaPesar && (
        <PesagemModal
          produto={produtoParaPesar}
          onConfirmar={(peso) => {
            addItem(produtoParaPesar, 1, peso / 1000);
            setShowPesagem(false);
            setProdutoParaPesar(null);
          }}
          onFechar={() => {
            setShowPesagem(false);
            setProdutoParaPesar(null);
          }}
        />
      )}

      {/* Modal de Pagamento Misto */}
      {showMixedPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <DollarSign size={24} className="text-yellow-600" />
                  Configurar Pagamento Misto
                </h2>
                <button
                  onClick={() => setShowMixedPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">Total da Venda:</span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatPrice(getTotal() - appliedCashback)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Formas de Pagamento</h4>
                  <button
                    onClick={addMixedPayment}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>

                {mixedPayments.map((payment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Método
                        </label>
                        <select
                          value={payment.method}
                          onChange={(e) => updateMixedPayment(index, 'method', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                          <option value="voucher">Voucher</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={payment.amount}
                            onChange={(e) => updateMixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {mixedPayments.length > 1 && (
                            <button
                              onClick={() => removeMixedPayment(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total dos Pagamentos:</span>
                    <span className={`text-lg font-bold ${
                      isMixedPaymentValid() ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPrice(getMixedPaymentTotal())}
                    </span>
                  </div>
                  {!isMixedPaymentValid() && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ O total deve ser igual a {formatPrice(getTotal() - appliedCashback)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowMixedPaymentModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowMixedPaymentModal(false)}
                  disabled={!isMixedPaymentValid()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDVSalesScreen;