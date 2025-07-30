import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Package, Truck, RefreshCw, Clock, DollarSign, User, ShoppingCart } from 'lucide-react';

interface SalesHistoryProps {
  storeId?: 1 | 2;
  className?: string;
}

interface SaleItem {
  id: string;
  type: 'delivery' | 'pdv' | 'table';
  saleNumber?: number;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  paymentType: string;
  products: string[];
  createdAt: string;
  status?: string;
  channel?: string;
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ storeId = 1, className = '' }) => {
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Today
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'money': 'Dinheiro',
      'pix': 'PIX',
      'card': 'Cartão',
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão Crédito',
      'cartao_debito': 'Cartão Débito',
      'voucher': 'Voucher',
      'misto': 'Misto'
    };
    return methods[method] || method;
  };

  const loadSalesHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        
        // Mock data for demonstration
        const mockSales: SaleItem[] = [
          {
            id: '1',
            type: 'delivery',
            customerName: 'João Silva',
            customerPhone: '(85) 99999-9999',
            totalAmount: 25.90,
            paymentType: 'pix',
            products: ['Açaí 500ml', 'Granola', 'Morango'],
            createdAt: new Date().toISOString(),
            status: 'delivered'
          },
          {
            id: '2',
            type: 'pdv',
            saleNumber: 123,
            customerName: 'Maria Santos',
            totalAmount: 18.50,
            paymentType: 'dinheiro',
            products: ['Açaí 300ml', 'Leite Condensado'],
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        
        setSales(mockSales);
        setLoading(false);
        return;
      }

      console.log('🔄 Carregando histórico de vendas para', storeId === 1 ? 'Loja 1' : 'Loja 2', 'data:', dateFilter);
      
      const allSales: SaleItem[] = [];

      // 1. Buscar pedidos de delivery (apenas para Loja 1)
      if (storeId === 1) {
        const { data: deliveryOrders, error: deliveryError } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', `${dateFilter}T00:00:00`)
          .lte('created_at', `${dateFilter}T23:59:59`)
          .order('created_at', { ascending: false });

        if (deliveryError) {
          console.error('❌ Erro ao buscar pedidos de delivery:', deliveryError);
        } else {
          deliveryOrders?.forEach(order => {
            const products = order.items?.map((item: any) => item.product_name) || ['Pedido sem itens'];
            allSales.push({
              id: order.id,
              type: 'delivery',
              customerName: order.customer_name,
              customerPhone: order.customer_phone,
              totalAmount: order.total_price,
              paymentType: order.payment_method,
              products,
              createdAt: order.created_at,
              status: order.status,
              channel: order.channel
            });
          });
        }
      }

      // 2. Buscar vendas do PDV
      const pdvTableName = storeId === 1 ? 'pdv_sales' : 'store2_sales';
      const pdvItemsTableName = storeId === 1 ? 'pdv_sale_items' : 'store2_sale_items';
      
      const { data: pdvSales, error: pdvError } = await supabase
        .from(pdvTableName)
        .select(`
          *,
          ${pdvItemsTableName}(*)
        `)
        .gte('created_at', `${dateFilter}T00:00:00`)
        .lte('created_at', `${dateFilter}T23:59:59`)
        .eq('is_cancelled', false)
        .order('created_at', { ascending: false });

      if (pdvError) {
        console.error('❌ Erro ao buscar vendas do PDV:', pdvError);
      } else {
        pdvSales?.forEach(sale => {
          const items = sale[pdvItemsTableName] || [];
          const products = items.map((item: any) => item.product_name) || ['Venda sem itens'];
          allSales.push({
            id: sale.id,
            type: 'pdv',
            saleNumber: sale.sale_number,
            customerName: sale.customer_name || 'Cliente não informado',
            customerPhone: sale.customer_phone,
            totalAmount: sale.total_amount,
            paymentType: sale.payment_type,
            products,
            createdAt: sale.created_at,
            channel: sale.channel
          });
        });
      }

      // 3. Buscar vendas de mesa (se houver)
      const tableTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      const tableItemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
      
      const { data: tableSales, error: tableError } = await supabase
        .from(tableTableName)
        .select(`
          *,
          ${tableItemsTableName}(*)
        `)
        .gte('created_at', `${dateFilter}T00:00:00`)
        .lte('created_at', `${dateFilter}T23:59:59`)
        .eq('status', 'fechada')
        .order('created_at', { ascending: false });

      if (tableError) {
        console.error('❌ Erro ao buscar vendas de mesa:', tableError);
      } else {
        tableSales?.forEach(sale => {
          const items = sale[tableItemsTableName] || [];
          const products = items.map((item: any) => item.product_name) || ['Venda de mesa sem itens'];
          allSales.push({
            id: sale.id,
            type: 'table',
            saleNumber: sale.sale_number,
            customerName: sale.customer_name || 'Mesa sem nome',
            totalAmount: sale.total_amount,
            paymentType: sale.payment_type,
            products,
            createdAt: sale.created_at
          });
        });
      }

      // Sort all sales by creation date (newest first)
      allSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setSales(allSales);
      console.log(`✅ ${allSales.length} vendas carregadas para ${dateFilter}`);

    } catch (err) {
      console.error('❌ Erro ao carregar histórico:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, storeId]);

  useEffect(() => {
    loadSalesHistory();
  }, [loadSalesHistory]);

  const getSaleIcon = (type: string) => {
    switch (type) {
      case 'delivery':
        return <Truck size={16} className="text-blue-600" />;
      case 'table':
        return <User size={16} className="text-purple-600" />;
      default:
        return <ShoppingCart size={16} className="text-green-600" />;
    }
  };

  const getSaleTypeLabel = (sale: SaleItem) => {
    switch (sale.type) {
      case 'delivery':
        return 'Delivery';
      case 'table':
        return `Mesa ${sale.saleNumber ? `#${sale.saleNumber}` : ''}`;
      default:
        return `PDV ${sale.saleNumber ? `#${sale.saleNumber}` : ''}`;
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const salesCount = sales.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={24} className="text-purple-600" />
            Histórico de Vendas - {storeId === 1 ? 'Loja 1' : 'Loja 2'}
          </h2>
          <p className="text-gray-600">
            {salesCount} venda(s) • Total: {formatPrice(totalSales)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          
          <button
            onClick={loadSalesHistory}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando histórico de vendas...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <Package size={48} className="mx-auto text-red-300 mb-4" />
            <p className="text-red-600 mb-2">Erro ao carregar histórico</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma venda encontrada</p>
            <p className="text-gray-400 text-sm">
              Não há vendas para {new Date(dateFilter).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sales.map((sale) => (
              <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-gray-100 rounded-full p-2 flex-shrink-0">
                      {getSaleIcon(sale.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">
                          {getSaleTypeLabel(sale)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {sale.status === 'delivered' ? 'Entregue' :
                           sale.status === 'cancelled' ? 'Cancelado' :
                           sale.status === 'pending' ? 'Pendente' :
                           sale.status || 'Concluído'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-4">
                          <span>{sale.customerName}</span>
                          {sale.customerPhone && (
                            <span className="text-gray-500">{sale.customerPhone}</span>
                          )}
                          <span className="text-gray-500">
                            {formatDateTime(sale.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-700 font-medium mb-1">Produtos vendidos:</p>
                        <div className="flex flex-wrap gap-1">
                          {sale.products.slice(0, 3).map((product, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              {product}
                            </span>
                          ))}
                          {sale.products.length > 3 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{sale.products.length - 3} mais
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {formatPrice(sale.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getPaymentMethodName(sale.paymentType)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {sales.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  Total do Dia: {formatPrice(totalSales)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  {salesCount} venda(s)
                </span>
              </div>
            </div>
            
            {salesCount > 0 && (
              <div className="text-sm text-purple-700">
                Ticket médio: {formatPrice(totalSales / salesCount)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;