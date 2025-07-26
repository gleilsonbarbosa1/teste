import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface DeliveryProduct {
  id: string;
  name: string;
  category: 'acai' | 'combo' | 'milkshake' | 'vitamina' | 'sorvetes' | 'bebidas' | 'complementos' | 'sobremesas' | 'outros';
  price: number;
  original_price?: number;
  description: string;
  image_url?: string;
  is_active: boolean;
  is_weighable: boolean;
  price_per_gram?: number;
  complement_groups?: any;
  sizes?: any;
  scheduled_days?: any;
  availability_type?: string;
  created_at: string;
  updated_at: string;
}

export const useDeliveryProducts = () => {
  const [products, setProducts] = useState<DeliveryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando produtos de demonstração');
        
        // Fallback para produtos de demonstração se Supabase não estiver configurado
        const { products: demoProducts } = await import('../data/products');
        const mappedProducts = demoProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category as DeliveryProduct['category'],
          price: product.price,
          original_price: product.originalPrice,
          description: product.description,
          image_url: product.image,
          is_active: product.isActive !== false,
          is_weighable: product.is_weighable || false,
          price_per_gram: product.pricePerGram,
          complement_groups: product.complementGroups,
          sizes: product.sizes,
          scheduled_days: product.scheduledDays,
          availability_type: product.availability?.type || 'always',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        setProducts(mappedProducts);
        setLoading(false);
        return;
      }
      
      console.log('🔄 Carregando produtos do banco de dados...');
      
      const { data, error } = await supabase
        .from('delivery_products')
        .select('*')
        .order('name');

      if (error) throw error;
      
      console.log(`✅ ${data?.length || 0} produtos carregados do banco`);
      setProducts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      console.error('❌ Erro ao carregar produtos:', errorMessage);
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (product: Omit<DeliveryProduct, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🚀 Criando produto:', product);
      
      const { data, error } = await supabase
        .from('delivery_products')
        .insert([{
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => [...prev, data]);
      console.log('✅ Produto criado:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar produto');
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<DeliveryProduct>) => {
    try {
      console.log('✏️ Atualizando produto:', id, updates);
      
      // Remove campos que podem causar conflito
      const { created_at, updated_at, ...cleanUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from('delivery_products')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro detalhado ao atualizar produto:', error);
        throw new Error(`Erro ao atualizar produto: ${error.message || 'Erro desconhecido'}`);
      }
      
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      console.log('✅ Produto atualizado:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao atualizar produto:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Erro desconhecido ao atualizar produto');
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Excluindo produto:', id);
      
      const { error } = await supabase
        .from('delivery_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      console.log('✅ Produto excluído');
    } catch (err) {
      console.error('❌ Erro ao excluir produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
};