import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Package, Clock, RefreshCw } from 'lucide-react';

interface SalesHistoryProps {
  storeId: number; // 1 para Loja 1, 2 para Loja 2
}

interface SalesItem {
  product_name: string;
  quantity: number;
  total_amount: number;
  sale_time: string;
  channel: string; // 'pdv', 'delivery', 'loja2'
  sale_number?: number;
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ storeId }) => {
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week'>('today');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'delivery': return '🚚 Delivery';
      case 'pdv': return '🏪 PDV';
      case 'loja2': return '🏪 Loja 2';
      default: return '📦 Venda';
    }
  };

  const fetchSalesHistory = async () => {
    try {
      setLoading(true);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        // Dados de demonstração
        setSalesItems([
          {
            product_name: 'Açaí 500ml',
            quantity: 2,
            total_amount: 45.98,
            sale_time: new Date().toISOString(),
            channel: storeId === 1 ? 'pdv' : 'loja2',
            sale_number: 123
          },
          {
            product_name: 'Combo Casal',
            quantity: 1,
            total_amount: 49.99,
            sale_time: new Date(Date.now() - 3600000).toISOString(),
            channel: 'delivery'
          }
        ]);
        setLoading(false);
        return;
      }

      const now = new Date();
      const startDate = timeFilter === 'today' 
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

      const items: SalesItem[] = [];

      if (storeId === 1) {
        // Buscar vendas PDV da Loja 1
        const { data: pdvSales } = await supabase
          .from('pdv_sales')
          .select(`
            sale_number,
            created_at,
            pdv_sale_items!inner(
              product_name,
              quantity,
              subtotal
            )
          `)
          .gte('created_at', startDate.toISOString())
          .eq('is_cancelled', false)
          .order('created_at', { ascending: false })
          .limit(20);

        if (pdvSales) {
          pdvSales.forEach(sale => {
            sale.pdv_sale_items.forEach(item => {
              items.push({
                product_name: item.product_name,
                quantity: item.quantity,
                total_amount: item.subtotal,
                sale_time: sale.created_at,
                channel: 'pdv',
                sale_number: sale.sale_number
              });
            });
          });
        }

        // Buscar pedidos de delivery da Loja 1
        const { data: deliveryOrders } = await supabase
          .from('orders')
          .select('items, total_price, created_at')
          .gte('created_at', startDate.toISOString())
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false })
          .limit(20);

        if (deliveryOrders) {
          deliveryOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach(item => {
                items.push({
                  product_name: item.product_name,
                  quantity: item.quantity,
                  total_amount: item.total_price,
                  sale_time: order.created_at,
                  channel: 'delivery'
                });
              });
            }
          });
        }
      } else {
        // Buscar vendas da Loja 2
        const { data: store2Sales } = await supabase
          .from('store2_sales')
          .select(`
            sale_number,
            created_at,
            store2_sale_items!inner(
              product_name,
              quantity,
              subtotal
            )
          `)
          .gte('created_at', startDate.toISOString())
          .eq('is_cancelled', false)
          .order('created_at', { ascending: false })
          .limit(20);

        if (store2Sales) {
          store2Sales.forEach(sale => {
            sale.store2_sale_items.forEach(item => {
              items.push({
                product_name: item.product_name,
                quantity: item.quantity,
                total_amount: item.subtotal,
                sale_time: sale.created_at,
                channel: 'loja2',
                sale_number: sale.sale_number
              });
            });
          });
        }
      }

      // Ordenar por horário mais recente
      items.sort((a, b) => new Date(b.sale_time).getTime() - new Date(a.sale_time).getTime());
      
      setSalesItems(items.slice(0, 10)); // Mostrar apenas os 10 mais recentes

    } catch (error) {
      console.error('Erro ao carregar histórico de vendas:', error);
      setSalesItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesHistory();
  }, [storeId, timeFilter]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-600" />
          Histórico de Vendas
        </h3>
        
        <div className="flex items-center gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as 'today' | 'week')}
            className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="today">Hoje</option>
            <option value="week">7 dias</option>
          </select>
          
          <button
            onClick={fetchSalesHistory}
            disabled={loading}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Atualizar histórico"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Carregando histórico...</p>
        </div>
      ) : salesItems.length === 0 ? (
        <div className="text-center py-4">
          <Package size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Nenhuma venda encontrada</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {salesItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-800 text-sm">{item.product_name}</h4>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                    {getChannelLabel(item.channel)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Package size={12} />
                    Qtd: {item.quantity}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(item.sale_time)}
                  </span>
                  {item.sale_number && (
                    <span>#{item.sale_number}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600 text-sm">
                  {formatPrice(item.total_amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesHistory;