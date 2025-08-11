import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ShoppingBag, 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  Package,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';

interface Sale {
  id: string;
  sale_number: number;
  operator_name?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_type: string;
  change_amount: number;
  is_cancelled: boolean;
  created_at: string;
  channel: string;
  source: 'pdv' | 'table';
  table_number?: number;
  items?: SaleItem[];
}

interface SaleItem {
  id: string;
  product_name: string;
  quantity: number;
  weight_kg?: number;
  unit_price?: number;
  price_per_gram?: number;
  subtotal: number;
}

interface SalesHistoryPanelProps {
  storeId: 1 | 2;
}

const SalesHistoryPanel: React.FC<SalesHistoryPanelProps> = ({ storeId }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  const salesTable = storeId === 1 ? 'pdv_sales' : 'store2_sales';
  const itemsTable = storeId === 1 ? 'pdv_sale_items' : 'store2_sale_items';
  const tableSalesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const tableItemsTable = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
  const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabaseConfigured) {
        console.warn(`⚠️ Supabase não configurado - usando dados de demonstração para Loja ${storeId}`);
        
        // Mock data for demonstration
        const mockSales: Sale[] = [
          {
            id: '1',
            sale_number: 1001,
            operator_name: 'Administrador',
            customer_name: 'João Silva',
            customer_phone: '(85) 99999-9999',
            subtotal: 25.90,
            discount_amount: 0,
            total_amount: 25.90,
            payment_type: 'dinheiro',
            change_amount: 0,
            is_cancelled: false,
            created_at: new Date().toISOString(),
            channel: storeId === 1 ? 'pdv' : 'loja2',
            source: 'pdv',
            items: [
              {
                id: '1',
                product_name: 'Açaí 500ml',
                quantity: 1,
                unit_price: 25.90,
                subtotal: 25.90
              }
            ]
          },
          {
            id: '2',
            sale_number: 1002,
            operator_name: 'Operador',
            customer_name: 'Maria Santos',
            customer_phone: '(85) 88888-8888',
            subtotal: 18.50,
            discount_amount: 2.00,
            total_amount: 16.50,
            payment_type: 'pix',
            change_amount: 0,
            is_cancelled: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            channel: storeId === 1 ? 'pdv' : 'loja2',
            source: 'pdv',
            items: [
              {
                id: '2',
                product_name: 'Açaí 300ml',
                quantity: 1,
                unit_price: 18.50,
                subtotal: 18.50
              }
            ]
          },
          {
            id: '3',
            sale_number: 1003,
            operator_name: 'Administrador',
            customer_name: 'Pedro Costa',
            customer_phone: '(85) 77777-7777',
            subtotal: 42.99,
            discount_amount: 0,
            total_amount: 42.99,
            payment_type: 'cartao_credito',
            change_amount: 0,
            is_cancelled: false,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            channel: storeId === 1 ? 'pdv' : 'loja2',
            source: 'pdv',
            items: [
              {
                id: '3',
                product_name: 'Combo 4 (900g)',
                quantity: 1,
                unit_price: 42.99,
                subtotal: 42.99
              }
            ]
          },
          {
            id: '4',
            sale_number: 2001,
            operator_name: 'Atendente',
            customer_name: 'Ana Oliveira',
            customer_phone: '',
            subtotal: 31.50,
            discount_amount: 0,
            total_amount: 31.50,
            payment_type: 'dinheiro',
            change_amount: 0,
            is_cancelled: false,
            created_at: new Date(Date.now() - 1800000).toISOString(),
            channel: 'mesa',
            source: 'table',
            table_number: 5,
            items: [
              {
                id: '4',
                product_name: 'Açaí 700ml',
                quantity: 1,
                unit_price: 31.50,
                subtotal: 31.50
              }
            ]
          }
        ];
        
        setSales(mockSales);
        setLoading(false);
        return;
      }

      console.log(`🔄 Carregando vendas da Loja ${storeId} para ${dateFilter}...`);

      // Buscar vendas do PDV
      const { data: pdvSales, error: pdvError } = await supabase
        .from(salesTable)
        .select(`
          *,
          ${itemsTable}(*)
        `)
        .gte('created_at', `${dateFilter}T00:00:00`)
        .lte('created_at', `${dateFilter}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (pdvError) throw pdvError;

      // Buscar vendas das mesas
      const { data: tableSales, error: tableError } = await supabase
        .from(tableSalesTable)
        .select(`
          *,
          ${tableItemsTable}(*),
          ${tablesTable}!table_id(number)
        `)
        .gte('created_at', `${dateFilter}T00:00:00`)
        .lte('created_at', `${dateFilter}T23:59:59`)
        .eq('status', 'fechada')
        .order('created_at', { ascending: false })
        .limit(50);

      if (tableError) {
        console.warn('Erro ao carregar vendas das mesas:', tableError);
      }

      // Combinar vendas do PDV e das mesas
      const allSales: Sale[] = [];

      // Adicionar vendas do PDV
      if (pdvSales) {
        pdvSales.forEach(sale => {
          allSales.push({
            ...sale,
            source: 'pdv',
            items: sale[itemsTable] || []
          });
        });
      }

      // Adicionar vendas das mesas
      if (tableSales) {
        tableSales.forEach(sale => {
          allSales.push({
            ...sale,
            source: 'table',
            table_number: sale[tablesTable]?.number,
            channel: 'mesa',
            items: sale[tableItemsTable] || []
          });
        });
      }

      // Ordenar por data de criação (mais recente primeiro)
      allSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`✅ ${pdvSales?.length || 0} vendas PDV + ${tableSales?.length || 0} vendas de mesa carregadas da Loja ${storeId}`);
      setSales(allSales);
    } catch (err) {
      console.error(`❌ Erro ao carregar vendas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getPaymentMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return methodNames[method] || method;
  };

  const toggleSaleExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = searchTerm === '' || 
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_phone?.includes(searchTerm) ||
      sale.sale_number.toString().includes(searchTerm);
    
    const matchesPayment = paymentFilter === 'all' || sale.payment_type === paymentFilter;
    
    return matchesSearch && matchesPayment && !sale.is_cancelled;
  });

  const getTotalSales = () => {
    return filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  };

  const getSalesCount = () => {
    return filteredSales.length;
  };

  const getAverageTicket = () => {
    const count = getSalesCount();
    return count > 0 ? getTotalSales() / count : 0;
  };

  useEffect(() => {
    fetchSales();
  }, [dateFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando vendas da Loja {storeId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Modo Demonstração - Loja {storeId}</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Exibindo dados de demonstração.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingBag size={24} className="text-green-600" />
            Histórico de Vendas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Vendas realizadas no dia selecionado</p>
        </div>
        <button
          onClick={fetchSales}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, telefone ou número da venda..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="voucher">Voucher</option>
              <option value="misto">Pagamento Misto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(getTotalSales())}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quantidade</p>
              <p className="text-2xl font-bold text-blue-600">
                {getSalesCount()}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatPrice(getAverageTicket())}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Vendas do Dia ({filteredSales.length})
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(dateFilter).toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma venda encontrada
            </h3>
            <p className="text-gray-500">
              {searchTerm || paymentFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : `Nenhuma venda foi realizada na Loja ${storeId} no dia selecionado`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="p-4 hover:bg-gray-50">
                <div 
                  onClick={() => toggleSaleExpansion(sale.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 rounded-full p-2">
                      {sale.source === 'table' ? (
                        <Users size={20} className="text-green-600" />
                      ) : (
                        <ShoppingBag size={20} className="text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-800">
                          {sale.source === 'table' ? `Mesa ${sale.table_number} - Venda #${sale.sale_number}` : `Venda #${sale.sale_number}`}
                        </h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPaymentMethodName(sale.payment_type)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sale.source === 'table' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {sale.source === 'table' ? 'Mesa' : 'PDV'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{formatDateTime(sale.created_at)}</span>
                        </div>
                        {sale.customer_name && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{sale.customer_name}</span>
                          </div>
                        )}
                        {sale.operator_name && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>Op: {sale.operator_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Package size={14} />
                          <span>{sale.source === 'table' ? 'Venda Presencial' : 'Venda PDV'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(sale.total_amount)}
                      </p>
                      {sale.discount_amount > 0 && (
                        <p className="text-sm text-gray-500">
                          Desc: {formatPrice(sale.discount_amount)}
                        </p>
                      )}
                    </div>
                    {expandedSales.has(sale.id) ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedSales.has(sale.id) && (
                  <div className="mt-4 pl-12 border-l-2 border-gray-200">
                    <div className="space-y-3">
                      {/* Sale Details */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-800 mb-2">Detalhes da Venda</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="ml-2 font-medium">{formatPrice(sale.subtotal)}</span>
                          </div>
                          {sale.discount_amount > 0 && (
                            <div>
                              <span className="text-gray-600">Desconto:</span>
                              <span className="ml-2 font-medium text-red-600">-{formatPrice(sale.discount_amount)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-2 font-medium text-green-600">{formatPrice(sale.total_amount)}</span>
                          </div>
                          {sale.change_amount > 0 && (
                            <div>
                              <span className="text-gray-600">Troco:</span>
                              <span className="ml-2 font-medium">{formatPrice(sale.change_amount)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Canal:</span>
                            <span className="ml-2 font-medium capitalize">{sale.channel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      {sale.items && sale.items.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <h5 className="font-medium text-gray-800 mb-2">
                            Itens da Venda ({sale.items.length})
                          </h5>
                          <div className="space-y-2">
                            {sale.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between bg-white rounded p-2">
                                <div>
                                  <p className="font-medium text-gray-800">{item.product_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {item.weight_kg ? (
                                      `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg`
                                    ) : (
                                      `${item.quantity}x × ${formatPrice(item.unit_price || 0)}`
                                    )}
                                  </p>
                                </div>
                                <p className="font-semibold text-green-600">
                                  {formatPrice(item.subtotal)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Package size={14} />
                        <span>{sale.source === 'table' ? 'Venda Presencial' : 'Venda PDV'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistoryPanel;