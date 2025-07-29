import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, TrendingUp, Package } from 'lucide-react';

const PDVReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');

  const reportTypes = [
    {
      id: 'inventory',
      name: 'Relatório de Estoque',
      description: 'Produtos em estoque, baixo estoque e movimentações',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      id: 'performance',
      name: 'Relatório de Performance',
      description: 'Análise de vendas por operador e período',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      id: 'financial',
      name: 'Relatório Financeiro',
      description: 'Resumo financeiro completo e análises',
      icon: BarChart3,
      color: 'bg-purple-500'
    }
  ];

  const generateReport = (reportId: string) => {
    setSelectedReport(reportId);
    
    // Simular geração de relatório
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
    successMessage.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Relatório gerado com sucesso!
    `;
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
      if (document.body.contains(successMessage)) {
        document.body.removeChild(successMessage);
      }
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={24} className="text-blue-600" />
            Outros Relatórios - Loja 1
          </h2>
          <p className="text-gray-600">Relatórios gerais e análises do sistema</p>
        </div>
      </div>

      {/* Tipos de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className={`${report.color} rounded-full p-3`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{report.name}</h3>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{report.description}</p>
              
              <button
                onClick={() => generateReport(report.id)}
                className={`w-full ${report.color} hover:opacity-90 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
              >
                <Download size={16} />
                Gerar Relatório
              </button>
            </div>
          );
        })}
      </div>

      {/* Relatórios Recentes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-gray-600" />
          Relatórios Recentes
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Relatório de Vendas - Hoje</p>
              <p className="text-sm text-gray-600">Gerado em {new Date().toLocaleString('pt-BR')}</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              Visualizar
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Relatório de Caixa - Ontem</p>
              <p className="text-sm text-gray-600">Gerado em {new Date(Date.now() - 86400000).toLocaleString('pt-BR')}</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              Visualizar
            </button>
          </div>
        </div>
      </div>

      {/* Configurações de Relatórios */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações</h3>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Gerar relatórios automaticamente
              </span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Incluir gráficos nos relatórios
              </span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Enviar relatórios por email
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDVReports;