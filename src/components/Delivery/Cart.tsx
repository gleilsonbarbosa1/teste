import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeliveryAuth } from '../../hooks/useDeliveryAuth';
import { useDeliveryOrders } from '../../hooks/useDeliveryOrders';
import { DeliveryOrder } from '../../types/delivery-driver';
import DeliveryOrderCard from '../DeliveryDriver/DeliveryOrderCard';
import { 
  Truck, 
  RefreshCw, 
  LogOut, 
  Package,
  User,
  AlertCircle,
  Clock
} from 'lucide-react';

<<<<<<< HEAD
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
=======
const DeliveryOrdersPage: React.FC = () => {
  const { user, signOut } = useDeliveryAuth();
  const { orders, loading, error, refetch } = useDeliveryOrders();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [overdueCount, setOverdueCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [deliveryStats, setDeliveryStats] = useState({
    totalDeliveries: 0,
    totalFees: 0,
    averageFee: 0,
    completedDeliveries: 0
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
>>>>>>> e94bc7c (atualizaçoes delivery)

    return () => clearInterval(timer);
  }, []);

  // Auto refresh orders every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-atualizando pedidos...');
      refetch();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [autoRefresh, refetch]);

  // Update last refresh time when orders change
  useEffect(() => {
    setLastRefresh(new Date());
  }, [orders]);

  // Calculate overdue orders
  useEffect(() => {
    const now = new Date();
    const overdue = orders.filter(order => {
      const orderTime = new Date(order.created_at);
      const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
      return diffMinutes > 20;
    }).length;
    
    setOverdueCount(overdue);
  }, [orders, currentTime]);

  // Calculate delivery statistics
  useEffect(() => {
    // Usar apenas pedidos não cancelados da semana atual
    const weekOrders = orders.filter(order => order.status !== 'cancelled');
    
    const completedOrders = weekOrders.filter(order => 
      order.status === 'delivered'
    );
    
    const totalFees = weekOrders.reduce((sum, order) => 
      sum + (order.delivery_fee || 0), 0
    );
    
    const completedFees = completedOrders.reduce((sum, order) => 
      sum + (order.delivery_fee || 0), 0
    );
    
    setDeliveryStats({
      totalDeliveries: weekOrders.length,
      totalFees: completedFees,
      averageFee: completedOrders.length > 0 ? completedFees / completedOrders.length : 0,
      completedDeliveries: completedOrders.length
    });
  }, [orders]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    if (!autoRefresh) {
      // If enabling auto-refresh, refresh immediately
      refetch();
      setLastRefresh(new Date());
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handlePrint = (order: DeliveryOrder) => {
    // Create print window with order details
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    const getPaymentMethodLabel = (method: string) => method === 'money' ? 'Dinheiro' : method === 'pix' ? 'PIX' : method === 'card' ? 'Cartão' : method;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pedido #${order.id.slice(-8)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: black !important; background: white !important; }
          body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; padding: 2mm; width: 76mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .separator { border-bottom: 1px dashed black; margin: 5px 0; padding-bottom: 5px; }
          .flex-between { display: flex; justify-content: space-between; align-items: center; }
          .mb-1 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 5px; }
          .mb-3 { margin-bottom: 8px; }
          .ml-2 { margin-left: 8px; }
        </style>
      </head>
      <body>
        <div class="center mb-3 separator">
          <div class="bold" style="font-size: 16px;">ELITE AÇAÍ</div>
          <div class="small">Pedido para Entrega</div>
          <div class="small">Tel: (85) 98904-1010</div>
        </div>
        
        <div class="mb-3 separator">
          <div class="bold center mb-2">=== PEDIDO #${order.id.slice(-8)} ===</div>
          <div class="small">Data: ${new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
          <div class="small">Hora: ${new Date(order.created_at).toLocaleTimeString('pt-BR')}</div>
        </div>
        
        <div class="mb-3 separator">
          <div class="bold mb-1">CLIENTE:</div>
          <div class="small">Nome: ${order.customer_name}</div>
          <div class="small">Telefone: ${order.customer_phone}</div>
          <div class="small">Endereço: ${order.customer_address}</div>
          <div class="small">Bairro: ${order.customer_neighborhood}</div>
          ${order.customer_complement ? `<div class="small">Complemento: ${order.customer_complement}</div>` : ''}
        </div>
        
        <div class="mb-3 separator">
          <div class="bold mb-1">ITENS:</div>
          ${order.items.map((item, index) => `
            <div class="mb-2">
              <div class="bold">${item.product_name}</div>
              ${item.selected_size ? `<div class="small">Tamanho: ${item.selected_size}</div>` : ''}
              <div class="flex-between">
                <span class="small">${item.quantity}x ${formatPrice(item.unit_price)}</span>
                <span class="small">${formatPrice(item.total_price)}</span>
              </div>
              ${item.complements.length > 0 ? `
                <div class="ml-2">
                  <div class="small">Complementos:</div>
                  ${item.complements.map(comp => `
                    <div class="small ml-2">• ${comp.name}${comp.price > 0 ? ` (+${formatPrice(comp.price)})` : ''}</div>
                  `).join('')}
                </div>
              ` : ''}
              ${item.observations ? `<div class="small ml-2">Obs: ${item.observations}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="mb-3 separator">
          <div class="bold mb-1">TOTAL:</div>
          <div class="flex-between bold">
            <span>VALOR:</span>
            <span>${formatPrice(order.total_price)}</span>
          </div>
        </div>
        
        <div class="mb-3 separator">
          <div class="bold mb-1">PAGAMENTO:</div>
          <div class="small">Forma: ${getPaymentMethodLabel(order.payment_method)}</div>
          ${order.change_for ? `<div class="small">Troco para: ${formatPrice(order.change_for)}</div>` : ''}
        </div>
        
        <div class="center small">
          <div class="bold mb-2">Elite Açaí</div>
          <div>Entrega confirmada</div>
          <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
        </div>
      </body>
      </html>
    `;

<<<<<<< HEAD
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

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'money': return 'Dinheiro';
      case 'pix': return 'PIX (85989041010)';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      default: return method;
    }
  };

  const generateWhatsAppMessage = (orderId?: string, cashbackEarned?: number) => {
    let message = `🥤 *PEDIDO ELITE AÇAÍ*\n\n`;
=======
    printWindow.document.write(printContent);
    printWindow.document.close();
>>>>>>> e94bc7c (atualizaçoes delivery)
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const handleWhatsApp = (order: DeliveryOrder) => {
    const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    const getPaymentMethodLabel = (method: string) => method === 'money' ? 'Dinheiro' : method === 'pix' ? 'PIX' : method === 'card' ? 'Cartão' : method;

    let message = `🚚 *ENTREGA - ELITE AÇAÍ*\n\n`;
    message += `📋 *Pedido #${order.id.slice(-8)}*\n`;
    message += `👤 Cliente: ${order.customer_name}\n`;
    message += `📱 Telefone: ${order.customer_phone}\n`;
    message += `📍 Endereço: ${order.customer_address}, ${order.customer_neighborhood}\n`;
    if (order.customer_complement) {
      message += `🏠 Complemento: ${order.customer_complement}\n`;
    }
    message += `\n`;

    message += `🛒 *ITENS:*\n`;
    order.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      if (item.selected_size) {
        message += `   Tamanho: ${item.selected_size}\n`;
      }
      message += `   Qtd: ${item.quantity}x - ${formatPrice(item.total_price)}\n`;
      
      if (item.complements.length > 0) {
        message += `   Complementos:\n`;
        item.complements.forEach(comp => {
          message += `   • ${comp.name}`;
          if (comp.price > 0) {
            message += ` (+${formatPrice(comp.price)})`;
          }
          message += `\n`;
        });
      }
      
      if (item.observations) {
        message += `   Obs: ${item.observations}\n`;
      }
      message += `\n`;
    });

    message += `💰 *TOTAL: ${formatPrice(order.total_price)}*\n`;
    message += `💳 Pagamento: ${getPaymentMethodLabel(order.payment_method)}\n`;
    if (order.change_for) {
      message += `💵 Troco para: ${formatPrice(order.change_for)}\n`;
    }
    message += `\n`;

    message += `📍 *LOCALIZAÇÃO:*\n`;
    const fullAddress = `${order.customer_address}, ${order.customer_neighborhood}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    message += `https://www.google.com/maps/search/?api=1&query=${encodedAddress}\n\n`;

    message += `🕐 Pedido feito em: ${new Date(order.created_at).toLocaleString('pt-BR')}\n\n`;
    message += `Amanda Suyelen da Costa Pereira - Elite Açaí - Entrega confirmada! 🍧`;

    const phoneNumber = order.customer_phone.replace(/\D/g, '');
    const phoneWithCountryCode = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
    
    window.open(`https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Função para obter informações da semana atual
  const getWeekInfo = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    // Calcular início da semana (segunda às 10h)
    let daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    if (currentDay === 1 && currentHour < 10) {
      daysToSubtract = 7;
    }
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    weekStart.setHours(10, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
      start: weekStart,
      end: weekEnd,
      isNewWeekSoon: currentDay === 1 && currentHour >= 9 && currentHour < 10
    };
  };

  const weekInfo = getWeekInfo();

<<<<<<< HEAD
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
=======
  if (loading) {
>>>>>>> e94bc7c (atualizaçoes delivery)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Truck size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Portal do Entregador</h1>
                <p className="text-sm sm:text-base text-gray-600">Pedidos confirmados para entrega</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {user && (
                <div className="flex items-center gap-2 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm">
                  <User size={18} className="text-gray-600" />
                  <span className="font-medium text-gray-700 truncate max-w-32 sm:max-w-none">
                    {user.user_metadata?.name || user.email}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={toggleAutoRefresh}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm flex-1 sm:flex-none ${
                    autoRefresh 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                  title={autoRefresh ? 'Desativar atualização automática' : 'Ativar atualização automática'}
                >
                  <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="hidden sm:inline">{autoRefresh ? 'Auto' : 'Manual'}</span>
                </button>
                
                <button
                  onClick={refetch}
                  disabled={loading}
                  className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm flex-1 sm:flex-none"
                  title="Atualizar pedidos manualmente"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1 sm:gap-2 bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm flex-1 sm:flex-none"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Delivery Earnings Summary */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Ganhos da Semana
              </h2>
              <p className="text-green-100 text-sm">
                {weekInfo.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a {weekInfo.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                {weekInfo.isNewWeekSoon && (
                  <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                    ⏰ Nova semana em breve!
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(deliveryStats.totalFees)}
              </p>
              <p className="text-green-100 text-sm">Total em Taxas</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{deliveryStats.totalDeliveries}</p>
              <p className="text-green-100 text-sm">Pedidos Semana</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{deliveryStats.completedDeliveries}</p>
              <p className="text-green-100 text-sm">Entregues</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-lg font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(deliveryStats.averageFee)}
              </p>
              <p className="text-green-100 text-sm">Taxa Média</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-lg font-bold">
                {deliveryStats.totalDeliveries > 0 
                  ? Math.round((deliveryStats.completedDeliveries / deliveryStats.totalDeliveries) * 100)
                  : 0}%
              </p>
              <p className="text-green-100 text-sm">Taxa Entrega</p>
            </div>
          </div>
          
          {deliveryStats.totalDeliveries > 0 && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso da Semana:</span>
                <span>{deliveryStats.completedDeliveries} de {deliveryStats.totalDeliveries} pedidos</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ 
                    width: `${deliveryStats.totalDeliveries > 0 
                      ? (deliveryStats.completedDeliveries / deliveryStats.totalDeliveries) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Informação sobre o ciclo semanal */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span>📅 Ciclo Semanal:</span>
              <span>Segunda 10h → Segunda 10h</span>
            </div>
            <div className="text-xs text-green-100 mt-1">
              {weekInfo.isNewWeekSoon 
                ? '⏰ Nova semana começa em breve (Segunda 10h)'
                : 'Semana atual em andamento'
              }
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
              <Package size={24} className="text-green-600" />
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Pedidos da Semana
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {orders.length} pedido(s) confirmados nesta semana
                </p>
                <p className="text-xs text-gray-500">
                  📅 {weekInfo.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} 10h → {weekInfo.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} 10h
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500">
                    Última atualização: {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {autoRefresh && (
                    <span className="text-xs text-green-600 font-medium">
                      • Auto (30s)
                    </span>
                  )}
                </div>
<<<<<<< HEAD
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
                          value="card"
                          checked={deliveryInfo.paymentMethod === 'card'}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                          className="text-purple-600 h-5 w-5"
                        />
                        <div className="flex items-center gap-2">
                          <CreditCard size={20} className="text-purple-600" />
                          <span className="font-medium">Cartão</span>
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

=======
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Total Orders */}
              <div className="text-center sm:text-right">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {orders.length}
                </p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              
              {/* Overdue Orders */}
              {overdueCount > 0 && (
                <div className="text-center sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {overdueCount}
                  </p>
                  <p className="text-sm text-red-500">Urgentes</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Overdue Alert */}
          {overdueCount > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600" />
                <p className="text-sm font-medium text-red-800">
                  ⚠️ {overdueCount} pedido(s) há mais de 20 minutos aguardando entrega!
                </p>
                </div>
                {autoRefresh && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Monitorando</span>
                  </div>
                )}
              </div>
>>>>>>> e94bc7c (atualizaçoes delivery)
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <div>
                <h3 className="text-sm sm:text-base font-medium text-red-800">Erro ao carregar pedidos</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
<<<<<<< HEAD
            
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
=======
>>>>>>> e94bc7c (atualizaçoes delivery)
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4 sm:space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">
                Pedidos da Semana Atual
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                {orders.length} pedido(s) desta semana
              </p>
              <p className="text-xs text-gray-400 mt-2">
                📅 Semana: {weekInfo.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a {weekInfo.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </p>
              {autoRefresh && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Verificando novos pedidos automaticamente a cada 30s</span>
                </div>
              )}
            </div>
          ) : (
            orders
              .sort((a, b) => {
                // Sort by urgency first (overdue orders first), then by creation time
                const now = new Date();
                const aTime = new Date(a.created_at);
                const bTime = new Date(b.created_at);
                const aMinutes = Math.floor((now.getTime() - aTime.getTime()) / (1000 * 60));
                const bMinutes = Math.floor((now.getTime() - bTime.getTime()) / (1000 * 60));
                
                const aOverdue = aMinutes > 20;
                const bOverdue = bMinutes > 20;
                
                // Overdue orders first
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;
                
                // Then by creation time (oldest first)
                return aTime.getTime() - bTime.getTime();
              })
              .map(order => (
              <DeliveryOrderCard
                key={order.id}
                order={order}
                onPrint={handlePrint}
                onWhatsApp={handleWhatsApp}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrdersPage;