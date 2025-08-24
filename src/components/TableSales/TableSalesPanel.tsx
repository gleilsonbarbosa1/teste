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
              <h3 className="font-