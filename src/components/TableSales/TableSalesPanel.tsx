import React, { useState, useEffect } from 'react';
import { useTableSales } from '../../hooks/useTableSales';
import { usePDVProducts } from '../../hooks/usePDV';
import { RestaurantTable, TableSale } from '../../types/table-sales';
import TableGrid from './TableGrid';
import TableSaleModal from './TableSaleModal';
import TableDetailsModal from './TableDetailsModal';
import { PesagemModal } from '../PDV/PesagemModal';
import { 
  Users, 
  RefreshCw, 
  Plus, 
  Search, 
  Filter,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Scale,
  Minus,
  Trash2,
  Save,
  X
} from 'lucide-react';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName = 'Operador' }) => {
  const { tables, loading, error, stats, createTableSale, closeSale, getSaleDetails, updateTableStatus, refetch, addItemToSale } = useTableSales(storeId);
  const { products, searchProducts } = usePDVProducts();
  
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentSale, setCurrentSale] = useState<TableSale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showPesagemModal, setShowPesagemModal] = useState(false);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);

  const filteredTables = tables.filter(table => {
    const matchesSearch = searchTerm === '' || 
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.number.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    
    if (table.status === 'livre') {
      setShowSaleModal(true);
    } else if (table.current_sale_id) {
      const saleDetails = await getSaleDetails(table.current_sale_id);
      if (saleDetails) {
        setCurrentSale(saleDetails);
        setShowDetailsModal(true);
      }
    }
  };

  const handleCreateSale = async (tableId: string, customerName?: string, customerCount?: number) => {
    try {
      await createTableSale(tableId, customerName, customerCount);
      setShowSaleModal(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      alert('Erro ao criar venda da mesa');
    }
  };

  const handleCloseSale = async (saleId: string, paymentType: string) => {
    try {
      await closeSale(saleId, paymentType as any);
      setShowDetailsModal(false);
      setCurrentSale(null);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao fechar venda:', error);
      alert('Erro ao fechar venda da mesa');
    }
  };

  const handleUpdateStatus = async (tableId: string, status: string) => {
    try {
      await updateTableStatus(tableId, status as any);
      setShowDetailsModal(false);
      setCurrentSale(null);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da mesa');
    }
  };

  const handleAddProduct = (product: any) => {
    setSelectedProduct(product);
    setItemQuantity(1);
    setItemNotes('');
    
    if (product.is_weighable) {
      setShowPesagemModal(true);
    } else {
      setShowAddItemModal(true);
    }
  };

  const handleWeightConfirm = (weightInGrams: number) => {
    if (selectedProduct) {
      const weightInKg = weightInGrams / 1000;
      const subtotal = weightInKg * 1000 * (selectedProduct.price_per_gram || 0);
      
      const newItem = {
        product_code: selectedProduct.code,
        product_name: selectedProduct.name,
        quantity: 1,
        weight_kg: weightInKg,
        price_per_gram: selectedProduct.price_per_gram,
        discount_amount: 0,
        subtotal: subtotal,
        notes: itemNotes
      };
      
      setCartItems(prev => [...prev, newItem]);
      setShowPesagemModal(false);
      setSelectedProduct(null);
    }
  };

  const handleAddItemToCart = () => {
    if (selectedProduct) {
      const subtotal = itemQuantity * (selectedProduct.unit_price || 0);
      
      const newItem = {
        product_code: selectedProduct.code,
        product_name: selectedProduct.name,
        quantity: itemQuantity,
        unit_price: selectedProduct.unit_price,
        discount_amount: 0,
        subtotal: subtotal,
        notes: itemNotes
      };
      
      setCartItems(prev => [...prev, newItem]);
      setShowAddItemModal(false);
      setSelectedProduct(null);
    }
  };

  const removeCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeCartItem(index);
      return;
    }
    
    setCartItems(prev => prev.map((item, i) => {
      if (i === index) {
        const subtotal = item.weight_kg 
          ? item.weight_kg * 1000 * (item.price_per_gram || 0)
          : quantity * (item.unit_price || 0);
        
        return {
          ...item,
          quantity,
          subtotal
        };
      }
      return item;
    }));
  };

  const addItemsToSale = async () => {
    if (!currentSale || cartItems.length === 0) return;
    
    try {
      for (const item of cartItems) {
        await addItemToSale(currentSale.id, item);
      }
      
      setCartItems([]);
      
      // Refresh sale details
      const updatedSale = await getSaleDetails(currentSale.id);
      if (updatedSale) {
        setCurrentSale(updatedSale);
      }
    } catch (error) {
      console.error('Erro ao adicionar itens:', error);
      alert('Erro ao adicionar itens à venda');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" />
            Controle de Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie vendas presenciais por mesa</p>
        </div>
        <button
          onClick={refetch}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Livres</p>
              <p className="text-2xl font-bold text-green-600">{stats.free}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupadas</p>
              <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
            </div>
            <Users className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aguardando</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.waitingBill}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Limpeza</p>
              <p className="text-2xl font-bold text-blue-600">{stats.cleaning}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar mesa..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="livre">Livres</option>
              <option value="ocupada">Ocupadas</option>
              <option value="aguardando_conta">Aguardando Conta</option>
              <option value="limpeza">Em Limpeza</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Mesas ({filteredTables.length})
        </h3>
        
        {filteredTables.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhuma mesa encontrada' 
                : 'Nenhuma mesa configurada'
              }
            </p>
          </div>
        ) : (
          <TableGrid 
            tables={filteredTables}
            onTableClick={handleTableClick}
          />
        )}
      </div>

      {/* Cart for adding items */}
      {currentSale && cartItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Itens para Adicionar à Mesa {selectedTable?.number}
          </h3>
          
          <div className="space-y-3 mb-4">
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                  <p className="text-sm text-gray-600">
                    {item.weight_kg ? 
                      `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg` :
                      `${item.quantity}x × ${formatPrice(item.unit_price || 0)}`
                    }
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-500 italic">Obs: {item.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {!item.weight_kg && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                  
                  <span className="font-semibold text-green-600 w-20 text-right">
                    {formatPrice(item.subtotal)}
                  </span>
                  
                  <button
                    onClick={() => removeCartItem(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-lg font-semibold">
              Total: {formatPrice(getCartTotal())}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCartItems([])}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={addItemsToSale}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Adicionar à Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection for Adding Items */}
      {currentSale && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Adicionar Itens à Mesa {selectedTable?.number}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.slice(0, 12).map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package size={24} className="text-gray-400" />
                  )}
                </div>
                <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">{product.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-semibold text-sm">
                    {product.is_weighable ? (
                      <div className="flex items-center gap-1">
                        <Scale size={12} />
                        {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                      </div>
                    ) : (
                      formatPrice(product.unit_price || 0)
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showSaleModal && selectedTable && (
        <TableSaleModal
          table={selectedTable}
          isOpen={showSaleModal}
          onClose={() => {
            setShowSaleModal(false);
            setSelectedTable(null);
          }}
          onCreateSale={handleCreateSale}
        />
      )}

      {showDetailsModal && selectedTable && currentSale && (
        <TableDetailsModal
          table={selectedTable}
          sale={currentSale}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setCurrentSale(null);
            setSelectedTable(null);
            setCartItems([]);
          }}
          onCloseSale={handleCloseSale}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Add Item Modal */}
      {showAddItemModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Adicionar {selectedProduct.name}
                </h2>
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setSelectedProduct(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{itemQuantity}</span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Observações do item..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-blue-700">Subtotal:</span>
                  <span className="font-bold text-blue-800">
                    {formatPrice(itemQuantity * (selectedProduct.unit_price || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItemToCart}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showPesagemModal && selectedProduct && (
        <PesagemModal
          produto={selectedProduct}
          onConfirmar={handleWeightConfirm}
          onFechar={() => {
            setShowPesagemModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default TableSalesPanel;