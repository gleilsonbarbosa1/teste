import React, { useState, useEffect } from 'react';
import { useStore2Products } from '../../hooks/useStore2Products';
import { useImageUpload } from '../../hooks/useImageUpload';
import { Calculator, Search, Package, Scale, Plus, Minus, Trash2, ShoppingCart, User, Phone, CreditCard, Banknote, QrCode } from 'lucide-react';

interface Store2PDVSalesScreenProps {
  operator?: any;
  scaleHook?: any;
}

const Store2PDVSalesScreen: React.FC<Store2PDVSalesScreenProps> = ({ operator, scaleHook }) => {
  const { products, loading: productsLoading } = useStore2Products();
  const { getProductImage } = useImageUpload();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [imagesLoading, setImagesLoading] = useState(false);

  const categories = [
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'acai', label: 'Açaí' },
    { id: 'sorvetes', label: 'Sorvetes' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'outros', label: 'Outros' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory && product.is_active;
  });

  // Carregar imagens dos produtos com tratamento de erro melhorado
  useEffect(() => {
    const loadProductImages = async () => {
      if (products.length === 0) return;
      
      setImagesLoading(true);
      const images: Record<string, string> = {};
      let successCount = 0;
      let errorCount = 0;
      
      console.log('🔄 Iniciando carregamento de imagens para', products.length, 'produtos da Loja 2');
      
      // Carregar imagens em lotes menores para evitar sobrecarga
      const batchSize = 5;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (product) => {
            try {
              const savedImage = await getProductImage(product.id);
              if (savedImage) {
                images[product.id] = savedImage;
                successCount++;
                console.log(`✅ Imagem carregada para ${product.name}`);
              }
            } catch (error) {
              errorCount++;
              console.warn(`⚠️ Erro ao carregar imagem para ${product.name}:`, error);
              // Não falhar o carregamento por causa de uma imagem
            }
          })
        );
        
        // Pequena pausa entre lotes para não sobrecarregar
        if (i + batchSize < products.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setProductImages(images);
      setImagesLoading(false);
      
      console.log(`📊 Carregamento de imagens concluído: ${successCount} sucessos, ${errorCount} erros`);
    };

    // Só carregar imagens se tiver produtos e Supabase estiver configurado
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (products.length > 0 && supabaseUrl && supabaseKey && 
        !supabaseUrl.includes('placeholder') && 
        supabaseKey !== 'your_supabase_anon_key_here') {
      loadProductImages();
    } else {
      console.log('⚠️ Pulando carregamento de imagens - Supabase não configurado ou sem produtos');
      setImagesLoading(false);
    }
  }, [products, getProductImage]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.product.is_weighable 
        ? (item.product.price_per_gram || 0) * 1000 
        : (item.product.unit_price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando produtos da Loja 2...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calculator size={24} className="text-blue-600" />
            PDV - Loja 2
          </h2>
          <p className="text-gray-600">Sistema de vendas da Loja 2</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Busca e Filtros */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Produtos ({filteredProducts.length})
              {imagesLoading && <span className="text-blue-600 text-sm ml-2">(Carregando imagens...)</span>}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {productImages[product.id] ? (
                        <img 
                          src={productImages[product.id]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="text-gray-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                          }}
                        />
                      ) : product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="text-gray-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                          }}
                        />
                      ) : (
                        <Package size={24} className="text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{product.name}</h4>
                      <p className="text-sm text-gray-600">Código: {product.code}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {product.is_weighable ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Scale size={14} />
                              <span className="font-medium">
                                {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium text-green-600">
                              {formatPrice(product.unit_price || 0)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart size={20} />
              Carrinho ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Carrinho vazio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{item.product.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatPrice(
                            (item.product.is_weighable 
                              ? (item.product.price_per_gram || 0) * 1000 
                              : (item.product.unit_price || 0)
                            ) * item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatPrice(getCartTotal())}</span>
                  </div>
                </div>

                <button
                  disabled={cart.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Finalizar Venda
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store2PDVSalesScreen;