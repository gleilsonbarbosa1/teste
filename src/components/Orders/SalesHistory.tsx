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
  const [timeFilter, setTimeFilter] = useState<'today'>('today');

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

      // Sempre buscar apenas do dia atual
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
      
      setSalesItems(items.slice(0, 8)); // Mostrar apenas os 8 mais recentes

    } catch (error) {
      console.error('Erro ao carregar histórico de vendas:', error);
      setSalesItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesHistory();
  }, [storeId]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-3 shadow-lg">
            <TrendingUp size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Histórico de Vendas do Dia</h3>
            <p className="text-sm text-gray-600">Produtos vendidos hoje</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium text-green-700">📅 Hoje</span>
          </div>
          <button
            onClick={fetchSalesHistory}
            disabled={loading}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 p-2 rounded-lg transition-all duration-200 hover:shadow-md"
            title="Atualizar histórico"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Carregando histórico...</p>
          <p className="text-sm text-gray-500">Buscando vendas do dia</p>
        </div>
      ) : salesItems.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <div className="relative mb-4">
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <Package size={32} className="text-gray-500" />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma venda hoje</h4>
          <p className="text-gray-500">Quando houver vendas, elas aparecerão aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {salesItems.map((item, index) => (
            <div
              key={index}
              className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-800 text-base group-hover:text-green-700 transition-colors">
                      {item.product_name}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                      {getChannelLabel(item.channel)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1">
                      <Package size={14} className="text-gray-500" />
                      <span className="font-medium">Qtd: {item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-50 rounded-lg px-2 py-1">
                      <Clock size={14} className="text-blue-500" />
                      <span className="font-medium">{formatTime(item.sale_time)}</span>
                    </div>
                    {item.sale_number && (
                      <div className="bg-purple-50 rounded-lg px-2 py-1">
                        <span className="text-purple-700 font-mono text-xs">#{item.sale_number}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg px-3 py-2 shadow-md">
                    <p className="font-bold text-lg leading-none">
                      {formatPrice(item.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Summary Footer */}
      {salesItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Resumo do Dia</p>
                <p className="text-xs text-green-600">{salesItems.length} produto(s) vendido(s)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-700">
                {formatPrice(salesItems.reduce((sum, item) => sum + item.total_amount, 0))}
              </p>
              <p className="text-xs text-green-600">Total em vendas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;