import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Trash2, 
  DollarSign, 
  ShoppingCart, 
  X, 
  Check,
  Scale,
  Package,
  Minus,
  Search,
  Coffee,
  Settings,
  Receipt,
  Clock
} from 'lucide-react';

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza';
  is_active: boolean;
  current_sale_id?: string;
}

interface CartItem {
  code: string;
  name: string;
  quantity: number;
  weight?: number;
  unit_price?: number;
  price_per_gram?: number;
  subtotal: number;
  is_weighable: boolean;
  category: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedWeightProduct, setSelectedWeightProduct] = useState<any>(null);
  const [productWeight, setProductWeight] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Produtos completos organizados por categoria
  const demoProducts = [
    // AÇAÍ
    { code: 'ACAI300', name: 'Açaí 300ml', category: 'acai', price: 15.90, is_weighable: false, color: 'purple' },
    { code: 'ACAI400', name: 'Açaí 400ml', category: 'acai', price: 18.90, is_weighable: false, color: 'purple' },
    { code: 'ACAI500', name: 'Açaí 500ml', category: 'acai', price: 22.90, is_weighable: false, color: 'purple' },
    { code: 'ACAI600', name: 'Açaí 600ml', category: 'acai', price: 26.90, is_weighable: false, color: 'purple' },
    { code: 'ACAI700', name: 'Açaí 700ml', category: 'acai', price: 31.90, is_weighable: false, color: 'purple' },
    { code: 'ACAI1KG', name: 'Açaí 1kg', category: 'acai', price_per_gram: 0.04499, is_weighable: true, color: 'purple' },
    
    // COMBOS
    { code: 'COMBO1', name: 'Combo Casal', category: 'combo', price: 49.99, is_weighable: false, color: 'blue' },
    { code: 'COMBO2', name: 'Combo Família', category: 'combo', price: 68.99, is_weighable: false, color: 'blue' },
    
    // BEBIDAS
    { code: 'MILK400', name: 'Milkshake 400ml', category: 'bebidas', price: 11.99, is_weighable: false, color: 'green' },
    { code: 'MILK500', name: 'Milkshake 500ml', category: 'bebidas', price: 14.99, is_weighable: false, color: 'green' },
    { code: 'VIT400', name: 'Vitamina 400ml', category: 'bebidas', price: 12.00, is_weighable: false, color: 'green' },
    { code: 'SUCO300', name: 'Suco Natural 300ml', category: 'bebidas', price: 8.50, is_weighable: false, color: 'green' },
    
    // SORVETES
    { code: 'SORV1KG', name: 'Sorvete 1kg', category: 'sorvetes', price_per_gram: 0.04499, is_weighable: true, color: 'cyan' },
    { code: 'SORV500', name: 'Sorvete 500ml', category: 'sorvetes', price: 22.90, is_weighable: false, color: 'cyan' },
    
    // COMPLEMENTOS
    { code: 'GRAN100', name: 'Granola 100g', category: 'complementos', price: 3.50, is_weighable: false, color: 'orange' },
    { code: 'LEITE100', name: 'Leite em Pó 100g', category: 'complementos', price: 4.00, is_weighable: false, color: 'orange' },
    { code: 'PACOCA', name: 'Paçoca', category: 'complementos', price: 2.50, is_weighable: false, color: 'orange' },
    { code: 'NUTELLA', name: 'Nutella', category: 'complementos', price: 5.00, is_weighable: false, color: 'orange' },
    
    // SOBREMESAS
    { code: 'BROWNIE', name: 'Brownie', category: 'sobremesas', price: 8.50, is_weighable: false, color: 'pink' },
    { code: 'PUDIM', name: 'Pudim', category: 'sobremesas', price: 6.50, is_weighable: false, color: 'pink' },
    { code: 'TORTA', name: 'Torta de Limão', category: 'sobremesas', price: 12.50, is_weighable: false, color: 'pink' }
  ];

  const categories = [
    { id: 'all', label: 'Todos', icon: Package, color: 'gray' },
    { id: 'acai', label: 'Açaí', icon: Coffee, color: 'purple' },
    { id: 'combo', label: 'Combos', icon: Users, color: 'blue' },
    { id: 'bebidas', label: 'Bebidas', icon: Coffee, color: 'green' },
    { id: 'sorvetes', label: 'Sorvetes', icon: Coffee, color: 'cyan' },
    { id: 'complementos', label: 'Complementos', icon: Plus, color: 'orange' },
    { id: 'sobremesas', label: 'Sobremesas', icon: Coffee, color: 'pink' }
  ];

  useEffect(() => {
    loadTables();
    setProducts(demoProducts);
    setLoading(false);
  }, [storeId]);

  const loadTables = async () => {
    try {
      setLoading(true);
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        setTables([
          { id: '1', number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', is_active: true },
          { id: '2', number: 2, name: 'Mesa 2', capacity: 4, status: 'ocupada', is_active: true },
          { id: '3', number: 3, name: 'Mesa 3', capacity: 6, status: 'aguardando_conta', is_active: true },
          { id: '4', number: 4, name: 'Mesa 4', capacity: 8, status: 'livre', is_active: true },
          { id: '5', number: 5, name: 'Mesa 5', capacity: 2, status: 'limpeza', is_active: true },
          { id: '6', number: 6, name: 'Mesa 6', capacity: 6, status: 'livre', is_active: true }
        ]);
        setLoading(false);
        return;
      }

      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      const { data, error } = await supabase
        .from(tablesTable)
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
      setTables([
        { id: 'demo-1', number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', is_active: true },
        { id: 'demo-2', number: 2, name: 'Mesa 2', capacity: 4, status: 'ocupada', is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTableNumber || !newTableName) {
      alert('Preencha número e nome da mesa');
      return;
    }

    try {
      const newTable: RestaurantTable = {
        id: Date.now().toString(),
        number: parseInt(newTableNumber),
        name: newTableName,
        capacity: newTableCapacity,
        status: 'livre',
        is_active: true
      };

      setTables(prev => [...prev, newTable].sort((a, b) => a.number - b.number));
      setShowCreateTable(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);
      
      // Simular sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.innerHTML = `✅ ${newTable.name} criada com sucesso!`;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
      alert('Erro ao criar mesa');
    }
  };

  const addToCart = (product: any) => {
    if (product.is_weighable) {
      setSelectedWeightProduct(product);
      setProductWeight('0.500');
      setShowWeightModal(true);
      return;
    }

    addProductToCart(product, 1);
  };

  const addProductToCart = (product: any, quantity: number = 1, weight?: number) => {
    const existingItem = cart.find(item => item.code === product.code);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const newWeight = weight ? (existingItem.weight || 0) + weight : existingItem.weight;
      let newSubtotal = 0;
      
      if (product.is_weighable && newWeight) {
        newSubtotal = newWeight * (product.price_per_gram || 0) * 1000;
      } else {
        newSubtotal = newQuantity * (product.price || 0);
      }
      
      setCart(prev => prev.map(item => 
        item.code === product.code 
          ? { ...item, quantity: newQuantity, weight: newWeight, subtotal: newSubtotal }
          : item
      ));
    } else {
      let subtotal = 0;
      if (product.is_weighable && weight) {
        subtotal = weight * (product.price_per_gram || 0) * 1000;
      } else {
        subtotal = quantity * (product.price || 0);
      }
      
      const newItem: CartItem = {
        code: product.code,
        name: product.name,
        quantity,
        weight,
        unit_price: product.price,
        price_per_gram: product.price_per_gram,
        subtotal,
        is_weighable: product.is_weighable || false,
        category: product.category
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const handleWeightConfirm = () => {
    const weight = parseFloat(productWeight);
    if (!weight || weight <= 0) {
      alert('Digite um peso válido');
      return;
    }

    addProductToCart(selectedWeightProduct, 1, weight);
    setShowWeightModal(false);
    setSelectedWeightProduct(null);
    setProductWeight('');
  };

  const removeFromCart = (code: string) => {
    setCart(prev => prev.filter(item => item.code !== code));
  };

  const updateCartQuantity = (code: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(code);
      return;
    }

    setCart(prev => prev.map(item => 
      item.code === code 
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * (item.unit_price || 0) }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const openSaleModal = (table: RestaurantTable) => {
    setSelectedTable(table);
    setShowSaleModal(true);
    // Carregar dados da venda se existir
    if (table.current_sale_id) {
      // Simular dados de venda existente
      setCustomerName('Cliente Exemplo');
      setCustomerCount(2);
      setCart([
        {
          code: 'ACAI500',
          name: 'Açaí 500ml',
          quantity: 2,
          unit_price: 22.90,
          subtotal: 45.80,
          is_weighable: false,
          category: 'acai'
        }
      ]);
    } else {
      // Nova venda
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
      setPaymentMethod('dinheiro');
      setChangeFor(undefined);
    }
  };

  const finalizeSale = async () => {
    if (!selectedTable || !customerName || cart.length === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Simular finalização
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.innerHTML = `✅ Venda finalizada para ${selectedTable.name}!`;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

      // Atualizar status da mesa
      setTables(prev => prev.map(table => 
        table.id === selectedTable.id 
          ? { ...table, status: 'aguardando_conta', current_sale_id: Date.now().toString() }
          : table
      ));

      setShowSaleModal(false);
      setSelectedTable(null);
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      alert('Erro ao finalizar venda');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-500';
      case 'ocupada': return 'bg-red-500';
      case 'aguardando_conta': return 'bg-yellow-500';
      case 'limpeza': return 'bg-blue-500';
      default: return 'bg-gray-500';
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

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || 'gray';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users size={28} className="text-indigo-600" />
                Vendas Presenciais - Loja {storeId}
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie mesas e vendas no local
                {operatorName && <span className="ml-2 text-indigo-600">• {operatorName}</span>}
              </p>
            </div>
            <button
              onClick={() => setShowCreateTable(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md"
            >
              <Plus size={20} />
              Nova Mesa
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check size={20} className="text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mesas Livres</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'livre').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Coffee size={20} className="text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mesas Ocupadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'ocupada').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aguardando Conta</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'aguardando_conta').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Mesas</p>
                <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mesas Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Layout das Mesas</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Livre</span>
                <div className="w-3 h-3 bg-red-500 rounded-full ml-3"></div>
                <span className="text-gray-600">Ocupada</span>
                <div className="w-3 h-3 bg-yellow-500 rounded-full ml-3"></div>
                <span className="text-gray-600">Aguardando</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="relative group"
              >
                <button
                  onClick={() => openSaleModal(table)}
                  className="w-full aspect-square p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 bg-white hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden"
                >
                  {/* Status indicator */}
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(table.status)}`}></div>
                  
                  {/* Mesa icon */}
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <Users size={16} className="text-gray-600" />
                  </div>
                  
                  {/* Mesa info */}
                  <div className="text-center">
                    <div className="font-semibold text-gray-900 text-sm">{table.name}</div>
                    <div className="text-xs text-gray-500">{table.capacity} lugares</div>
                    <div className="text-xs text-gray-600 mt-1">{getStatusLabel(table.status)}</div>
                  </div>

                  {/* Venda ativa indicator */}
                  {table.current_sale_id && (
                    <div className="absolute bottom-2 left-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </button>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Excluir ${table.name}?`)) {
                      setTables(prev => prev.filter(t => t.id !== table.id));
                    }
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Venda */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTable.name}</h2>
                  <p className="text-indigo-100">{selectedTable.capacity} lugares • {getStatusLabel(selectedTable.status)}</p>
                </div>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Painel de Produtos */}
              <div className="w-2/3 p-6 border-r border-gray-200 overflow-y-auto">
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar produtos..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Categorias */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const isActive = selectedCategory === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            isActive
                              ? `bg-${category.color}-600 text-white`
                              : `bg-${category.color}-100 text-${category.color}-700 hover:bg-${category.color}-200`
                          }`}
                        >
                          <Icon size={16} />
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid de Produtos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.code}
                      onClick={() => addToCart(product)}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-mono">{product.code}</p>
                        </div>
                        {product.is_weighable && (
                          <div className="ml-2">
                            <Scale size={16} className="text-blue-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">
                          {product.is_weighable 
                            ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                            : formatPrice(product.price || 0)
                          }
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={20} className="text-indigo-600" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Painel de Venda */}
              <div className="w-1/3 p-6 bg-gray-50 overflow-y-auto">
                <div className="space-y-6">
                  {/* Dados do Cliente */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Dados do Cliente</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Nome do cliente"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pessoas
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={customerCount}
                          onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Carrinho */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ShoppingCart size={20} />
                      Pedido ({cart.length})
                    </h3>
                    
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Adicione produtos ao pedido</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.code} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">
                                  {item.is_weighable && item.weight 
                                    ? `${item.weight.toFixed(3)}kg`
                                    : `${item.quantity}x ${formatPrice(item.unit_price || 0)}`
                                  }
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">{formatPrice(item.subtotal)}</div>
                                <button
                                  onClick={() => removeFromCart(item.code)}
                                  className="text-red-500 hover:text-red-700 text-xs mt-1"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                            
                            {!item.is_weighable && (
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => updateCartQuantity(item.code, item.quantity - 1)}
                                  className="w-8 h-8 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center justify-center transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.code, item.quantity + 1)}
                                  className="w-8 h-8 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center justify-center transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  {cart.length > 0 && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold">{formatPrice(getCartTotal())}</span>
                      </div>
                    </div>
                  )}

                  {/* Pagamento */}
                  {cart.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign size={20} />
                        Pagamento
                      </h3>
                      
                      <div className="space-y-3">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="dinheiro">💵 Dinheiro</option>
                          <option value="pix">📱 PIX</option>
                          <option value="cartao_credito">💳 Cartão de Crédito</option>
                          <option value="cartao_debito">💳 Cartão de Débito</option>
                          <option value="voucher">🎟️ Voucher</option>
                          <option value="misto">🔄 Misto</option>
                        </select>

                        {paymentMethod === 'dinheiro' && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={changeFor || ''}
                            onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Troco para (opcional)"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="space-y-3">
                    {cart.length > 0 && (
                      <button
                        onClick={finalizeSale}
                        disabled={!customerName}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Receipt size={20} />
                        Finalizar Venda
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowSaleModal(false)}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Peso */}
      {showWeightModal && selectedWeightProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Informar Peso</h3>
              <button
                onClick={() => setShowWeightModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900">{selectedWeightProduct.name}</h4>
                <p className="text-blue-700">
                  {formatPrice((selectedWeightProduct.price_per_gram || 0) * 1000)}/kg
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={productWeight}
                  onChange={(e) => setProductWeight(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-bold"
                  autoFocus
                />
              </div>

              {productWeight && !isNaN(parseFloat(productWeight)) && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-700 mb-1">Total:</div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatPrice(parseFloat(productWeight) * (selectedWeightProduct.price_per_gram || 0) * 1000)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWeightModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleWeightConfirm}
                disabled={!productWeight || parseFloat(productWeight) <= 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Mesa */}
      {showCreateTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Nova Mesa</h3>
              <button
                onClick={() => setShowCreateTable(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTableNumber}
                  onChange={(e) => {
                    setNewTableNumber(e.target.value);
                    setNewTableName(`Mesa ${e.target.value}`);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: 7"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Mesa 7"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidade
                </label>
                <select
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2 lugares</option>
                  <option value={4}>4 lugares</option>
                  <option value={6}>6 lugares</option>
                  <option value={8}>8 lugares</option>
                  <option value={10}>10 lugares</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateTable(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                disabled={!newTableNumber || !newTableName}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;