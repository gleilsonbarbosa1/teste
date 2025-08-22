import React, { useState } from 'react';
import { Calculator, Users, DollarSign, Settings, LogOut, User, AlertCircle } from 'lucide-react';

interface Store2AttendancePanelProps {
  operator?: any;
  onLogout: () => void;
}

const Store2AttendancePanel: React.FC<Store2AttendancePanelProps> = ({ operator, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'tables' | 'cash' | 'settings'>('sales');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sales':
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calculator size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Sistema de Vendas - Loja 2
            </h3>
            <p className="text-gray-500">
              Sistema de vendas presenciais da Loja 2 em desenvolvimento.
            </p>
          </div>
        );
      case 'tables':
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Vendas por Mesa - Loja 2
            </h3>
            <p className="text-gray-500">
              Sistema de vendas por mesa da Loja 2 em desenvolvimento.
            </p>
          </div>
        );
      case 'cash':
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Controle de Caixa - Loja 2
            </h3>
            <p className="text-gray-500">
              Sistema de controle de caixa da Loja 2 em desenvolvimento.
            </p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Settings size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Configurações - Loja 2
            </h3>
            <p className="text-gray-500">
              Configurações específicas da Loja 2 em desenvolvimento.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Atendimento Loja 2</h1>
                <p className="text-gray-600">Elite Açaí - Sistema Exclusivo da Loja 2</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {operator && (
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <User size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{operator.name}</span>
                </div>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'sales'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calculator size={20} />
              Vendas
            </button>
            
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'tables'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              Mesas
            </button>
            
            <button
              onClick={() => setActiveTab('cash')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'cash'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DollarSign size={20} />
              Caixa
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings size={20} />
              Configurações
            </button>
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

export default Store2AttendancePanel;