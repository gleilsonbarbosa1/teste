import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';
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
  Clock,
  AlertCircle,
  RefreshCw
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
  location?: string;
  created_at: string;
  updated_at: string;
}

interface TableSale {
  id: string;
  table_id: string;
  sale_number: number;
  operator_name?: string;
  customer_name?: string;
  customer_count: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_type?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto';
  change_amount: number;
  status: 'aberta' | 'fechada' | 'cancelada';
  notes?: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

interface CartItem {
  product_code: string;
  product_name: string;
  quantity: number;
  weight_kg?: number;
  unit_price?: number;
  price_per_gram?: number;
  subtotal: number;
  is_weighable: boolean;
  category: string;
  notes?: string;
}

interface PDVProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  is_weighable: boolean;
  unit_price?: number;
  price_per_gram?: number;
  image_url?: string;
  stock_quantity: number;
  min_stock: number;
  is_active: boolean;
  barcode?: string;
  description?: string;
  display_order?: number;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [products, setProducts] = useState<PDVProduct[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [currentSale, setCurrentSale] = useState<TableSale | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedWeightProduct, setSelectedWeightProduct] = useState<PDVProduct | null>(null);
  const [productWeight, setProductWeight] = useState('');
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    capacity: 4,
    location: ''
  });
  // Define table name based on store ID
  const tableNameForStore = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const tableSalesNameForStore = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const tableSaleItemsNameForStore = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  
  // Table creation states
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableLocation, setNewTableLocation] = useState('');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks para caixa
  const pdvCashRegister = usePDVCashRegister();
  const store2CashRegister = useStore2PDVCashRegister();
  
  const cashRegister = storeId === 1 ? pdvCashRegister : store2CashRegister;
  const { isOpen: isCashRegisterOpen, currentRegister } = cashRegister;

  const categories = [
    { id: 'all', label: 'Todos', icon: Package, color: 'gray' },
    { id: 'acai', label: 'Açaí', icon: Coffee, color: 'purple' },
    { id: 'bebidas', label: 'Bebidas', icon: Coffee, color: 'green' },
    { id: 'sorvetes', label: 'Sorvetes', icon: Coffee, color: 'cyan' },
    { id: 'complementos', label: 'Complementos', icon: Plus, color: 'orange' },
    { id: 'sobremesas', label: 'Sobremesas', icon: Coffee, color: 'pink' },
    { id: 'outros', label: 'Outros', icon: Package, color: 'blue' }
  ];

  const checkSupabaseConfig = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return supabaseUrl && supabaseKey && 
           supabaseUrl !== 'your_supabase_url_here' && 
           supabaseKey !== 'your_supabase_anon_key_here' &&
           !supabaseUrl.includes('placeholder');
  };

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!checkSupabaseConfig()) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        setTables([
          { 
            id: '1', 
            number: 1, 
            name: 'Mesa 1', 
            capacity: 4, 
            status: 'livre', 
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: '2', 
            number: 2, 
            name: 'Mesa 2', 
            capacity: 4, 
            status: 'ocupada', 
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        setLoading(false);
        return;
      }

      console.log(`🔄 Carregando mesas da Loja ${storeId}...`);
      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { data, error } = await supabase
        .from(tablesTable)
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      
      console.log(`✅ ${data?.length || 0} mesas carregadas da Loja ${storeId}`);
      setTables(data || []);
    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const loadProducts = useCallback(async () => {
    try {
      if (!checkSupabaseConfig()) {
        console.warn('⚠️ Supabase não configurado - usando produtos de demonstração');
        return;
      }

      console.log(`🔄 Carregando produtos da Loja ${storeId}...`);
      const productsTable = storeId === 1 ? 'pdv_products' : 'store2_products';
      
      const { data, error } = await supabase
        .from(productsTable)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true, nullsLast: true })
        .order('name');

      if (error) throw error;
      
      console.log(`✅ ${data?.length || 0} produtos carregados da Loja ${storeId}`);
      setProducts(data || []);
    } catch (err) {
      console.error(`❌ Erro ao carregar produtos da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    }
  }, [storeId]);

  const createTable = async () => {
    if (!newTableNumber || !newTableName) {
      alert('Preencha número e nome da mesa');
      return;
    }

    try {
      setSaving(true);
      // Check if table number already exists
      const { data: existingTable, error: checkError } = await supabase
        .from(tableNameForStore)
        .select('number')
        .eq('number', formData.number)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingTable) {
        alert(`Mesa número ${formData.number} já existe. Escolha outro número.`);
        setCreating(false);
        return;
      }

      
      if (!checkSupabaseConfig()) {
        // Modo demo
        const newTable: RestaurantTable = {
          id: Date.now().toString(),
          number: parseInt(newTableNumber),
          name: newTableName,
          capacity: newTableCapacity,
          location: newTableLocation,
          status: 'livre',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setTables(prev => [...prev, newTable].sort((a, b) => a.number - b.number));
      } else {
        console.log(`🚀 Criando mesa na Loja ${storeId}:`, { number: newTableNumber, name: newTableName });
        const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
        
        const { data, error } = await supabase
          .from(tablesTable)
          .insert([{
            number: parseInt(newTableNumber),
            name: newTableName,
            capacity: newTableCapacity,
            location: newTableLocation || null,
            status: 'livre',
            is_active: true
          }])
          .select()
          .single();

        if (error) throw error;
        
        console.log('✅ Mesa criada:', data);
        setTables(prev => [...prev, data].sort((a, b) => a.number - b.number));
      }

      setShowCreateTable(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);
      setNewTableLocation('');
      setFormData({
        number: '',
        name: '',
        capacity: 4,
        location: ''
      });
      
      // Feedback de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.innerHTML = `✅ ${newTableName} criada com sucesso!`;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('❌ Erro ao criar mesa:', err);
      alert(`Erro ao criar mesa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteTable = async (table: RestaurantTable) => {
    if (!confirm(`Excluir ${table.name}?`)) return;

    try {
      if (!checkSupabaseConfig()) {
        // Modo demo
        setTables(prev => prev.filter(t => t.id !== table.id));
        return;
      }

      console.log(`🗑️ Excluindo mesa da Loja ${storeId}:`, table.name);
      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { error } = await supabase
        .from(tablesTable)
        .update({ is_active: false })
        .eq('id', table.id);

      if (error) throw error;
      
      console.log('✅ Mesa excluída');
      setTables(prev => prev.filter(t => t.id !== table.id));
    } catch (err) {
      console.error('❌ Erro ao excluir mesa:', err);
      alert('Erro ao excluir mesa');
    }
  };

  const loadTableSale = async (table: RestaurantTable) => {
    if (!table.current_sale_id) return;

    try {
      if (!checkSupabaseConfig()) {
        // Dados demo para venda existente
        setCurrentSale({
          id: table.current_sale_id,
          table_id: table.id,
          sale_number: 123,
          operator_name: operatorName,
          customer_name: 'Cliente Exemplo',
          customer_count: 2,
          subtotal: 45.80,
          discount_amount: 0,
          total_amount: 45.80,
          change_amount: 0,
          status: 'aberta',
          opened_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return;
      }

      console.log(`🔄 Carregando venda da mesa ${table.name}...`);
      const salesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      const itemsTable = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
      
      // Carregar venda
      const { data: sale, error: saleError } = await supabase
        .from(salesTable)
        .select('*')
        .eq('id', table.current_sale_id)
        .single();

      if (saleError) throw saleError;
      
      // Carregar itens da venda
      const { data: items, error: itemsError } = await supabase
        .from(itemsTable)
        .select('*')
        .eq('sale_id', table.current_sale_id);

      if (itemsError) throw itemsError;
      
      setCurrentSale(sale);
      setCustomerName(sale.customer_name || '');
      setCustomerCount(sale.customer_count || 1);
      
      // Converter itens para formato do carrinho
      const cartItems: CartItem[] = (items || []).map(item => ({
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        weight_kg: item.weight_kg,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        subtotal: item.subtotal,
        is_weighable: !!item.weight_kg,
        category: 'outros', // Categoria padrão
        notes: item.notes
      }));
      
      setCart(cartItems);
      
      console.log('✅ Venda carregada:', sale);
    } catch (err) {
      console.error('❌ Erro ao carregar venda:', err);
      setError('Erro ao carregar dados da venda');
    }
  };

  const openSaleModal = async (table: RestaurantTable) => {
    setSelectedTable(table);
    setShowSaleModal(true);
    
    if (table.current_sale_id) {
      await loadTableSale(table);
    } else {
      // Nova venda
      setCurrentSale(null);
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
      setPaymentMethod('dinheiro');
      setChangeFor(undefined);
    }
  };

  const addToCart = (product: PDVProduct) => {
    if (product.is_weighable) {
      setSelectedWeightProduct(product);
      setProductWeight('0.500');
      setShowWeightModal(true);
      return;
    }

    addProductToCart(product, 1);
  };

  const addProductToCart = (product: PDVProduct, quantity: number = 1, weight?: number) => {
    const existingItem = cart.find(item => item.product_code === product.code);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const newWeight = weight ? (existingItem.weight_kg || 0) + weight : existingItem.weight_kg;
      let newSubtotal = 0;
      
      if (product.is_weighable && newWeight) {
        newSubtotal = newWeight * (product.price_per_gram || 0) * 1000;
      } else {
        newSubtotal = newQuantity * (product.unit_price || 0);
      }
      
      setCart(prev => prev.map(item => 
        item.product_code === product.code 
          ? { ...item, quantity: newQuantity, weight_kg: newWeight, subtotal: newSubtotal }
          : item
      ));
    } else {
      let subtotal = 0;
      if (product.is_weighable && weight) {
        subtotal = weight * (product.price_per_gram || 0) * 1000;
      } else {
        subtotal = quantity * (product.unit_price || 0);
      }
      
      const newItem: CartItem = {
        product_code: product.code,
        product_name: product.name,
        quantity,
        weight_kg: weight,
        unit_price: product.unit_price,
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

    if (selectedWeightProduct) {
      addProductToCart(selectedWeightProduct, 1, weight);
    }
    
    setShowWeightModal(false);
    setSelectedWeightProduct(null);
    setProductWeight('');
  };

  const removeFromCart = (code: string) => {
    setCart(prev => prev.filter(item => item.product_code !== code));
  };

  const updateCartQuantity = (code: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(code);
      return;
    }

    setCart(prev => prev.map(item => 
      item.product_code === code 
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * (item.unit_price || 0) }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const finalizeSale = async () => {
    if (!selectedTable || !customerName || cart.length === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isCashRegisterOpen) {
      alert('Não é possível finalizar vendas sem um caixa aberto');
      return;
    }

    try {
      setSaving(true);
      const total = getCartTotal();

      if (!checkSupabaseConfig()) {
        // Modo demo
        setTables(prev => prev.map(table => 
          table.id === selectedTable.id 
            ? { ...table, status: 'aguardando_conta', current_sale_id: Date.now().toString() }
            : table
        ));
        
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMessage.innerHTML = `✅ Venda finalizada para ${selectedTable.name}!`;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);

        setShowSaleModal(false);
        setSelectedTable(null);
        resetSaleForm();
        return;
      }

      console.log(`🚀 Finalizando venda para ${selectedTable.name}...`);
      
      // Criar ou atualizar venda
      const salesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      const itemsTable = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      let saleId = currentSale?.id;
      
      if (!currentSale) {
        // Nova venda
        const { data: newSale, error: saleError } = await supabase
          .from(salesTable)
          .insert([{
            table_id: selectedTable.id,
            operator_name: operatorName,
            customer_name: customerName,
            customer_count: customerCount,
            subtotal: total,
            discount_amount: 0,
            total_amount: total,
            payment_type: paymentMethod,
            change_amount: changeFor || 0,
            status: 'fechada'
          }])
          .select()
          .single();

        if (saleError) throw saleError;
        saleId = newSale.id;
        console.log('✅ Venda criada:', newSale);
      } else {
        // Atualizar venda existente
        const { error: updateError } = await supabase
          .from(salesTable)
          .update({
            customer_name: customerName,
            customer_count: customerCount,
            subtotal: total,
            total_amount: total,
            payment_type: paymentMethod,
            change_amount: changeFor || 0,
            status: 'fechada',
            closed_at: new Date().toISOString()
          })
          .eq('id', currentSale.id);

        if (updateError) throw updateError;
        console.log('✅ Venda atualizada');
      }

      // Limpar itens existentes se for atualização
      if (currentSale) {
        await supabase
          .from(itemsTable)
          .delete()
          .eq('sale_id', saleId);
      }

      // Inserir itens da venda
      const saleItems = cart.map(item => ({
        sale_id: saleId,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        weight_kg: item.weight_kg,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        discount_amount: 0,
        subtotal: item.subtotal,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from(itemsTable)
        .insert(saleItems);

      if (itemsError) throw itemsError;
      console.log('✅ Itens da venda inseridos');

      // Atualizar status da mesa
      const { error: tableError } = await supabase
        .from(tablesTable)
        .update({
          status: 'aguardando_conta',
          current_sale_id: saleId
        })
        .eq('id', selectedTable.id);

      if (tableError) throw tableError;
      console.log('✅ Status da mesa atualizado');

      // Adicionar entrada no caixa se necessário (apenas dinheiro)
      if (paymentMethod === 'dinheiro' && currentRegister) {
        try {
          const cashEntriesTable = storeId === 1 ? 'pdv_cash_entries' : 'pdv2_cash_entries';
          
          await supabase
            .from(cashEntriesTable)
            .insert([{
              register_id: currentRegister.id,
              type: 'income',
              amount: total,
              description: `Venda Mesa ${selectedTable.number} - ${customerName}`,
              payment_method: 'dinheiro'
            }]);
          
          console.log('✅ Entrada de caixa criada');
        } catch (cashError) {
          console.warn('⚠️ Erro ao criar entrada no caixa (venda salva):', cashError);
        }
      }

      // Atualizar estado local
      setTables(prev => prev.map(table => 
        table.id === selectedTable.id 
          ? { ...table, status: 'aguardando_conta', current_sale_id: saleId }
          : table
      ));

      // Feedback de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.innerHTML = `✅ Venda finalizada para ${selectedTable.name}!`;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

      setShowSaleModal(false);
      setSelectedTable(null);
      resetSaleForm();
    } catch (err) {
      console.error('❌ Erro ao finalizar venda:', err);
      alert(`Erro ao finalizar venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const resetSaleForm = () => {
    setCurrentSale(null);
    setCart([]);
    setCustomerName('');
    setCustomerCount(1);
    setPaymentMethod('dinheiro');
    setChangeFor(undefined);
  };

  const findAvailableNumbers = useCallback(() => {
    const existingNumbers = tables.map(t => t.number).sort((a, b) => a - b);
    const available = [];
    
    for (let i = 1; i <= existingNumbers.length + 5; i++) {
      if (!existingNumbers.includes(i)) {
        available.push(i);
        if (available.length >= 5) break;
      }
    }
    
    return available;
  }, [tables]);

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

  const availableNumbers = findAvailableNumbers();

  useEffect(() => {
    loadTables();
    loadProducts();
  }, [loadTables, loadProducts]);

  // Auto-fill new table form
  useEffect(() => {
    if (showCreateTable && availableNumbers.length > 0 && !newTableNumber) {
      const firstAvailable = availableNumbers[0].toString();
      setNewTableNumber(firstAvailable);
      setNewTableName(`Mesa ${firstAvailable}`);
    }
  }, [showCreateTable, availableNumbers, newTableNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de mesas da Loja {storeId}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users size={32} />
                Vendas Presenciais - Loja {storeId}
              </h1>
              <p className="text-indigo-100 mt-2">
                Gerencie mesas e vendas no local
                {operatorName && <span className="ml-2">• {operatorName}</span>}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadTables}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Atualizar
              </button>
              <button
                onClick={() => setShowCreateTable(true)}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md"
              >
                <Plus size={20} />
                Nova Mesa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Avisos */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        {!checkSupabaseConfig() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Modo Demonstração</h3>
                <p className="text-yellow-700 text-sm">
                  Supabase não configurado. Funcionalidades limitadas.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isCashRegisterOpen && checkSupabaseConfig() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Caixa Fechado</h3>
                <p className="text-red-700 text-sm">
                  Não é possível finalizar vendas sem um caixa aberto. Abra um caixa primeiro.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Erro</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Check size={24} className="text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mesas Livres</p>
                <p className="text-3xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'livre').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Coffee size={24} className="text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mesas Ocupadas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'ocupada').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aguardando Conta</p>
                <p className="text-3xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'aguardando_conta').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Users size={24} className="text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Mesas</p>
                <p className="text-3xl font-bold text-gray-900">{tables.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mesas Grid */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Layout das Mesas</h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 font-medium">Livre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 font-medium">Ocupada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600 font-medium">Aguardando</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 font-medium">Limpeza</span>
                </div>
              </div>
            </div>
          </div>
          
          {tables.length === 0 ? (
            <div className="text-center py-16">
              <Users size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">Nenhuma mesa criada</h3>
              <p className="text-gray-500 mb-6">Crie sua primeira mesa para começar</p>
              <button
                onClick={() => setShowCreateTable(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Criar Primeira Mesa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {tables.map((table) => (
                <div key={table.id} className="relative group">
                  <button
                    onClick={() => openSaleModal(table)}
                    className="w-full aspect-square p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 bg-white hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-105"
                  >
                    {/* Status indicator */}
                    <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${getStatusColor(table.status)}`}></div>
                    
                    {/* Mesa icon */}
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                      <Users size={24} className="text-indigo-600" />
                    </div>
                    
                    {/* Mesa info */}
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-lg">{table.name}</div>
                      <div className="text-sm text-gray-500">{table.capacity} lugares</div>
                      <div className="text-xs text-gray-600 mt-2 font-medium">
                        {getStatusLabel(table.status)}
                      </div>
                      {table.location && (
                        <div className="text-xs text-gray-400 mt-1">{table.location}</div>
                      )}
                    </div>

                    {/* Venda ativa indicator */}
                    {table.current_sale_id && (
                      <div className="absolute bottom-3 left-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTable(table);
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Venda */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{selectedTable.name}</h2>
                  <p className="text-indigo-100 text-lg">{selectedTable.capacity} lugares • {getStatusLabel(selectedTable.status)}</p>
                  {currentSale && (
                    <p className="text-indigo-200 text-sm mt-1">
                      Venda #{currentSale.sale_number} • Aberta em {new Date(currentSale.opened_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Painel de Produtos */}
              <div className="w-2/3 p-8 border-r border-gray-200 overflow-y-auto">
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search size={24} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar produtos..."
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                      />
                    </div>
                  </div>

                  {/* Categorias */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const isActive = selectedCategory === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Icon size={20} />
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid de Produtos */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Package size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">
                      {searchTerm || selectedCategory !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Tente outro termo de busca' : 'Configure produtos no sistema primeiro'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all duration-300 text-left group hover:scale-105"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-lg">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-500 font-mono mt-1">{product.code}</p>
                            {product.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                            )}
                          </div>
                          {product.is_weighable && (
                            <div className="ml-3">
                              <div className="bg-blue-100 rounded-lg p-2">
                                <Scale size={20} className="text-blue-600" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xl font-bold text-green-600">
                            {product.is_weighable 
                              ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                              : formatPrice(product.unit_price || 0)
                            }
                          </div>
                          <div className="bg-indigo-100 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={20} className="text-indigo-600" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Painel de Venda */}
              <div className="w-1/3 p-8 bg-gray-50 overflow-y-auto">
                <div className="space-y-8">
                  {/* Dados do Cliente */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 text-xl">Dados do Cliente</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Nome do cliente"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Pessoas
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={customerCount}
                          onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Carrinho */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                      <ShoppingCart size={24} />
                      Pedido ({cart.length})
                    </h3>
                    
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">Adicione produtos ao pedido</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.product_code} className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{item.product_name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {item.is_weighable && item.weight_kg 
                                    ? `${item.weight_kg.toFixed(3)}kg`
                                    : `${item.quantity}x ${formatPrice(item.unit_price || 0)}`
                                  }
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-green-600 text-lg">{formatPrice(item.subtotal)}</div>
                                <button
                                  onClick={() => removeFromCart(item.product_code)}
                                  className="text-red-500 hover:text-red-700 text-sm mt-1 font-medium"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                            
                            {!item.is_weighable && (
                              <div className="flex items-center justify-center gap-4">
                                <button
                                  onClick={() => updateCartQuantity(item.product_code, item.quantity - 1)}
                                  className="w-10 h-10 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center justify-center transition-colors"
                                >
                                  <Minus size={18} />
                                </button>
                                <span className="w-16 text-center font-bold text-xl">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.product_code, item.quantity + 1)}
                                  className="w-10 h-10 bg-green-500 text-white rounded-xl hover:bg-green-600 flex items-center justify-center transition-colors"
                                >
                                  <Plus size={18} />
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
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold">Total:</span>
                        <span className="text-3xl font-bold">{formatPrice(getCartTotal())}</span>
                      </div>
                    </div>
                  )}

                  {/* Pagamento */}
                  {cart.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                        <DollarSign size={24} />
                        Pagamento
                      </h3>
                      
                      <div className="space-y-4">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
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
                            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                            placeholder="Troco para (opcional)"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="space-y-4">
                    {cart.length > 0 && (
                      <button
                        onClick={finalizeSale}
                        disabled={!customerName || saving || (!isCashRegisterOpen && checkSupabaseConfig())}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-5 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-3 shadow-lg"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <Receipt size={24} />
                            Finalizar Venda
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowSaleModal(false)}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-2xl font-semibold text-lg transition-colors"
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Informar Peso</h3>
              <button
                onClick={() => setShowWeightModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={28} />
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                <h4 className="font-bold text-blue-900 text-xl">{selectedWeightProduct.name}</h4>
                <p className="text-blue-700 text-lg mt-2">
                  {formatPrice((selectedWeightProduct.price_per_gram || 0) * 1000)}/kg
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={productWeight}
                  onChange={(e) => setProductWeight(e.target.value)}
                  className="w-full p-6 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-3xl font-bold"
                  autoFocus
                />
              </div>

              {productWeight && !isNaN(parseFloat(productWeight)) && (
                <div className="bg-green-50 rounded-2xl p-6">
                  <div className="text-sm text-green-700 mb-2 font-semibold">Total:</div>
                  <div className="text-3xl font-bold text-green-800">
                    {formatPrice(parseFloat(productWeight) * (selectedWeightProduct.price_per_gram || 0) * 1000)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowWeightModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-2xl font-semibold text-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleWeightConfirm}
                disabled={!productWeight || parseFloat(productWeight) <= 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-4 rounded-2xl font-semibold text-lg transition-colors"
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Nova Mesa</h3>
              <button
                onClick={() => setShowCreateTable(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={28} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  placeholder="Ex: 7"
                />
                {availableNumbers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Números disponíveis:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableNumbers.map(num => (
                        <button
                          key={num}
                          onClick={() => {
                            setNewTableNumber(num.toString());
                            setNewTableName(`Mesa ${num}`);
                          }}
                          className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  placeholder="Ex: Mesa 7"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Capacidade
                </label>
                <select
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 4 }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                >
                  <option value={2}>2 lugares</option>
                  <option value={4}>4 lugares</option>
                  <option value={6}>6 lugares</option>
                  <option value={8}>8 lugares</option>
                  <option value={10}>10 lugares</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Localização (opcional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  placeholder="Ex: Varanda, Salão principal"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowCreateTable(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-2xl font-semibold text-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                disabled={!formData.number || !formData.name || saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-4 rounded-2xl font-semibold text-lg transition-colors"
              >
                {saving ? 'Criando...' : 'Criar Mesa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;