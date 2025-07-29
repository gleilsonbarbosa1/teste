import React, { useState } from 'react';
import { Settings, Save, Printer, Scale, Wifi, Database } from 'lucide-react';

const PDVSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    store_name: 'Elite Açaí - Loja 1',
    printer_enabled: true,
    scale_enabled: true,
    auto_print: false,
    sound_enabled: true
  });

  const handleSave = () => {
    // Salvar configurações
    localStorage.setItem('pdv_settings', JSON.stringify(settings));
    
    // Mostrar feedback
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
    successMessage.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Configurações salvas com sucesso!
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
            <Settings size={24} className="text-gray-600" />
            Configurações do Sistema - Loja 1
          </h2>
          <p className="text-gray-600">Personalize o funcionamento do PDV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configurações Gerais */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings size={20} className="text-blue-600" />
            Configurações Gerais
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Loja
              </label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.sound_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, sound_enabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Habilitar sons do sistema
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configurações de Impressora */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Printer size={20} className="text-green-600" />
            Impressora
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.printer_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, printer_enabled: e.target.checked }))}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Impressora habilitada
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.auto_print}
                  onChange={(e) => setSettings(prev => ({ ...prev, auto_print: e.target.checked }))}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Impressão automática
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configurações de Balança */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Scale size={20} className="text-purple-600" />
            Balança
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.scale_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, scale_enabled: e.target.checked }))}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Balança habilitada
                </span>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm">
                <strong>Status:</strong> {settings.scale_enabled ? 'Conectada' : 'Desconectada'}
              </p>
            </div>
          </div>
        </div>

        {/* Status do Sistema */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Database size={20} className="text-indigo-600" />
            Status do Sistema
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Banco de Dados:</span>
              <span className="text-sm font-medium text-green-600">Conectado</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rede:</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Última Sincronização:</span>
              <span className="text-sm font-medium text-gray-700">
                {new Date().toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Save size={20} />
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default PDVSettings;