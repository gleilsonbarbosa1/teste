import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter,
  Download,
  Eye,
  DollarSign,
  Package,
  Clock,
  User,
  Printer
} from 'lucide-react';
import { PDVOperator } from '../../types/pdv';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';

interface SalesHistoryPanelProps {
  storeId: number;
  operator?: PDVOperator;
}

interface Sale {
  id: string;
  sale_number: number;
  operator_name: string;
  customer_name?: string;
  total_amount: number;
  payment_type: string;
  created_at: string;
  items_count: number;
  is_cancelled: boolean;
  channel?: string;
}

export const SalesHistoryPanel: React.FC<SalesHistoryPanelProps> = ({ storeId, operator }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const { hasPermission } = usePermissions(operator);

  const handlePrintReceipt = (sale: Sale) => {
    // Criar uma nova janela com conteúdo específico para impressão térmica
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
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            color: black !important;
            background: white !important;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            color: black;
            background: white;
            padding: 2mm;
            width: 76mm;
          }
          
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .separator { 
            border-bottom: 1px dashed black; 
            margin: 5px 0; 
            padding-bottom: 5px; 
          }
          .flex-between { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
          }
          .mb-1 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 5px; }
          .mb-3 { margin-bottom: 8px; }
          .ml-2 { margin-left: 8px; }
        </style>
      </head>
      <body>
        <!-- Cabeçalho -->
        <div class="center mb-3 separator">
          <div class="bold" style="font-size: 16px;">ELITE AÇAÍ</div>
          <div class="small">Comprovante de Venda</div>
          <div class="small">Rua Um, 1614-C</div>
          <div class="small">Residencial 1 - Cágado</div>
          <div class="small">Tel: (85) 98904-1010</div>
          <div class="small">CNPJ: 38.130.139/0001-22</div>
        </div>
        
        <!-- Dados da Venda -->
        <div class="mb-3 separator">
          <div class="bold center mb-2">=== COMPROVANTE DE VENDA ===</div>
          <div class="small">Venda: #${sale.sale_number}</div>
          <div class="small">Data: ${new Date(sale.created_at).toLocaleDateString('pt-BR')}</div>
          <div class="small">Hora: ${new Date(sale.created_at).toLocaleTimeString('pt-BR')}</div>
          <div class="small">Operador: ${sale.operator_name}</div>
          ${sale.customer_name ? `<div class="small">Cliente: ${sale.customer_name}</div>` : ''}
          <div class="small">Canal: ${sale.channel === 'pdv' ? 'PDV' : sale.channel === 'delivery' ? 'Delivery' : sale.channel === 'mesa' ? 'Mesa' : 'PDV'}</div>
        </div>
        
        <!-- Resumo -->
        <div class="mb-3 separator">
          <div class="bold mb-1">RESUMO:</div>
          <div class="flex-between">
            <span class="small">Total:</span>
            <span class="small">${formatCurrency(sale.total_amount)}</span>
          </div>
          <div class="flex-between">
            <span class="small">Pagamento:</span>
            <span class="small">${getPaymentTypeLabel(sale.payment_type)}</span>
          </div>
          ${sale.items_count > 0 ? `
          <div class="flex-between">
            <span class="small">Itens:</span>
            <span class="small">${sale.items_count}</span>
          </div>
          ` : ''}
        </div>
        
        <!-- Rodapé -->
        <div class="center small">
          <div class="bold mb-2">Obrigado pela preferência!</div>
          <div>Elite Açaí - O melhor açaí da cidade!</div>
          <div>@eliteacai</div>
          <div>⭐⭐⭐⭐⭐ Avalie-nos no Google</div>
          <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid black;">
            <div>Elite Açaí - CNPJ: 38.130.139/0001-22</div>
            <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
            <div>Este não é um documento fiscal</div>
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

  const fetchSales = async () => {
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
        
        // Mock data for demonstration when Supabase is not configured
        const mockSales: Sale[] = [
          {
            id: '1',
            sale_number: 1001,
            operator_name: 'Administrador',
            customer_name: 'Maria Santos',
            total_amount: 25.50,
            payment_type: 'dinheiro',
            created_at: new Date().toISOString(),
            items_count: 3,
            is_cancelled: false,
            channel: 'pdv'
          },
          {
            id: '2',
            sale_number: 1002,
            operator_name: 'Administrador',
            customer_name: 'Pedro Oliveira',
            total_amount: 18.00,
            payment_type: 'pix',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            items_count: 2,
            is_cancelled: false,
            channel: 'pdv'
          }
        ];
        
        setSales(mockSales);
        setLoading(false);
        return;
      }
      
      // Calculate date range based on filter
      let startDate: string;
      let endDate: string;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          startDate = today.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'yesterday':
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          startDate = yesterday.toISOString();
          endDate = today.toISOString();
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          startDate = weekStart.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = monthStart.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          startDate = today.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
      }
      
      console.log('📊 Buscando vendas do período:', { startDate, endDate, dateFilter });
      
      // Fetch PDV sales
      const { data: pdvSales, error: pdvError } = await supabase
        .from('pdv_sales')
        .select(`
          id,
          sale_number,
          total_amount,
          payment_type,
          customer_name,
          customer_phone,
          is_cancelled,
          created_at,
          channel,
          pdv_operators!operator_id(name)
        `)
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: false });
      
      if (pdvError) {
        console.error('❌ Erro ao buscar vendas PDV:', pdvError);
        throw pdvError;
      }
      
      // Fetch delivery orders
      const { data: deliveryOrders, error: deliveryError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });
      
      if (deliveryError) {
        console.warn('⚠️ Erro ao buscar pedidos delivery:', deliveryError);
      }
      
      // Fetch table sales for store 1
      const { data: tableSales, error: tableError } = await supabase
        .from('store1_table_sales')
        .select(`
          id,
          sale_number,
          total_amount,
          payment_type,
          customer_name,
          customer_count,
          status,
          created_at,
          operator_name
        `)
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: false });
      
      if (tableError) {
        console.warn('⚠️ Erro ao buscar vendas de mesa:', tableError);
      }
      
      // Process and combine all sales
      const allSales: Sale[] = [];
      
      // Add PDV sales
      if (pdvSales) {
        pdvSales.forEach(sale => {
          allSales.push({
            id: sale.id,
            sale_number: sale.sale_number,
            operator_name: sale.pdv_operators?.name || 'Operador',
            customer_name: sale.customer_name,
            total_amount: sale.total_amount,
            payment_type: sale.payment_type,
            created_at: sale.created_at,
            items_count: 0, // Will be calculated separately
            is_cancelled: sale.is_cancelled,
            channel: sale.channel || 'pdv'
          });
        });
      }
      
      // Add delivery orders
      if (deliveryOrders) {
        deliveryOrders.forEach(order => {
          const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
          allSales.push({
            id: order.id,
            sale_number: parseInt(order.id.slice(-4), 16), // Generate number from ID
            operator_name: 'Sistema Delivery',
            customer_name: order.customer_name,
            total_amount: order.total_price,
            payment_type: order.payment_method,
            created_at: order.created_at,
            items_count: itemsCount,
            is_cancelled: order.status === 'cancelled',
            channel: 'delivery'
          });
        });
      }
      
      // Add table sales
      if (tableSales) {
        tableSales.forEach(sale => {
          allSales.push({
            id: sale.id,
            sale_number: sale.sale_number,
            operator_name: sale.operator_name || 'Operador',
            customer_name: sale.customer_name,
            total_amount: sale.total_amount,
            payment_type: sale.payment_type,
            created_at: sale.created_at,
            items_count: 0, // Will be calculated separately
            is_cancelled: sale.status === 'cancelada',
            channel: 'mesa'
          });
        });
      }
      
      // Sort all sales by creation date
      allSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('✅ Vendas carregadas:', allSales.length);
      setSales(allSales);
      
    } catch (err) {
      console.error('❌ Erro ao carregar vendas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSales();
  };

  useEffect(() => {
    fetchSales();
  }, [dateFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getPaymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher'
    };
    return types[type] || type;
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = !searchTerm || 
      sale.sale_number.toString().includes(searchTerm) ||
      sale.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.is_cancelled ? 0 : sale.total_amount), 0);
  const activeSales = filteredSales.filter(sale => !sale.is_cancelled);
  const cancelledSales = filteredSales.filter(sale => sale.is_cancelled);

  if (!hasPermission('can_view_sales')) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
          <Eye size={32} className="text-red-600 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Acesso Negado</h3>
        <p className="text-gray-600">Você não tem permissão para visualizar o histórico de vendas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 rounded-full p-2">
              <Package size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Histórico de Vendas</h2>
              <p className="text-gray-600">Loja {storeId}</p>
            </div>
          </div>
          
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Download size={18} />
            Exportar
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, operador ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="custom">Período Personalizado</option>
          </select>
          
          <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
            <Filter size={18} />
            Filtros Avançados
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Vendas</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vendas Ativas</p>
              <p className="text-xl font-bold text-gray-800">{activeSales.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-full p-2">
              <Package size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vendas Canceladas</p>
              <p className="text-xl font-bold text-gray-800">{cancelledSales.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ticket Médio</p>
              <p className="text-xl font-bold text-gray-800">
                {activeSales.length > 0 ? formatCurrency(totalSales / activeSales.length) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Lista de Vendas</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando vendas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Nenhuma venda encontrada para o termo pesquisado' : 
                 dateFilter === 'today' ? 'Nenhuma venda registrada hoje' :
                 'Nenhuma venda encontrada para o período selecionado'}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Atualizar Lista
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{sale.sale_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(sale.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        {sale.operator_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getPaymentTypeLabel(sale.payment_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        sale.channel === 'pdv' ? 'bg-green-100 text-green-800' :
                        sale.channel === 'delivery' ? 'bg-blue-100 text-blue-800' :
                        sale.channel === 'mesa' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sale.channel === 'pdv' ? 'PDV' :
                         sale.channel === 'delivery' ? 'Delivery' :
                         sale.channel === 'mesa' ? 'Mesa' :
                         sale.channel || 'PDV'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sale.is_cancelled 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {sale.is_cancelled ? 'Cancelada' : 'Concluída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="text-emerald-600 hover:text-emerald-900 font-medium"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Detalhes da Venda #{selectedSale.sale_number}
                </h3>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data/Hora</label>
                  <p className="text-gray-900">{formatDateTime(selectedSale.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Operador</label>
                  <p className="text-gray-900">{selectedSale.operator_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cliente</label>
                  <p className="text-gray-900">{selectedSale.customer_name || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Forma de Pagamento</label>
                  <p className="text-gray-900">{getPaymentTypeLabel(selectedSale.payment_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Canal de Venda</label>
                  <p className="text-gray-900">
                    {selectedSale.channel === 'pdv' ? 'PDV' :
                     selectedSale.channel === 'delivery' ? 'Delivery' :
                     selectedSale.channel === 'mesa' ? 'Mesa' :
                     selectedSale.channel || 'PDV'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total de Itens</label>
                  <p className="text-gray-900">{selectedSale.items_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor Total</label>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(selectedSale.total_amount)}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => handlePrintReceipt(selectedSale)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  Imprimir Comprovante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPanel;