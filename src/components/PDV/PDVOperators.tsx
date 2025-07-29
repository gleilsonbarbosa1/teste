import React, { useState } from 'react';
import { Users, Plus, Edit3, Trash2, Search, Eye, EyeOff, Lock, Save, User } from 'lucide-react';

const PDVOperators: React.FC = () => {
  const [operators, setOperators] = useState([
    {
      id: '1',
      name: 'Administrador',
      code: 'ADMIN',
      is_active: true,
      permissions: {
        can_discount: true,
        can_cancel: true,
        can_manage_products: true,
        can_view_sales: true,
        can_view_cash_register: true
      },
      created_at: new Date().toISOString()
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" />
            Gerenciar Operadores - Loja 1
          </h2>
          <p className="text-gray-600">Configure operadores e suas permissões</p>
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <Plus size={20} />
          Novo Operador
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Gerenciamento de Operadores
          </h3>
          <p className="text-gray-500">
            Configure operadores, códigos de acesso e permissões do sistema PDV da Loja 1.
          </p>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              <strong>Operador Atual:</strong> {operators[0].name} ({operators[0].code})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDVOperators;