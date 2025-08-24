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
  User
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { PDVOperator } from '../../types/pdv';

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
}

const SalesHistoryPanel: React.FC<SalesHistoryPanelProps> = ({ storeId, operator }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const { hasPermission } = usePermissions(operator);

  // Mock data for demonstration
  useEffect(() => {
    const mockSales: Sale[] = [
      {
        id: '1',
        sale_number: 1001,
        operator_name: 'João Silva',
        customer_name: 'Maria Santos',
        total_amount: 25.50,
        payment_type: 'dinheiro',
        created_at: new Date().toISOString(),
        items_count: 3,
        is_cancelled: false
      },
      {
        id: '2',
        sale_number: 1002,
        operator_name: 'Ana Costa',
        customer_name: 'Pedro Oliveira',
        total_amount: 18.00,
        payment_type: 'pix',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        items_count: 2,
        is_cancelled: false
      },
      {
        id: '3',
        sale_number: 1003,
        operator_name: 'Carlos Lima',
        total_amount: 32.75,
        payment_type: 'cartao_credito',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        items_count: 4,
        is_cancelled: true
      }
    ];

    setTimeout(() => {
      setSales(mockSales);
      setLoading(false);
    }, 1000);
  }, []);

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
              <p className="text-gray-600">Nenhuma venda encontrada</p>
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
                <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition-colors">
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