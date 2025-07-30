import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { usePDVCashRegister } from '../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../hooks/useStore2PDVCashRegister';
import { useOrders } from '../hooks/useOrders';
import { useAttendance } from '../hooks/useAttendance';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGuard from './PermissionGuard';
import AttendantPanel from './Orders/AttendantPanel';
import CashRegisterMenu from './PDV/CashRegisterMenu';
import Store2CashRegisterMenu from './Store2/Store2CashRegisterMenu';
import SalesHistory from './Orders/SalesHistory';
import TableSalesPanel from './TableSales/TableSalesPanel';
import { 
  Package, 
  DollarSign, 
  Users, 
  BarChart3,
  FileText,
  LogOut,
  Settings,
  ArrowLeft,
  Clock,
  ShoppingCart,
  Calculator,
  Store
} from 'lucide-react';

interface UnifiedAttendancePageProps {
  operator?: any;
  onLogout?: () => void;
}

const UnifiedAttendancePage: React.FC<UnifiedAttendancePageProps> = ({ 
  operator, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'cash' | 'history' | 'tables' | 'reports'>('orders');
  const { hasPermission } = usePermissions(operator);
  const { orders, loading: ordersLoading } = useOrders();
  const { isOpen: isCashRegisterOpen } = usePDVCashRegister();
  const [storeId, setStoreId] = useState<1 | 2>(1); // Default to store 1

  // Determine store ID based on current URL or operator
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('atendimento2')) {
      setStoreId(2);
    } else {
      setStoreId(1);
    }
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const availableTabs = [
    {
      id: 'orders' as const,
      label: storeId === 1 ? 'Pedidos' : 'Atendimento',
      icon: Package,
      color: 'bg-purple-600',
      description: storeId === 1 ? 'Gerenciar pedidos de delivery' : 'Sistema de atendimento da Loja 2',
      permission: 'can_view_orders'
    },
    {
      id: 'cash' as const,
      label: 'Caixa',
      icon: DollarSign,
      color: 'bg-green-600',
      description: 'Controle de caixa e movimentações',
      permission: 'can_view_cash_register'
    },
    {
      id: 'history' as const,
      label: 'Histórico',
      icon: Clock,
      color: 'bg-blue-600',
      description: 'Histórico de vendas do dia',
      permission: 'can_view_sales'
    },
    {
      id: 'tables' as const,
      label: 'Mesas',
      icon: Users,
      color: 'bg-orange-600',
      description: 'Gerenciar vendas de mesa',
      permission: 'can_view_sales'
    },
    {
      id: 'reports' as const,
      label: 'Relatórios',
      icon: BarChart3,
      color: 'bg-indigo-600',
      description: 'Relatórios e análises',
      permission: 'can_view_reports'
    }
  ].filter(tab => {
    // For store 2, don't show orders tab since it doesn't have delivery
    if (storeId === 2 && tab.id === 'orders') {
      return false;
    }
    return hasPermission(tab.permission as any);
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return storeId === 1 ? (
          <AttendantPanel />
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Loja 2 - Sistema de Atendimento
            </h3>
            <p className="text-gray-500">
              A Loja 2 não possui sistema de delivery.
            </p>
          </div>
        );
      
      case 'cash':
        return storeId === 1 ? (
          <CashRegisterMenu operator={operator} />
        ) : (
          <Store2CashRegisterMenu />
        );
      
      case 'history':
        return <SalesHistory storeId={storeId} />;
      
      case 'tables':
        return <TableSalesPanel storeId={storeId} />;
      
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={24} className="text-indigo-600" />
                Relatórios - {storeId === 1 ? 'Loja 1' : 'Loja 2'}
              </h2>
              <p className="text-gray-600 mb-6">
                Acesse os relatórios detalhados das operações da loja.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <BarChart3 size={20} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-800">Relatórios Avançados</h3>
                  </div>
                  <p className="text-blue-700 text-sm mb-4">
                    Acesse relatórios detalhados através do sistema PDV completo.
                  </p>
                  <button
                    onClick={() => window.location.href = storeId === 1 ? '/pdv' : '/atendimento2'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Acessar Sistema PDV
                  </button>
                </div>
                
                {storeId === 2 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-purple-100 rounded-full p-2">
                        <FileText size={20} className="text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-purple-800">Relatórios Específicos</h3>
                    </div>
                    <p className="text-purple-700 text-sm mb-4">
                      Relatórios exclusivos da Loja 2 com análises detalhadas.
                    </p>
                    <button
                      onClick={() => window.location.href = '/relatorios_loja2'}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Relatórios Loja 2
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return <AttendantPanel />;
    }
  };

  if (availableTabs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <Settings size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar nenhuma funcionalidade deste sistema.
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Fazer Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <Calculator size={24} className="text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Atendimento - {storeId === 1 ? 'Loja 1' : 'Loja 2'}
                </h1>
                <p className="text-gray-600">
                  {storeId === 1 ? 'Elite Açaí - Unidade Principal' : 'Elite Açaí - Unidade 2'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {operator && (
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <Users size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{operator.name}</span>
                </div>
              )}
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                title="Voltar ao site"
              >
                <ArrowLeft size={16} />
                Site
              </button>
              
              {onLogout && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  title="Sair do sistema"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Status do Caixa */}
        {!isCashRegisterOpen && storeId === 1 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <DollarSign size={20} className="text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Caixa Fechado</h3>
                <p className="text-yellow-700 text-sm">
                  Algumas funcionalidades podem estar limitadas. Abra um caixa na aba "Caixa".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-gray-600" />
              Sistema de Atendimento
            </h2>
            <div className="text-sm text-gray-500">
              {availableTabs.length} módulo(s) disponível(is)
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    isActive
                      ? `${tab.color} text-white border-transparent shadow-lg transform scale-105`
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`rounded-full p-2 ${
                      isActive ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Icon size={20} className={isActive ? 'text-white' : 'text-gray-600'} />
                    </div>
                    <h3 className="font-semibold">{tab.label}</h3>
                  </div>
                  <p className={`text-sm ${
                    isActive ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {tab.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default UnifiedAttendancePage;