import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Package, BarChart3, Settings, Users, ArrowLeft, DollarSign, Bell, FileText, LogOut, User, Layers, ChevronUp, ChevronDown, Truck, ShoppingBag, MessageSquare, Search, Plus, Minus, Trash2, Scale, X, Check, AlertCircle, RefreshCw, CreditCard, Percent, Printer, Split } from 'lucide-react';
import { usePDVProducts, usePDVSales, usePDVCart } from '../../hooks/usePDV';
import { useScale } from '../../hooks/useScale';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useCashback } from '../../hooks/useCashback';
import { PDVProduct, PDVOperator, PDVCartItem, WeightReading } from '../../types/pdv';
import { PesagemModal } from './PesagemModal';

interface PDVSalesScreenProps {
  operator?: PDVOperator;
  scaleHook?: ReturnType<typeof useScale>;
  storeSettings?: any;
}

const PDVSalesScreen: React.FC<PDVSalesScreenProps> = ({ operator, scaleHook, storeSettings }) => {
  const { products, loading: productsLoading, searchProducts } = usePDVProducts();
  const { createSale, loading: salesLoading } = usePDVSales();
  const { isOpen: isCashRegisterOpen, currentRegister } = usePDVCashRegister();
  const { getRecommendations } = useRecommendations();
  const { getOrCreateCustomer, createPurchaseTransaction } = useCashback();
  
  const {
    items,
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
    totalItems,
    discount,
    paymentInfo
  } = usePDVCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedWeighableProduct, setSelectedWeighableProduct] = useState<PDVProduct | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showMixedPaymentModal, setShowMixedPaymentModal] = useState(false);
  const [mixedPayments, setMixedPayments] = useState<Array<{
    method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';
    amount: number;
  }>>([
    { method: 'dinheiro', amount: 0 },
    { method: 'cartao_credito', amount: 0 }
  ]);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [splitParts, setSplitParts] = useState(2);
  const [splitAmounts, setSplitAmounts] = useState<number[]>([]);
  const [showPrintAfterSale, setShowPrintAfterSale] = useState(false);
  const [draggedProduct, setDraggedProduct] = useState<PDVProduct | null>(null);
  const [dragOverCart, setDragOverCart] = useState(false);

  // Detectar quando pagamento misto é selecionado
  useEffect(() => {
    if (paymentInfo.method === 'misto' && !showMixedPaymentModal) {
      console.log('🔄 Pagamento misto selecionado, abrindo modal...');
      setShowMixedPaymentModal(true);
      // Inicializar com valores padrão
      const total = getTotal();
      setMixedPayments([
        { method: 'dinheiro', amount: total / 2 },
        { method: 'cartao_credito', amount: total / 2 }
      ]);
    }
  }, [paymentInfo.method, showMixedPaymentModal, getTotal]);

  // Abrir modal de pagamento misto automaticamente quando selecionado
  useEffect(() => {
    if (paymentInfo.method === 'misto' && !showMixedPaymentModal) {
      setShowMixedPaymentModal(true);
    }
  }, [paymentInfo.method, showMixedPaymentModal]);

  const handleAddMixedPayment = () => {
    setMixedPayments(prev => [...prev, { method: 'dinheiro', amount: 0 }]);
  };

  const handleRemoveMixedPayment = (index: number) => {
    setMixedPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMixedPayment = (index: number, field: 'method' | 'amount', value: string | number) => {
    setMixedPayments(prev => prev.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    ));
  };

  const getMixedPaymentTotal = () => {
    const total = mixedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    console.log('💰 Total do pagamento misto:', total);
    return total;
  };

  const isMixedPaymentValid = () => {
    const isValid = mixedPayments.length >= 2 && 
                   mixedPayments.every(p => p.amount > 0) &&
                   Math.abs(getMixedPaymentTotal() - getTotal()) <= 0.01;
    console.log('🔍 Validação do pagamento misto:', {
      hasMinimumPayments: mixedPayments.length >= 2,
      allAmountsValid: mixedPayments.every(p => p.amount > 0),
      totalMatches: Math.abs(getMixedPaymentTotal() - getTotal()) <= 0.01,
      isValid
    });
    return isValid;
  };

  const handleCloseMixedPaymentModal = () => {
    console.log('❌ Fechando modal de pagamento misto');
    try {
      setShowMixedPaymentModal(false);
      setPaymentInfo(prev => ({ ...prev, method: 'dinheiro' }));
      setMixedPayments([]);
      console.log('✅ Modal fechado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fechar modal:', error);
    }
  };

  const handleConfirmMixedPayment = () => {
    console.log('🔄 Confirmando pagamento misto...');
    console.log('💳 Pagamentos configurados:', mixedPayments);
    
    try {
      // Validações detalhadas
      if (mixedPayments.length < 2) {
        alert('Configure pelo menos 2 formas de pagamento');
        return;
      }
      
      const hasInvalidAmount = mixedPayments.some(p => !p.amount || p.amount <= 0);
      if (hasInvalidAmount) {
        alert('Todos os valores devem ser maiores que zero');
        return;
      }
      
      const totalConfigured = getMixedPaymentTotal();
      const saleTotal = getTotal();
      const difference = Math.abs(totalConfigured - saleTotal);
      
      if (difference > 0.01) {
        alert(`Total configurado (${formatPrice(totalConfigured)}) deve ser igual ao total da venda (${formatPrice(saleTotal)})`);
        return;
      }
      
      console.log('✅ Validações passaram, confirmando pagamento');
      setShowMixedPaymentModal(false);
      console.log('✅ Modal fechado após confirmação');
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento misto:', error);
      alert('Erro ao confirmar pagamento. Tente novamente.');
    }
  };
  
  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'acai', label: 'Açaí' },
    { id: 'sorvetes', label: 'Sorvetes' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'outros', label: 'Outros' }
  ];

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result;
  }, [products, searchProducts, searchTerm, selectedCategory]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleAddProduct = (product: PDVProduct) => {
    if (product.is_weighable) {
      setSelectedWeighableProduct(product);
      setShowWeightModal(true);
    } else {
      addItem(product, 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, product: PDVProduct) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', product.id);
    
    // Criar uma imagem de preview personalizada
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `
      <div style="
        background: white; 
        border: 2px solid #10b981; 
        border-radius: 8px; 
        padding: 8px 12px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: system-ui;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        white-space: nowrap;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        📦 ${product.name}
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Remover o elemento após um tempo
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedProduct(null);
    setDragOverCart(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverCart(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Só remove o highlight se realmente saiu da área do carrinho
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverCart(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCart(false);
    
    if (draggedProduct) {
      handleAddProduct(draggedProduct);
      setDraggedProduct(null);
    }
  };

  const handleWeightConfirm = (weightInGrams: number) => {
    if (selectedWeighableProduct) {
      const weightInKg = weightInGrams / 1000;
      addItem(selectedWeighableProduct, 1, weightInKg);
    }
    setShowWeightModal(false);
    setSelectedWeighableProduct(null);
  };

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      alert('Digite um valor válido para o desconto');
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      alert('Desconto percentual não pode ser maior que 100%');
      return;
    }

    if (discountType === 'amount' && value > getTotal()) {
      alert('Desconto em valor não pode ser maior que o total');
      return;
    }

    setDiscount({ type: discountType, value });
    setShowDiscountModal(false);
    setDiscountValue('');
  };

  const handleSplitPayment = () => {
    const total = getTotal();
    const amounts = Array(splitParts).fill(0).map((_, index) => {
      if (index === splitParts - 1) {
        // Última parte recebe o restante
        const remaining = total - splitAmounts.slice(0, index).reduce((sum, amount) => sum + amount, 0);
        return remaining;
      }
      return total / splitParts;
    });
    setSplitAmounts(amounts);
  };

  const updateSplitAmount = (index: number, value: number) => {
    const newAmounts = [...splitAmounts];
    newAmounts[index] = value;
    setSplitAmounts(newAmounts);
  };

  // Funções do pagamento misto
  const addMixedPayment = () => {
    setMixedPayments(prev => [...prev, { method: 'pix', amount: 0 }]);
  };

  const removeMixedPayment = (index: number) => {
    setMixedPayments(prev => prev.filter((_, i) => i !== index));
  };

  const updateMixedPayment = (index: number, field: 'method' | 'amount', value: any) => {
    setMixedPayments(prev => prev.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    ));
  };

  const getPaymentMethodName = (method: string) => {
    const labels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return labels[method] || method;
  };

  const calculateChange = (paymentAmount: number): number => {
    return Math.max(0, paymentAmount - getTotal());
  };

  const handlePrintReceipt = () => {
    if (items.length === 0) {
      alert('Adicione produtos ao carrinho para imprimir');
      return;
    }

    // Criar janela de impressão
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprovante de Venda</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: black !important; background: white !important; }
          body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; padding: 2mm; width: 76mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .separator { border-bottom: 1px dashed black; margin: 5px 0; padding-bottom: 5px; }
          .flex-between { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="center separator">
          <div class="bold" style="font-size: 16px;">ELITE AÇAÍ</div>
          <div>Comprovante de Venda</div>
          <div>Tel: (85) 98904-1010</div>
        </div>
        
        <div class="separator">
          <div class="bold center">ITENS</div>
          ${items.map((item, index) => `
            <div>
              <div class="bold">${item.product.name}</div>
              <div class="flex-between">
                <span>${item.quantity}x ${formatPrice(item.product.unit_price || 0)}</span>
                <span>${formatPrice(item.subtotal)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="separator">
          <div class="flex-between">
            <span>Subtotal:</span>
            <span>${formatPrice(getSubtotal())}</span>
          </div>
          ${getDiscountAmount() > 0 ? `
          <div class="flex-between">
            <span>Desconto:</span>
            <span>-${formatPrice(getDiscountAmount())}</span>
          </div>
          ` : ''}
          <div class="flex-between bold">
            <span>TOTAL:</span>
            <span>${formatPrice(getTotal())}</span>
          </div>
        </div>
        
        <div class="center">
          <div>Obrigado pela preferência!</div>
          <div>Elite Açaí</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const handleFinalizeSale = () => {
    if (items.length === 0) {
      alert('Adicione produtos ao carrinho antes de finalizar a venda');
      return;
    }

    if (!isCashRegisterOpen) {
      alert('Não é possível finalizar vendas sem um caixa aberto');
      return;
    }

    setShowPaymentModal(true);
  };

  const handleConfirmSale = async () => {
    // Validate operator before proceeding with sale creation
    if (!operator || !operator.id) {
      alert('Erro: Operador não identificado. Por favor, faça login novamente.');
      console.error('❌ Tentativa de venda sem operador válido:', { operator });
      return;
    }

    if (!paymentInfo.method) {
      alert('Selecione uma forma de pagamento');
      return;
    }

    setIsProcessingSale(true);

    try {
      // Preparar dados da venda
      const saleData = {
        operator_id: operator?.id,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        subtotal: getSubtotal(),
        discount_amount: getDiscountAmount(),
        discount_percentage: discount.type === 'percentage' ? discount.value : 0,
        total_amount: getTotal(),
        payment_type: paymentInfo.method,
        payment_details: paymentInfo.method === 'misto' 
          ? { mixed_payments: mixedPayments }
          : paymentInfo.changeFor 
            ? { change_for: paymentInfo.changeFor } 
            : undefined,
        change_amount: paymentInfo.changeFor ? Math.max(0, paymentInfo.changeFor - getTotal()) : 0,
        notes: '',
        is_cancelled: false
      };

      // Preparar itens da venda
      const saleItems = items.map(item => ({
        product_id: item.product.id,
        product_code: item.product.code,
        product_name: item.product.name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.product.unit_price,
        price_per_gram: item.product.price_per_gram,
        discount_amount: item.discount,
        subtotal: item.subtotal
      }));

      // Criar venda
      const sale = await createSale(saleData, saleItems);

      // Processar cashback se cliente identificado
      if (customerPhone && customerPhone.length >= 11) {
        try {
          const customer = await getOrCreateCustomer(customerPhone, customerName);
          await createPurchaseTransaction(customer.id, getTotal(), sale.id);
        } catch (cashbackError) {
          console.warn('Erro ao processar cashback (venda salva):', cashbackError);
        }
      }

      // Perguntar se deseja imprimir
      const shouldPrint = confirm(`Venda #${sale.sale_number} finalizada com sucesso!\n\nDeseja imprimir o comprovante?`);
      
      if (shouldPrint) {
        // Imprimir comprovante da venda
        handlePrintSaleReceipt(sale, saleItems);
      }

      // Limpar carrinho e fechar modal
      clearCart();
      setShowPaymentModal(false);
      setCustomerPhone('');
      setCustomerName('');

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda. Tente novamente.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const handlePrintSaleReceipt = (sale: any, saleItems: any[]) => {
    // Criar janela de impressão para comprovante de venda
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprovante Venda #${sale.sale_number}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: black !important; background: white !important; }
          body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; padding: 2mm; width: 76mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .separator { border-bottom: 1px dashed black; margin: 5px 0; padding-bottom: 5px; }
          .flex-between { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="center separator">
          <div class="bold" style="font-size: 16px;">ELITE AÇAÍ</div>
          <div>Comprovante de Venda</div>
          <div>Tel: (85) 98904-1010</div>
        </div>
        
        <div class="separator">
          <div class="bold center">VENDA #${sale.sale_number}</div>
          <div>Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          <div>Hora: ${new Date().toLocaleTimeString('pt-BR')}</div>
          ${operator ? `<div>Operador: ${operator.name}</div>` : ''}
          ${customerName ? `<div>Cliente: ${customerName}</div>` : ''}
        </div>
        
        <div class="separator">
          <div class="bold">ITENS</div>
          ${saleItems.map((item, index) => `
            <div>
              <div class="bold">${item.product_name}</div>
              <div class="flex-between">
                <span>${item.quantity}x ${formatPrice(item.unit_price || 0)}</span>
                <span>${formatPrice(item.subtotal)}</span>
              </div>
              ${item.weight_kg ? `<div>Peso: ${(item.weight_kg * 1000).toFixed(0)}g</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="separator">
          <div class="flex-between">
            <span>Subtotal:</span>
            <span>${formatPrice(getSubtotal())}</span>
          </div>
          ${getDiscountAmount() > 0 ? `
          <div class="flex-between">
            <span>Desconto:</span>
            <span>-${formatPrice(getDiscountAmount())}</span>
          </div>
          ` : ''}
          <div class="flex-between bold">
            <span>TOTAL:</span>
            <span>${formatPrice(getTotal())}</span>
          </div>
        </div>
        
        <div class="separator">
          <div class="bold">PAGAMENTO</div>
          <div>Forma: ${getPaymentMethodLabel(paymentInfo.method)}</div>
          ${sale.change_amount && sale.change_amount > 0 ? `<div>Troco para: ${formatPrice(sale.change_for || 0)}</div>` : ''}
          ${sale.change_amount && sale.change_amount > 0 ? `<div>Troco dado: ${formatPrice(sale.change_amount)}</div>` : ''}
        </div>
        
        <div class="center">
          <div>Obrigado pela preferência!</div>
          <div>Elite Açaí</div>
          <div style="margin-top: 10px;">
            <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return labels[method] || method;
  };

  // Discount Modal
  const DiscountModal = () => (
    showDiscountModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <Percent size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-bold">Aplicar Desconto</h2>
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Desconto
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    discountType === 'percentage'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Percent size={20} className="mx-auto mb-1" />
                  Percentual
                </button>
                <button
                  onClick={() => setDiscountType('amount')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    discountType === 'amount'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DollarSign size={20} className="mx-auto mb-1" />
                  Valor
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {discountType === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
              </label>
              <input
                type="number"
                step={discountType === 'percentage' ? '1' : '0.01'}
                min="0"
                max={discountType === 'percentage' ? '100' : getSubtotal()}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={discountType === 'percentage' ? '10' : '5.00'}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Subtotal:</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              {discountValue && (
                <>
                  <div className="flex justify-between text-sm text-orange-600 mb-2">
                    <span>Desconto:</span>
                    <span>
                      -{formatPrice(
                        discountType === 'percentage'
                          ? getSubtotal() * (parseFloat(discountValue) / 100)
                          : parseFloat(discountValue) || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">
                      {formatPrice(
                        getSubtotal() - (
                          discountType === 'percentage'
                            ? getSubtotal() * (parseFloat(discountValue) / 100)
                            : parseFloat(discountValue) || 0
                        )
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowDiscountModal(false)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyDiscount}
              disabled={!discountValue}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors"
            >
              Aplicar Desconto
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Split Payment Modal
  const SplitModal = () => (
    showSplitModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <Split size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-bold">Dividir Pagamento</h2>
              </div>
              <button
                onClick={() => setShowSplitModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dividir em quantas partes?
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSplitParts(Math.max(2, splitParts - 1))}
                  className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-bold w-12 text-center">{splitParts}</span>
                <button
                  onClick={() => setSplitParts(Math.min(10, splitParts + 1))}
                  className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={handleSplitPayment}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Calcular Divisão
            </button>

            {splitAmounts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Valores por parte:</h4>
                {splitAmounts.map((amount, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-16">Parte {index + 1}:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount.toFixed(2)}
                      onChange={(e) => updateSplitAmount(index, parseFloat(e.target.value) || 0)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                ))}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex justify-between font-bold">
                    <span>Total das partes:</span>
                    <span>{formatPrice(splitAmounts.reduce((sum, amount) => sum + amount, 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>Total original:</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowSplitModal(false)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  );

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 shadow-lg">
                <Calculator size={28} className="text-white" />
              </div>
              Vendas PDV
            </h2>
            <p className="text-gray-600 mt-2 text-lg">Sistema de vendas presenciais</p>
          </div>
          
          {itemCount > 0 && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-3 rounded-xl font-semibold shadow-md border border-green-200">
              {totalItems} item(s) - {formatPrice(getTotal())}
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            <div className="lg:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Package size={24} className="text-blue-600" />
                Produtos
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, product)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAddProduct(product)}
                    className={`bg-gradient-to-br from-gray-50 to-white hover:from-green-50 hover:to-emerald-50 border border-gray-200 hover:border-green-300 rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg min-h-[200px] flex flex-col justify-between ${
                      draggedProduct?.id === product.id ? 'opacity-50 scale-95' : ''
                    }`}
                    title="Clique para adicionar ou arraste para o carrinho"
                  >
                    <div className="text-center">
                      {/* Indicador de arrastar */}
                      <div className="absolute top-2 right-2 opacity-30 hover:opacity-60 transition-opacity">
                        <div className="flex flex-col gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center shadow-inner">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Package size={32} className="text-gray-400" />
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-800 text-base mb-3 leading-tight">{product.name}</h4>
                      <p className="text-sm text-gray-500 mb-4">{product.code}</p>
                      
                      {product.is_weighable ? (
                        <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-lg">
                          <Scale size={18} />
                          {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                        </div>
                      ) : (
                        <div className="font-bold text-green-600 text-lg">
                          {formatPrice(product.unit_price || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Package size={48} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Nenhum produto encontrado' 
                      : 'Nenhum produto disponível'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div 
              className={`bg-white rounded-2xl shadow-lg p-6 sticky top-4 border transition-all duration-300 ${
                dragOverCart 
                  ? 'border-green-400 bg-green-50 shadow-xl ring-2 ring-green-200' 
                  : 'border-gray-100'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-2 shadow-md">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <span>Carrinho ({itemCount})</span>
                {dragOverCart && (
                  <span className="text-green-600 text-sm font-medium animate-pulse">
                    📦 Solte aqui para adicionar
                  </span>
                )}
              </h3>

              {items.length === 0 ? (
                <div className={`text-center py-12 transition-all duration-300 ${
                  dragOverCart ? 'bg-green-100 border-2 border-dashed border-green-300 rounded-lg' : ''
                }`}>
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <ShoppingBag size={32} className={dragOverCart ? "text-green-500" : "text-gray-300"} />
                  </div>
                  <p className={`text-lg font-medium ${dragOverCart ? 'text-green-700' : 'text-gray-500'}`}>
                    {dragOverCart ? 'Solte o produto aqui!' : 'Carrinho vazio'}
                  </p>
                  <p className={`text-sm mt-1 ${dragOverCart ? 'text-green-600' : 'text-gray-400'}`}>
                    {dragOverCart ? 'Produto será adicionado ao carrinho' : 'Clique nos produtos ou arraste para cá'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Actions */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setShowDiscountModal(true)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Percent size={16} />
                      Desconto
                    </button>
                    <button
                      onClick={handlePrintReceipt}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Printer size={16} />
                      Imprimir
                    </button>
                    <button
                      onClick={() => setShowSplitModal(true)}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Split size={16} />
                      Dividir
                    </button>
                  </div>

                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                    {items.map((item, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">{item.product.name}</h4>
                            <p className="text-xs text-gray-500">{item.product.code}</p>
                            {item.weight && (
                              <p className="text-xs text-blue-600 font-medium">Peso: {(item.weight * 1000).toFixed(0)}g</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                              className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors duration-200"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-bold w-10 text-center bg-gray-100 rounded-lg py-1">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                              className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors duration-200"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-bold text-green-600">{formatPrice(item.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Cart Summary */}
              {items.length > 0 && (
                <div className="border-t border-gray-200 pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatPrice(getSubtotal())}</span>
                  </div>
                  
                  {getDiscountAmount() > 0 && (
                    <div className="flex justify-between text-red-600 text-sm font-semibold">
                      <span>Desconto:</span>
                      <span className="font-medium text-red-600">-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-xl border-t border-gray-200 pt-3">
                    <span>Total:</span>
                    <span className="text-green-600">{formatPrice(getTotal())}</span>
                  </div>

                  <div className="space-y-2 mt-4">
                    <button
                      onClick={handleFinalizeSale}
                      disabled={!isCashRegisterOpen || isProcessingSale}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {!isCashRegisterOpen ? 'Caixa Fechado' : 'Finalizar Venda'}
                    </button>
                    
                    <button
                      onClick={clearCart}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Limpar Carrinho
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weight Modal */}
        {showWeightModal && selectedWeighableProduct && (
          <PesagemModal
            produto={selectedWeighableProduct}
            onConfirmar={handleWeightConfirm}
            onFechar={() => {
              setShowWeightModal(false);
              setSelectedWeighableProduct(null);
            }}
          />
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                      <ShoppingBag size={28} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Finalizar Venda</h2>
                      <p className="text-green-100 text-sm">Complete os dados para processar a venda</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-3 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    Dados do Cliente (Opcional)
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm"
                      placeholder="Nome do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm"
                      placeholder="(85) 99999-9999"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Para cashback automático
                    </p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard size={20} className="text-purple-600" />
                    Forma de Pagamento
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'dinheiro', label: 'Dinheiro' },
                      { value: 'pix', label: 'PIX' },
                      { value: 'cartao_credito', label: 'Cartão de Crédito' },
                      { value: 'cartao_debito', label: 'Cartão de Débito' },
                      { value: 'voucher', label: 'Voucher' },
                      { value: 'misto', label: 'Pagamento Misto' }
                    ].map(method => (
                      <label key={method.value} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200">
                        <input
                          type="radio"
                          name="payment"
                          value={method.value}
                          checked={paymentInfo.method === method.value}
                          onChange={(e) => {
                            const selectedMethod = e.target.value as any;
                            updatePaymentInfo({ method: selectedMethod });
                            
                            // Se for pagamento misto, inicializar com valores padrão
                            if (selectedMethod === 'misto') {
                              const total = getTotal();
                              setMixedPayments([
                                { method: 'dinheiro', amount: total / 2 },
                                { method: 'cartao_credito', amount: total / 2 }
                              ]);
                            }
                          }}
                          className="text-green-600 w-5 h-5"
                        />
                        <span className="font-medium text-gray-800">{method.label}</span>
                        {method.value === 'misto' && paymentInfo.method === 'misto' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMixedPaymentModal(true);
                            }}
                            className="ml-auto bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Editar
                          </button>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Resumo do Pagamento Misto */}
                  {paymentInfo.method === 'misto' && mixedPayments.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                        <Split size={16} />
                        Pagamentos Configurados
                      </h4>
                      <div className="space-y-2">
                        {mixedPayments.map((payment, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-purple-700">
                              {getPaymentMethodLabel(payment.method)}:
                            </span>
                            <span className="font-medium text-purple-800">
                              {formatPrice(payment.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-purple-200 pt-2 mt-2">
                          <div className="flex justify-between font-bold">
                            <span className="text-purple-800">Total:</span>
                            <span className={`${
                              isMixedPaymentValid() ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPrice(getMixedPaymentTotal())}
                            </span>
                          </div>
                          {!isMixedPaymentValid() && (
                            <p className="text-red-600 text-xs mt-1">
                              ⚠️ Total deve ser {formatPrice(getTotal())}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentInfo.method === 'dinheiro' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Troco para quanto?
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentInfo.changeFor || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || undefined;
                          updatePaymentInfo({ changeFor: value });
                        }}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm"
                        placeholder="Valor para troco"
                      />
                      {paymentInfo.changeFor && paymentInfo.changeFor > getTotal() && (
                        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-md">
                          <div className="flex items-center gap-2">
                            <DollarSign size={20} className="text-green-600" />
                            <div>
                              <p className="text-lg font-bold text-green-800">
                                💰 Troco: {formatPrice(calculateChange(paymentInfo.changeFor))}
                              </p>
                              <p className="text-sm text-green-700 font-medium">
                                Cliente paga: {formatPrice(paymentInfo.changeFor)} • Total: {formatPrice(getTotal())}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentInfo.method === 'misto' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-purple-800">Pagamento Misto Configurado</h4>
                        <button
                          onClick={() => setShowMixedPaymentModal(true)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          Editar
                        </button>
                      </div>
                      <div className="space-y-2">
                        {mixedPayments.map((payment, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-purple-700">{getPaymentMethodName(payment.method)}:</span>
                            <span className="font-medium">{formatPrice(payment.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sale Summary */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-600" />
                    Resumo da Venda
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">{formatPrice(getSubtotal())}</span>
                    </div>
                    {getDiscountAmount() > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span className="font-semibold">-{formatPrice(getDiscountAmount())}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xl border-t border-gray-300 pt-3">
                      <span>Total:</span>
                      <span className="text-green-600">{formatPrice(getTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-200 bg-gray-50 flex gap-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSale}
                  disabled={isProcessingSale || !paymentInfo.method || (paymentInfo.method === 'misto' && !isMixedPaymentValid())}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  {isProcessingSale ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Confirmar Venda
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DiscountModal />
      <SplitModal />

      {/* Mixed Payment Modal */}
      {showMixedPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-xl p-2">
                    <CreditCard size={24} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Configurar Pagamento Misto</h2>
                </div>
                <button
                  onClick={handleCloseMixedPaymentModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Total da venda:</strong> {formatPrice(getTotal())}
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  Configure como será dividido o pagamento entre diferentes formas
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Formas de Pagamento</h4>
                  <button
                    onClick={addMixedPayment}
                    disabled={mixedPayments.length >= 5}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>

                {mixedPayments.map((payment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <select
                        value={payment.method}
                        onChange={(e) => updateMixedPayment(index, 'method', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="voucher">Voucher</option>
                      </select>
                      
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={payment.amount}
                        onChange={(e) => updateMixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="0,00"
                      />
                      
                      <button
                        onClick={() => removeMixedPayment(index)}
                        disabled={mixedPayments.length <= 2}
                        className="text-red-500 hover:text-red-700 disabled:text-gray-300 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">Total dos pagamentos:</span>
                    <span className="font-medium">
                      {formatPrice(mixedPayments.reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">Total da venda:</span>
                    <span className="font-medium">{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-purple-200 pt-2">
                    <span className="text-purple-800">Diferença:</span>
                    <span className={`${
                      Math.abs(mixedPayments.reduce((sum, p) => sum + p.amount, 0) - getTotal()) < 0.01
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatPrice(mixedPayments.reduce((sum, p) => sum + p.amount, 0) - getTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={handleCloseMixedPaymentModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMixedPayment}
                disabled={
                  mixedPayments.length < 2 ||
                  mixedPayments.some(p => !p.amount || p.amount <= 0) ||
                  Math.abs(getMixedPaymentTotal() - getTotal()) > 0.01
                }
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mixed Payment Modal */}
      {showMixedPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-xl p-2">
                    <Split size={24} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Configurar Pagamento Misto</h2>
                </div>
                <button
                  onClick={() => {
                    setShowMixedPaymentModal(false);
                    // Se cancelar, voltar para dinheiro
                    if (mixedPayments.length === 0) {
                      updatePaymentInfo({ method: 'dinheiro' });
                    }
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-700 font-medium">Total da venda:</span>
                  <span className="text-blue-800 font-bold text-lg">{formatPrice(getTotal())}</span>
                </div>
                <p className="text-blue-600 text-sm">
                  Configure as formas de pagamento que somem este valor
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Formas de Pagamento</h4>
                  <button
                    onClick={handleAddMixedPayment}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>

                {mixedPayments.map((payment, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <select
                          value={payment.method}
                          onChange={(e) => handleUpdateMixedPayment(index, 'method', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                          <option value="voucher">Voucher</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={payment.amount}
                          onChange={(e) => handleUpdateMixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          placeholder="0,00"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveMixedPayment(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {mixedPayments.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Split size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">Nenhuma forma de pagamento adicionada</p>
                    <p className="text-xs">Clique em "Adicionar" para começar</p>
                  </div>
                )}
              </div>

              {mixedPayments.length > 0 && (
                <div className={`rounded-lg p-4 border-2 ${
                  isMixedPaymentValid() 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total configurado:</span>
                    <span className={`font-bold text-lg ${
                      isMixedPaymentValid() ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPrice(getMixedPaymentTotal())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Total da venda:</span>
                    <span className="font-medium">{formatPrice(getTotal())}</span>
                  </div>
                  {!isMixedPaymentValid() && (
                    <div className="mt-2 text-red-600 text-sm font-medium">
                      ⚠️ Diferença: {formatPrice(Math.abs(getMixedPaymentTotal() - getTotal()))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowMixedPaymentModal(false);
                  updatePaymentInfo({ method: 'dinheiro' });
                  setMixedPayments([]);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmMixedPayment}
                disabled={!isMixedPaymentValid() || mixedPayments.length < 2}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PDVSalesScreen;