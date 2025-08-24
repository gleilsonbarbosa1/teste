import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Eye, 
  DollarSign, 
  Clock, 
  User,
  Package,
  AlertCircle,
  RefreshCw,
  Utensils,
  CheckCircle,
  XCircle,
  Search,
  X
} from 'lucide-react';
import { useTableSales } from '../../hooks/useTableSales';
import { usePDVProducts } from '../../hooks/usePDV';
import { RestaurantTable, TableSale } from '../../types/table-sales';
import { PDVProduct } from '../../types/pdv';
import { PesagemModal } from '../PDV/PesagemModal';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName = 'Operador' }) => {
  const { tables, loading, error, stats, createTableSale, closeSale, getSaleDetails, updateTableStatus, refetch, addItemToSale, removeItemFromSale } = useTableSales(storeId);
  const { products, loading: productsLoading, searchProducts } = usePDVProducts();
  
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showPesagemModal, setShowPesagemModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PDVProduct | null>(null);
  const [saleDetails, setSaleDetails] = useState<TableSale | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [saleToClose, setSaleToClose] = useState<TableSale | null>(null);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'livre': return <CheckCircle size={16} />;
      case 'ocupada': return <User size={16} />;
      case 'aguardando_conta': return <DollarSign size={16} />;
      case 'limpeza': return <Package size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    
    if (table.status === 'livre') {
      setShowNewSaleModal(true);
    } else if (table.status === 'ocupada' && table.current_sale_id) {
      const details = await getSaleDetails(table.current_sale_id);
      setSaleDetails(details);
      setShowProductsModal(true);
    } else if (table.status === 'aguardando_conta' && table.current_sale_id) {
      const details = await getSaleDetails(table.current_sale_id);
      setSaleDetails(details);
      setShowDetailsModal(true);
    }
  };

  const handleCreateSale = async () => {
    if (!selectedTable) return;
    
    try {
      await createTableSale(selectedTable.id, customerName, customerCount);
      setShowNewSaleModal(false);
      setCustomerName('');
      setCustomerCount(1);
      setSelectedTable(null);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa ${selectedTable.number} aberta com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      alert('Erro ao abrir mesa. Tente novamente.');
    }
  };

  const handleUpdateStatus = async (tableId: string, newStatus: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza') => {
    try {
      await updateTableStatus(tableId, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status da mesa.');
    }
  };

  const handleCloseSale = (sale: TableSale) => {
    setSaleToClose(sale);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!saleToClose) return;

    try {
      await closeSale(saleToClose.id, paymentMethod, changeFor ? changeFor - saleToClose.total_amount : 0);
      setShowPaymentModal(false);
      setSaleToClose(null);
      setPaymentMethod('dinheiro');
      setChangeFor(undefined);
      setShowDetailsModal(false);
      setSelectedTable(null);
      setSaleDetails(null);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa fechada com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao fechar mesa:', err);
      alert('Erro ao fechar mesa. Tente novamente.');
    }
  };
  
  const handleAddProduct = async (product: PDVProduct, quantity: number = 1, weight?: number) => {
    if (!selectedTable?.current_sale_id) return;

    try {
      const item = {
        product_code: product.code,
        product_name: product.name,
        quantity: quantity,
        weight_kg: weight,
        unit_price: product.unit_price,
        price_per_gram: product.price_per_gram,
        discount_amount: 0,
        subtotal: product.is_weighable && weight && product.price_per_gram
          ? weight * 1000 * product.price_per_gram
          : quantity * (product.unit_price || 0)
      };

      await addItemToSale(selectedTable.current_sale_id, item);
      
      // Refresh table data and sale details
      refetch();
      
      // Reload sale details to show new item immediately
      if (selectedTable.current_sale_id) {
        const updatedDetails = await getSaleDetails(selectedTable.current_sale_id);
        setSaleDetails(updatedDetails);
      }
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Produto adicionado à mesa ${selectedTable.number}!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao adicionar produto:', err);
      alert('Erro ao adicionar produto à mesa.');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedTable?.current_sale_id) return;

    if (!confirm('Tem certeza que deseja remover este item da venda?')) {
      return;
    }

    try {
      await removeItemFromSale(itemId);
      
      // Refresh table data and sale details
      refetch();
      
      // Reload sale details to show updated items immediately
      if (selectedTable.current_sale_id) {
        const updatedDetails = await getSaleDetails(selectedTable.current_sale_id);
        setSaleDetails(updatedDetails);
      }
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Item removido da mesa ${selectedTable.number}!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao remover item:', err);
      alert('Erro ao remover item da mesa.');
    }
  };

  const handleProductClick = (product: PDVProduct) => {
    if (product.is_weighable) {
      setSelectedProduct(product);
      setShowPesagemModal(true);
    } else {
      handleAddProduct(product, 1);
    }
  };

  const handleWeightConfirm = (weightInGrams: number) => {
    if (selectedProduct) {
      const weightInKg = weightInGrams / 1000;
      handleAddProduct(selectedProduct, 1, weightInKg);
      setShowPesagemModal(false);
      setSelectedProduct(null);
    }
  };

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result.filter(p => p.is_active);
  }, [products, searchProducts, searchTerm, selectedCategory]);

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'acai', label: 'Açaí' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'outros', label: 'Outros' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas da Loja {storeId}...</span>
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
              <h3 className="font-semibold text-yellow-600">Configuração do Supabase</h3>
              <p className="text-sm text-yellow-600">
                Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar o sistema de mesas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3">
              <Utensils size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Controle de Mesas - Loja {storeId}</h1>
              <p className="text-gray-600">Operador: {operatorName}</p>
            </div>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="text-sm text-green-600">Mesas Livres</p>
                <p className="text-xl font-bold text-green-700">{stats.free_tables}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-3">
              <User size={20} className="text-red-600" />
              <div>
                <p className="text-sm text-red-600">Mesas Ocupadas</p>
                <p className="text-xl font-bold text-red-700">{stats.occupied_tables}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-3">
              <DollarSign size={20} className="text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">Aguardando Conta</p>
                <p className="text-xl font-bold text-yellow-700">{stats.waiting_payment}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <Package size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Em Limpeza</p>
                <p className="text-xl font-bold text-blue-700">{stats.cleaning_tables}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            onClick={() => handleTableClick(table)}
            className={`
              relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg
              ${getStatusColor(table.status)}
            `}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(table.status)}
              </div>
              <h3 className="font-bold text-lg">Mesa {table.number}</h3>
              <p className="text-sm font-medium">{getStatusLabel(table.status)}</p>
              
              {table.current_sale && (
                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <p className="text-xs">{table.current_sale.customer_name}</p>
                  <p className="text-xs">{table.current_sale.customer_count} pessoas</p>
                  <p className="text-xs font-bold">{formatPrice(table.current_sale.total_amount)}</p>
                </div>
              )}
            </div>
            
            {/* Status change buttons */}
            {table.status !== 'livre' && (
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(table.id, 'livre');
                  }}
                  className="w-6 h-6 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-colors"
                  title="Liberar mesa"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Sale Modal */}
      {showNewSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Abrir Mesa {selectedTable.number}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome do cliente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pessoas
                </label>
                <input
                  type="number"
                  min="1"
                  value={customerCount}
                  onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewSaleModal(false);
                  setSelectedTable(null);
                  setCustomerName('');
                  setCustomerCount(1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSale}
                disabled={!customerName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Abrir Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && selectedTable && saleDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Mesa {selectedTable.number} - Adicionar Produtos</h2>
                  <p className="text-gray-600">{saleDetails.customer_name} • {saleDetails.customer_count} pessoas</p>
                </div>
                <button
                  onClick={() => {
                    setShowProductsModal(false);
                    setSelectedTable(null);
                    setSaleDetails(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Products List */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-all"
                    >
                      <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-600">
                          {product.is_weighable && product.price_per_gram
                            ? `${formatPrice(product.price_per_gram)}/g`
                            : formatPrice(product.unit_price || 0)
                          }
                        </span>
                        <Plus size={16} className="text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Sale Items */}
              <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
                <h3 className="font-bold text-lg mb-4">Itens da Mesa</h3>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {saleDetails.items.filter(item => item.id && typeof item.id === 'string' && item.id.trim() !== '').map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-600">
                          {item.weight_kg ? `${(item.weight_kg * 1000).toFixed(0)}g` : `${item.quantity}x`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatPrice(item.subtotal)}</div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatPrice(saleDetails.total_amount)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedTable.id, 'aguardando_conta')}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Solicitar Conta
                  </button>
                  <button
                    onClick={() => {
                      setShowProductsModal(false);
                      setSelectedTable(null);
                      setSaleDetails(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showDetailsModal && selectedTable && saleDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Mesa {selectedTable.number} - Conta</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTable(null);
                  setSaleDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Cliente: {saleDetails.customer_name}</p>
                <p className="text-gray-600">Pessoas: {saleDetails.customer_count}</p>
                <p className="text-gray-600">
                  Aberta em: {new Date(saleDetails.created_at).toLocaleString('pt-BR')}
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Itens:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {saleDetails.items.filter(item => item.id && typeof item.id === 'string' && item.id.trim() !== '').map((item, index) => (
                    <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-600">
                          {item.weight_kg ? `${(item.weight_kg * 1000).toFixed(0)}g` : `${item.quantity}x`}
                        </div>
                      </div>
                      <div className="font-bold">{formatPrice(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(saleDetails.total_amount)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleUpdateStatus(selectedTable.id, 'ocupada')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={() => handleCloseSale(saleDetails)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Fechar Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && saleToClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Finalizar Pagamento</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Total a pagar: <span className="font-bold text-xl">{formatPrice(saleToClose.total_amount)}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="pix">PIX</option>
                  <option value="voucher">Voucher</option>
                  <option value="misto">Misto</option>
                </select>
              </div>

              {paymentMethod === 'dinheiro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Recebido (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={changeFor || ''}
                    onChange={(e) => setChangeFor(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o valor recebido"
                  />
                  {changeFor && changeFor > saleToClose.total_amount && (
                    <p className="text-sm text-green-600 mt-1">
                      Troco: {formatPrice(changeFor - saleToClose.total_amount)}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSaleToClose(null);
                  setPaymentMethod('dinheiro');
                  setChangeFor(undefined);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePaymentConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pesagem Modal */}
      {showPesagemModal && selectedProduct && (
        <PesagemModal
          product={selectedProduct}
          onConfirm={handleWeightConfirm}
          onCancel={() => {
            setShowPesagemModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-full p-2">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-600">Erro</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;