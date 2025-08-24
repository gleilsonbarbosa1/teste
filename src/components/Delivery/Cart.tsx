import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Minus, ShoppingCart, MessageCircle, Trash2, MapPin, ArrowLeft, Gift, ChevronRight, CreditCard, Banknote, QrCode, AlertCircle } from 'lucide-react';
import { Edit3 } from 'lucide-react';
import { CartItem } from '../../types/product';
import { DeliveryInfo } from '../../types/delivery';
import { Customer, CustomerBalance } from '../../types/cashback';
import { useOrders } from '../../hooks/useOrders';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { useCashback } from '../../hooks/useCashback';
import CashbackDisplay from '../Cashback/CashbackDisplay';
import CashbackButton from '../Cashback/CashbackButton';
import ProductModal from './ProductModal';

interface CartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  totalPrice: number;
  disabled?: boolean;
  onEditItem?: (itemId: string, product: any, selectedSize?: any, quantity: number, observations?: string, selectedComplements?: any[]) => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice,
  disabled = false,
  onEditItem
}) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const { isOpen: isCashRegisterOpen } = usePDVCashRegister();
  const [customerBalance, setCustomerBalance] = useState<CustomerBalance | null>(null);
  const [appliedCashback, setAppliedCashback] = useState(0);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const { createOrder } = useOrders();
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    name: '',
    phone: '',
    address: '',
    neighborhood: '',
    complement: '',
    paymentMethod: 'money'
  });
  const { neighborhoods, getNeighborhoodByName } = useNeighborhoods();
  const { 
    getOrCreateCustomer, 
    getCustomerBalance, 
    createPurchaseTransaction, 
    createRedemptionTransaction,
    validateCashbackAmount,
    getCustomerByPhone,
    searchCustomersByName
  } = useCashback();

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
    setDeliveryInfo(prev => ({ ...prev, phone: formatted }));
  };

  // Carregar dados do cliente quando o telefone for preenchido
  useEffect(() => {
    const loadCustomerData = async () => {
      const phoneNumbers = deliveryInfo.phone.replace(/\D/g, '');
      if (phoneNumbers.length >= 11) {
        try {
          setLoadingCustomer(true);
          
          const existingCustomer = await getCustomerByPhone(phoneNumbers);
          
          if (existingCustomer) {
            console.log('✅ Cliente encontrado:', existingCustomer);
            setCustomer(existingCustomer);
            
            setDeliveryInfo(prev => ({
              ...prev,
              name: existingCustomer.name || prev.name
            }));
            
            const balance = await getCustomerBalance(existingCustomer.id);
            setCustomerBalance(balance);
            
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
            notification.innerHTML = `
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Cliente reconhecido: ${existingCustomer.name || 'Cliente'}
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification);
              }
            }, 3000);
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
  }, [deliveryInfo.phone, getCustomerByPhone, getCustomerBalance]);

  const searchCustomerSuggestions = useCallback(async (name: string) => {
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
  }, [searchCustomersByName]);

  useEffect(() => {
    if (deliveryInfo.name && !customer) {
      const timeoutId = setTimeout(() => {
        searchCustomerSuggestions(deliveryInfo.name);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setCustomerSuggestions([]);
    }
  }, [deliveryInfo.name, customer, searchCustomerSuggestions]);

  const selectCustomerSuggestion = async (selectedCustomer: Customer) => {
    setCustomer(selectedCustomer);
    setDeliveryInfo(prev => ({
      ...prev,
      name: selectedCustomer.name || prev.name,
      phone: formatPhone(selectedCustomer.phone)
    }));
    setCustomerSuggestions([]);
    
    try {
      const balance = await getCustomerBalance(selectedCustomer.id);
      setCustomerBalance(balance);
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
    }
  };

  const ensureCustomerExists = async () => {
    if (!customer && deliveryInfo.phone && deliveryInfo.name) {
      try {
        const phoneNumbers = deliveryInfo.phone.replace(/\D/g, '');
        const customerData = await getOrCreateCustomer(phoneNumbers, deliveryInfo.name);
        setCustomer(customerData);
        
        const balance = await getCustomerBalance(customerData.id);
        setCustomerBalance(balance);
        
        return customerData;
      } catch (error) {
        console.error('Erro ao criar/buscar cliente:', error);
        return null;
      }
    }
    return customer;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getSelectedNeighborhood = () => {
    return getNeighborhoodByName(deliveryInfo.neighborhood);
  };

  const getDeliveryFee = () => {
    const neighborhood = getSelectedNeighborhood();
    return neighborhood ? neighborhood.delivery_fee : 0;
  };

  const getEstimatedDeliveryTime = () => {
    const neighborhood = getSelectedNeighborhood();
    return neighborhood ? neighborhood.delivery_time : 50;
  };

  const getSubtotal = () => {
    return totalPrice + getDeliveryFee();
  };

  const getTotalWithCashback = () => {
    return Math.max(0, getSubtotal() - appliedCashback);
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

  const handleEditItem = (item: CartItem) => {
    setEditingItem(item);
  };

  const handleSaveEditedItem = (product: any, selectedSize?: any, quantity: number = 1, observations?: string, selectedComplements: any[] = []) => {
    if (editingItem && onEditItem) {
      onEditItem(editingItem.id, product, selectedSize, quantity, observations, selectedComplements);
      setEditingItem(null);
    }
  };

  const generateWhatsAppMessage = (orderId?: string, cashbackEarned?: number) => {
    let message = `🥤 *PEDIDO ELITE AÇAÍ*\n\n`;
    
    message += `📋 *ITENS:*\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name.replace(/[^\x00-\x7F]/g, "")}`;
      if (item.selectedSize) {
        message += ` (${item.selectedSize.name.replace(/[^\x00-\x7F]/g, "")})`;
      }
      message += `\n   Qtd: ${item.quantity}x - ${formatPrice(item.totalPrice)}`;
      
      if (item.selectedComplements && item.selectedComplements.length > 0) {
        message += `\n   *Complementos:*`;
        item.selectedComplements.forEach(selected => {
          message += `\n   • ${selected.complement.name.replace(/[^\x00-\x7F]/g, "")}`;
          if (selected.complement.price > 0) {
            message += ` (+${formatPrice(selected.complement.price)})`;
          }
        });
      }
      
      if (item.observations) {
        message += `\n   *Obs:* ${item.observations.replace(/[^\x00-\x7F]/g, "")}`;
      }
      message += `\n\n`;
    });

    message += `💰 *VALORES:*\n`;
    message += `Subtotal: ${formatPrice(totalPrice)}\n`;
    if (getDeliveryFee() > 0) {
      message += `Taxa de entrega (${deliveryInfo.neighborhood}): ${formatPrice(getDeliveryFee())}\n`;
    }
    if (appliedCashback > 0) {
      message += `Desconto cashback: -${formatPrice(appliedCashback)}\n`;
    }
    message += `*TOTAL: ${formatPrice(getTotalWithCashback())}*\n\n`;

    if (cashbackEarned && cashbackEarned > 0) {
      message += `🎁 *CASHBACK GANHO:*\n`;
      message += `Você ganhou ${formatPrice(cashbackEarned)} de cashback!\n`;
      message += `Use até o final deste mês.\n\n`;
    }

    message += `📍 *DADOS DE ENTREGA:*\n`;
    message += `Nome: ${deliveryInfo.name.replace(/[^\x00-\x7F]/g, "")}\n`;
    message += `Telefone: ${deliveryInfo.phone}\n`;
    message += `Endereço: ${deliveryInfo.address.replace(/[^\x00-\x7F]/g, "")}\n`;
    message += `Bairro: ${deliveryInfo.neighborhood.replace(/[^\x00-\x7F]/g, "")}`;
    
    const neighborhood = getSelectedNeighborhood();
    if (neighborhood) {
      message += ` (Entrega: ${neighborhood.delivery_time}min)`;
    }
    message += `\n`;
    
    if (deliveryInfo.complement) {
      message += `Complemento: ${deliveryInfo.complement.replace(/[^\x00-\x7F]/g, "")}\n`;
    }
    
    message += `\n💳 *PAGAMENTO:* `;
    switch (deliveryInfo.paymentMethod) {
      case 'money':
        message += `Dinheiro`;
        if (deliveryInfo.changeFor) {
          message += ` (Troco para ${formatPrice(deliveryInfo.changeFor)})`;
        }
        break;
      case 'pix':
        message += `PIX\n`;
        message += `📱 *DADOS PIX:*\n`;
        message += `Chave: 85989041010\n`;
        message += `Nome: Amanda Suyelen da Costa Pereira\n`;
        message += `Valor: ${formatPrice(getTotalWithCashback())}\n\n`;
        message += `⚠️ *IMPORTANTE:* Envie o comprovante do PIX para confirmar o pedido!`;
        break;
      case 'card':
        message += `Cartão`;
        break;
    }

    if (orderId) {
      message += `\n\n🔗 *ACOMPANHAR PEDIDO:*\n`;
      message += `${window.location.origin}/pedido/${orderId}\n\n`;
      message += `📱 *Salve este link para acompanhar seu pedido em tempo real!*`;
    }

    return encodeURIComponent(message);
  };

  const handleSendOrder = async () => {
    try {
      const neighborhood = getSelectedNeighborhood();
      
      const orderData = {
        customer_name: deliveryInfo.name,
        customer_phone: deliveryInfo.phone,
        customer_address: deliveryInfo.address,
        customer_neighborhood: deliveryInfo.neighborhood,
        customer_complement: deliveryInfo.complement,
        payment_method: deliveryInfo.paymentMethod,
        change_for: deliveryInfo.changeFor,
        neighborhood_id: neighborhood?.id,
        delivery_fee: getDeliveryFee(),
        estimated_delivery_minutes: getEstimatedDeliveryTime(),
        customer_id: customer?.id,
        items: items.map(item => ({
          id: item.id,
          product_name: item.product.name,
          product_image: item.product.image,
          selected_size: item.selectedSize?.name,
          quantity: item.quantity,
          unit_price: item.selectedSize?.price || item.product.price,
          total_price: item.totalPrice,
          observations: item.observations,
          complements: item.selectedComplements.map(sc => ({
            name: sc.complement.name,
            price: sc.complement.price
          }))
        })),
        total_price: getTotalWithCashback(),
        status: 'pending' as const
      };

      const newOrder = await createOrder(orderData);
      
      console.log('✅ Pedido criado com sucesso:', newOrder);

      // Mostrar tela de sucesso
      setOrderSuccess({
        show: true,
        orderId: newOrder.id,
        orderNumber: newOrder.id.slice(-8)
      });

      let cashbackEarned = 0;

      if (customer) {
        let currentCustomer = customer;
        
        if (appliedCashback > 0) {
          const roundedCashback = Math.round(appliedCashback * 100) / 100;
          await createRedemptionTransaction(currentCustomer.id, roundedCashback, newOrder.id);
        }

        const purchaseTransaction = await createPurchaseTransaction(
          currentCustomer.id, 
          getTotalWithCashback(), 
          newOrder.id
        );
        cashbackEarned = purchaseTransaction.cashback_amount;
      } else {
        let currentCustomer = await ensureCustomerExists();
        
        if (currentCustomer) {
          if (appliedCashback > 0) {
            const roundedCashback = Math.round(appliedCashback * 100) / 100;
            await createRedemptionTransaction(currentCustomer.id, roundedCashback, newOrder.id);
          }

          const purchaseTransaction = await createPurchaseTransaction(
            currentCustomer.id, 
            getTotalWithCashback(), 
            newOrder.id
          );
          cashbackEarned = purchaseTransaction.cashback_amount;
        }
      }

      const message = generateWhatsAppMessage(newOrder.id, cashbackEarned);
      const whatsappUrl = `https://wa.me/5585989041010?text=${message}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      const message = generateWhatsAppMessage();
      const whatsappUrl = `https://wa.me/5585989041010?text=${message}`;
      window.open(whatsappUrl, '_blank');
      
      // Mesmo com erro, mostrar tela de sucesso (pedido foi enviado por WhatsApp)
      setOrderSuccess(true);
    }
  };

  const handleOrderSuccessClose = () => {
    setOrderSuccess({ show: false, orderId: '', orderNumber: '' });
    onClearCart();
    onClose();
  };

  const copyOrderLink = async () => {
    const link = `${window.location.origin}/pedido/${orderSuccess.orderId}`;
    try {
      await navigator.clipboard.writeText(link);
      
      // Feedback visual
      const button = document.querySelector('[data-copy-button]') as HTMLButtonElement;
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Copiado!
        `;
        button.className = button.className.replace('bg-blue-600', 'bg-green-600');
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.className = button.className.replace('bg-green-600', 'bg-blue-600');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      alert('Erro ao copiar link. Tente selecionar e copiar manualmente.');
    }
  };

  const copyTrackingLink = async () => {
    if (!successOrderId) return;
    
    const trackingUrl = `${window.location.origin}/pedido/${successOrderId}`;
    
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = trackingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleFinishOrder = () => {
    onClearCart();
    setOrderSuccess(false);
    setSuccessOrderId(null);
    setShowCheckout(false);
    onClose();
  };
  const isFormValid = () => {
    const phoneNumbers = deliveryInfo.phone.replace(/\D/g, '');
    return deliveryInfo.name.trim() && 
           deliveryInfo.phone.trim() && 
           phoneNumbers.length >= 11 &&
           deliveryInfo.address.trim() && 
           deliveryInfo.neighborhood.trim();
  };

  const handlePayment = () => {
    // Lógica para processar pagamento
    console.log('Processando pagamento...');
  };

  const handleDiscount = () => {
    // Lógica para aplicar desconto
    console.log('Aplicando desconto...');
  };

  const handlePrint = () => {
    // Lógica para imprimir
    console.log('Imprimindo...');
  };

  const handleSplit = () => {
    // Lógica para dividir conta
    console.log('Dividindo conta...');
  };

  const handleContinueShopping = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Tela de sucesso do pedido
  if (orderSuccess.show) {
    const orderLink = `${window.location.origin}/pedido/${orderSuccess.orderId}`;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
          {/* Header com gradiente de sucesso */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="bg-white/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">🎉 Pedido Realizado!</h2>
              <p className="text-green-100">Seu açaí está sendo preparado com carinho</p>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-4">
            {/* Número do pedido */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700 mb-1">Número do seu pedido:</p>
              <p className="text-2xl font-bold text-green-800">#{orderSuccess.orderNumber}</p>
            </div>

            {/* Link de acompanhamento */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-sm font-medium text-blue-800">Link de Acompanhamento:</p>
              </div>
              
              <div className="bg-white border border-blue-200 rounded p-3 mb-3">
                <p className="text-xs text-gray-600 font-mono break-all">
                  {orderLink}
                </p>
              </div>
              
              <button
                onClick={copyOrderLink}
                data-copy-button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar Link
              </button>
            </div>

            {/* Informações sobre cashback */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1m2 0V9.5m0 0V8" />
                </svg>
                <p className="text-sm font-medium text-purple-800">Cashback Ganho!</p>
              </div>
              <p className="text-sm text-purple-700">
                Você ganhou <strong>5% de cashback</strong> neste pedido para usar até o final do mês!
              </p>
            </div>

            {/* Informações sobre PIX */}
            {deliveryInfo.paymentMethod === 'pix' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium text-yellow-800">Importante - Pagamento PIX</p>
                </div>
                <p className="text-sm text-yellow-700">
                  Envie o comprovante do PIX pelo WhatsApp <strong>(85) 98904-1010</strong> para confirmar seu pedido.
                </p>
              </div>
            )}

            {/* Próximos passos */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">📋 Próximos Passos:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ Seu pedido foi enviado para nossa cozinha</li>
                <li>👨‍🍳 Tempo estimado de preparo: 35-50 minutos</li>
                <li>📱 Você receberá atualizações por WhatsApp</li>
                <li>🔗 Use o link acima para acompanhar em tempo real</li>
              </ul>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            <button
              onClick={() => window.location.href = `/pedido/${orderSuccess.orderId}`}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Acompanhar Meu Pedido
            </button>
            
            <button
              onClick={handleOrderSuccessClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 3H5a2 2 0 00-2 2v1m2 0h16M7 13L5.4 5M7 13l-2.293 2.293A1 1 0 005 16v6a1 1 0 001 1h1M9 19v-6a1 1 0 011-1h2a1 1 0 011 1v6M9 19h4" />
              </svg>
              Fazer Novo Pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de sucesso do pedido
  if (orderSuccess && successOrderId) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
          {/* Header de Sucesso */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
            <div className="bg-white/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              🎉 Pedido Realizado com Sucesso!
            </h2>
            <p className="text-green-100">
              Seu pedido foi enviado e está sendo processado
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-4">
            {/* ID do Pedido */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Número do Pedido:</p>
              <p className="text-2xl font-bold text-purple-600 font-mono">
                #{successOrderId.slice(-8)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Guarde este número para acompanhar seu pedido
              </p>
            </div>

            {/* Link de Acompanhamento */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-sm font-medium text-blue-800">
                  Link de Acompanhamento
                </p>
              </div>
              
              <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 font-mono break-all">
                  {window.location.origin}/pedido/{successOrderId}
                </p>
              </div>
              
              <button
                onClick={copyTrackingLink}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  linkCopied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {linkCopied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar Link
                  </>
                )}
              </button>
              
              <p className="text-xs text-blue-700 text-center mt-2">
                📱 Compartilhe este link para acompanhar o pedido em tempo real
              </p>
            </div>

            {/* Informações Importantes */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-purple-800 mb-2">
                    ℹ️ Próximos Passos:
                  </p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• ✅ Pedido enviado por WhatsApp</li>
                    <li>• 📞 Aguarde confirmação da loja</li>
                    <li>• 🍧 Preparo iniciará após confirmação</li>
                    <li>• 🚴 Entrega em aproximadamente {getEstimatedDeliveryTime()} minutos</li>
                    {deliveryInfo.paymentMethod === 'pix' && (
                      <li>• 💳 Envie o comprovante do PIX para confirmar</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Cashback Info */}
            {customer && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Gift size={18} className="text-green-600" />
                  <p className="text-sm font-medium text-green-800">
                    🎁 Cashback de 5% será creditado automaticamente!
                  </p>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Use até o final do mês em suas próximas compras
                </p>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            <button
              onClick={() => window.location.href = `/pedido/${successOrderId}`}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Acompanhar Pedido
            </button>
            
            <button
              onClick={handleFinishOrder}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Fazer Novo Pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showOrderTracking && orderId) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ShoppingCart size={32} className="text-green-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Pedido Enviado!
          </h2>
          <p className="text-gray-600 mb-4">
            Seu pedido foi recebido e está sendo processado.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">ID do Pedido:</p>
            <p className="font-mono font-bold text-purple-600">
              #{orderId.slice(-8)}
            </p>
          </div>

          {customer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 justify-center">
                <Gift size={16} className="text-green-600" />
                <p className="text-sm text-green-700 font-medium">
                  Cashback processado com sucesso!
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">
              📱 O link para acompanhar seu pedido foi enviado pelo WhatsApp!
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setShowOrderTracking(false);
                onClose();
                window.location.href = `/pedido/${orderId}`;
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Acompanhar Pedido
            </button>
            
            <button
              onClick={() => {
                setShowOrderTracking(false);
                onClose();
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            {showCheckout ? (
              <>
                <div className="bg-purple-100 rounded-full p-2">
                  <ChevronRight size={20} className="text-purple-600" />
                </div>
                Finalizar Pedido
              </>
            ) : (
              <>
                <div className="bg-green-100 rounded-full p-2">
                  <ShoppingCart size={20} className="text-green-600" />
                </div>
                Seu Carrinho
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!showCheckout ? (
            <div>
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <ShoppingCart size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg mb-6">Seu carrinho está vazio</p>
                  <button
                    onClick={handleContinueShopping}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto shadow-md hover:shadow-lg"
                  >
                    <ArrowLeft size={18} />
                    Continuar Comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Formas de Pagamento */}
                  <div className="space-y-3 mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Forma de Pagamento:</h3>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value="money"
                          checked={deliveryInfo.paymentMethod === 'money'}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                          className="text-green-600 h-5 w-5"
                        />
                        <div className="flex items-center gap-2">
                          <Banknote size={20} className="text-green-600" />
                          <span className="font-medium">Dinheiro</span>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value="pix"
                          checked={deliveryInfo.paymentMethod === 'pix'}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                          className="text-blue-600 h-5 w-5"
                        />
                        <div className="flex items-center gap-2">
                          <QrCode size={20} className="text-blue-600" />
                          <span className="font-medium">PIX</span>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value="credit_card"
                          checked={deliveryInfo.paymentMethod === 'credit_card'}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                          className="text-purple-600 h-5 w-5"
                        />
                        <div className="flex items-center gap-2">
                          <CreditCard size={20} className="text-purple-600" />
                          <span className="font-medium">Cartão de Crédito</span>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value="debit_card"
                          checked={deliveryInfo.paymentMethod === 'debit_card'}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                          className="text-indigo-600 h-5 w-5"
                        />
                        <div className="flex items-center gap-2">
                          <CreditCard size={20} className="text-indigo-600" />
                          <span className="font-medium">Cartão de Débito</span>
                        </div>
                      </label>
                    </div>
                    
                    {deliveryInfo.paymentMethod === 'money' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Troco para quanto?
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={getTotalWithCashback()}
                          value={deliveryInfo.changeFor || ''}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, changeFor: parseFloat(e.target.value) || undefined }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Valor para troco"
                        />
                        {deliveryInfo.changeFor && deliveryInfo.changeFor > getTotalWithCashback() && (
                          <p className="text-sm text-green-600">
                            Troco: {formatPrice(deliveryInfo.changeFor - getTotalWithCashback())}
                          </p>
                        )}
                      </div>
                    )}

                    {deliveryInfo.paymentMethod === 'pix' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">PIX Selecionado</p>
                            <p className="text-sm text-blue-700">
                              Chave PIX: 85989041010
                            </p>
                            <p className="text-sm text-blue-700">
                              Nome: Amanda Suyelen da Costa Pereira
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">{item.product.name}</h3>
                          {item.selectedSize && (
                            <p className="text-sm text-gray-600 mt-1">{item.selectedSize.name}</p>
                          )}
                          
                          {item.selectedComplements && item.selectedComplements.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-gray-700 mb-2">Complementos:</p>
                              <div className="flex flex-wrap gap-2">
                                {item.selectedComplements.map((selected, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                                    {selected.complement.name}
                                    {selected.complement.price > 0 && (
                                      <span className="text-green-600 ml-1 font-semibold">
                                        (+{formatPrice(selected.complement.price)})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {item.observations && (
                            <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded-lg p-2">
                              <p className="text-sm text-yellow-700">
                                <span className="font-medium">Observações:</span> {item.observations}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={disabled}
                                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors disabled:opacity-50"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-medium w-8 text-center text-lg">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={disabled}
                                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors disabled:opacity-50"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                disabled={disabled}
                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                                title="Editar complementos"
                              >
                                <Edit3 size={16} />
                              </button>
                              <span className="font-bold text-purple-600 text-lg">
                                {formatPrice(item.totalPrice)}
                              </span>
                              <button
                                onClick={() => onRemoveItem(item.id)}
                                disabled={disabled}
                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nome completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deliveryInfo.name}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 shadow-sm ${
                      !deliveryInfo.name.trim() && showCheckout 
                        ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-purple-500'
                    }`}
                    placeholder="Seu nome"
                    required
                  />
                  {!deliveryInfo.name.trim() && showCheckout && (
                    <p className="text-red-600 text-xs mt-1">Nome é obrigatório</p>
                  )}
                  
                  {customerSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                      {customerSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => selectCustomerSuggestion(suggestion)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <div className="font-medium text-gray-800">{suggestion.name}</div>
                          <div className="text-sm text-gray-500">{formatPhone(suggestion.phone)}</div>
                          {suggestion.email && (
                            <div className="text-xs text-gray-400">{suggestion.email}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Telefone *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={deliveryInfo.phone}
                    onChange={handlePhoneChange}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 shadow-sm ${
                      (!deliveryInfo.phone.trim() || deliveryInfo.phone.replace(/\D/g, '').length < 11) && showCheckout 
                        ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-purple-500'
                    }`}
                    placeholder="(85) 99999-9999"
                    required
                  />
                  {(!deliveryInfo.phone.trim() || deliveryInfo.phone.replace(/\D/g, '').length < 11) && showCheckout && (
                    <p className="text-red-600 text-xs mt-1">Telefone válido é obrigatório (11 dígitos)</p>
                  )}
                  {loadingCustomer && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {customer ? 
                    '✅ Cliente reconhecido - dados preenchidos automaticamente' : 
                    'Digite seu telefone para identificação automática'
                  }
                </p>
              </div>

              {customerBalance && (
                <CashbackDisplay balance={customerBalance} className="my-6" />
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bairro *
                </label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={deliveryInfo.neighborhood}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 shadow-sm appearance-none bg-white ${
                      !deliveryInfo.neighborhood.trim() && showCheckout 
                        ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-purple-500'
                    }`}
                    required
                  >
                    <option value="">Selecione seu bairro</option>
                    {neighborhoods.map((neighborhood) => (
                      <option key={neighborhood.id} value={neighborhood.name}>
                        {neighborhood.name} - {formatPrice(neighborhood.delivery_fee)} ({neighborhood.delivery_time}min)
                      </option>
                    ))}
                  </select>
                  {!deliveryInfo.neighborhood.trim() && showCheckout && (
                    <p className="text-red-600 text-xs mt-1">Bairro é obrigatório</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Endereço completo *
                </label>
                <input
                  type="text"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 shadow-sm ${
                    !deliveryInfo.address.trim() && showCheckout 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="Rua, número, bairro"
                  required
                />
                {!deliveryInfo.address.trim() && showCheckout && (
                  <p className="text-red-600 text-xs mt-1">Endereço é obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Complemento
                </label>
                <input
                  type="text"
                  value={deliveryInfo.complement}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, complement: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                  placeholder="Apartamento, bloco, etc."
                />
              </div>

              {customerBalance && customerBalance.available_balance > 0 && (
                <CashbackButton
                  availableBalance={customerBalance.available_balance}
                  onApplyCashback={handleApplyCashback}
                  onRemoveCashback={handleRemoveCashback}
                  appliedAmount={appliedCashback}
                  disabled={disabled}
                  maxAmount={getSubtotal()}
                />
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-5 space-y-4 bg-white sticky bottom-0 shadow-md">
            {showCheckout && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal dos itens:</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                {getDeliveryFee() > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Taxa de entrega:</span>
                    <span className="font-medium">{formatPrice(getDeliveryFee())}</span>
                  </div>
                )}
                {appliedCashback > 0 && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Desconto cashback:</span>
                    <span className="font-medium">-{formatPrice(appliedCashback)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 my-2 pt-2"></div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-gray-800">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                {showCheckout ? formatPrice(getTotalWithCashback()) : formatPrice(totalPrice)}
              </span>
            </div>
            
            {!showCheckout ? (
              <div className="space-y-3">
                <button
                  onClick={() => setShowCheckout(true)}
                  disabled={disabled}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  {disabled ? 'Loja Fechada' : 'Finalizar Pedido'}
                </button>
                <button
                  onClick={handleContinueShopping}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Continuar Comprando
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleSendOrder}
                  disabled={disabled || !isCashRegisterOpen || !isFormValid()}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <MessageCircle size={20} />
                  {disabled ? 'Loja Fechada' : !isCashRegisterOpen ? 'Caixa Fechado' : 'Finalizar Pedido'}
                </button>
                
                {!isCashRegisterOpen && !disabled && (
                  <div className="text-xs text-red-600 text-center mt-2 bg-red-50 p-2 rounded-lg">
                    Não é possível finalizar pedidos sem um caixa aberto
                  </div>
                )}
                
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <ArrowLeft size={18} />
                  Voltar ao Carrinho
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editingItem && (
        <ProductModal
          product={editingItem.product}
          isOpen={true}
          onClose={() => setEditingItem(null)}
          onAddToCart={handleSaveEditedItem}
          initialSize={editingItem.selectedSize}
          initialQuantity={editingItem.quantity}
          initialObservations={editingItem.observations}
          initialComplements={editingItem.selectedComplements}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default Cart;