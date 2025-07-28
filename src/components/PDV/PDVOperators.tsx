import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit3, Trash2, Search, Eye, EyeOff, Lock, Save, User } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';

interface PDVOperator {
  id: string;
  name: string;
  code: string;
  password_hash: string;
  is_active: boolean;
  permissions: {
    can_discount: boolean;
    can_cancel: boolean;
    can_manage_products: boolean;
    can_view_sales?: boolean;
    can_view_cash_register?: boolean;
    can_view_products?: boolean;
    can_view_orders?: boolean;
    can_view_reports?: boolean;
    can_view_sales_report?: boolean;
    can_view_cash_report?: boolean;
    can_view_operators?: boolean;
    can_view_expected_balance?: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

const PDVOperators: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [operators, setOperators] = useState<PDVOperator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOperator, setEditingOperator] = useState<PDVOperator | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load operators from localStorage
  useEffect(() => {
    const savedOperators = localStorage.getItem('pdv_operators');
    if (savedOperators) {
      try {
        const parsedOperators = JSON.parse(savedOperators);
        setOperators(parsedOperators);
      } catch (error) {
        console.error('Erro ao carregar operadores:', error);
      }
    } else {
      // Initialize with default admin operator
      const defaultOperators: PDVOperator[] = [
        {
          id: '1',
          name: 'Administrador',
          code: 'ADMIN',
          password_hash: 'elite2024',
          is_active: true,
          permissions: {
            can_discount: true,
            can_cancel: true,
            can_manage_products: true,
            can_view_sales: true,
            can_view_cash_register: true,
            can_view_products: true,
            can_view_orders: true,
            can_view_reports: true,
            can_view_sales_report: true,
            can_view_cash_report: true,
            can_view_operators: true,
            can_view_expected_balance: true
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null
        }
      ];
      setOperators(defaultOperators);
      localStorage.setItem('pdv_operators', JSON.stringify(defaultOperators));
    }
  }, []);

  // Save operators to localStorage
  const saveOperators = (updatedOperators: PDVOperator[]) => {
    setOperators(updatedOperators);
    localStorage.setItem('pdv_operators', JSON.stringify(updatedOperators));
  };

  const filteredOperators = searchTerm
    ? operators.filter(operator => 
        operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : operators;

  const handleCreate = () => {
    setEditingOperator({
      id: Date.now().toString(),
      name: '',
      code: '',
      password_hash: '',
      is_active: true,
      permissions: {
        can_discount: false,
        can_cancel: false,
        can_manage_products: false,
        can_view_sales: true,
        can_view_cash_register: true,
        can_view_products: true,
        can_view_orders: true,
        can_view_reports: false,
        can_view_sales_report: false,
        can_view_cash_report: false,
        can_view_operators: false,
        can_view_expected_balance: false
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editingOperator) return;

    if (!editingOperator.name.trim() || !editingOperator.code.trim()) {
      alert('Nome e código são obrigatórios');
      return;
    }

    if (isCreating && !editingOperator.password_hash.trim()) {
      alert('Senha é obrigatória para novos operadores');
      return;
    }

    // Check if code already exists
    const existingOperator = operators.find(o => o.code === editingOperator.code && o.id !== editingOperator.id);
    if (existingOperator) {
      alert('Código já existe');
      return;
    }

    setSaving(true);
    
    setTimeout(() => {
      if (isCreating) {
        const newOperators = [...operators, editingOperator];
        saveOperators(newOperators);
      } else {
        const updatedOperators = operators.map(o => o.id === editingOperator.id ? editingOperator : o);
        saveOperators(updatedOperators);
      }
      
      setEditingOperator(null);
      setIsCreating(false);
      setSaving(false);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Operador ${isCreating ? 'criado' : 'atualizado'} com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    }, 500);
  };

  const handleDelete = (id: string, name: string) => {
    if (id === '1') {
      alert('Não é possível excluir o operador administrador padrão');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o operador "${name}"?`)) {
      const updatedOperators = operators.filter(o => o.id !== id);
      saveOperators(updatedOperators);
    }
  };

  const handleToggleActive = (operator: PDVOperator) => {
    if (operator.id === '1') {
      alert('Não é possível desativar o operador administrador padrão');
      return;
    }

    const updatedOperators = operators.map(o => 
      o.id === operator.id ? { ...o, is_active: !o.is_active } : o
    );
    saveOperators(updatedOperators);
  };

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_operators')} showMessage={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Users size={24} className="text-orange-600" />
              Gerenciar Operadores
            </h2>
            <p className="text-gray-600">Configure operadores e suas permissões no PDV</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Operador
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar operadores..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Operators Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Operador</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Permissões</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Último Acesso</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{operator.code}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-700">{operator.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {operator.permissions?.can_discount && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Desconto
                          </span>
                        )}
                        {operator.permissions?.can_cancel && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Cancelar
                          </span>
                        )}
                        {operator.permissions?.can_view_expected_balance && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Ver Saldo
                          </span>
                        )}
                        {operator.permissions?.can_manage_products && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Produtos
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleActive(operator)}
                        disabled={operator.id === '1'}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          operator.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${operator.id === '1' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {operator.is_active ? (
                          <>
                            <Eye size={12} />
                            Ativo
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-500">
                        {operator.last_login 
                          ? new Date(operator.last_login).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingOperator(operator);
                            setIsCreating(false);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar operador"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(operator.id, operator.name)}
                          disabled={operator.id === '1'}
                          className={`p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors ${
                            operator.id === '1' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Excluir operador"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOperators.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum operador encontrado' : 'Nenhum operador cadastrado'}
              </p>
            </div>
          )}
        </div>

        {/* Edit/Create Modal */}
        {editingOperator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isCreating ? 'Novo Operador' : 'Editar Operador'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do Operador *
                  </label>
                  <input
                    type="text"
                    value={editingOperator.code}
                    onChange={(e) => setEditingOperator({
                      ...editingOperator,
                      code: e.target.value.toUpperCase()
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: OP001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={editingOperator.name}
                    onChange={(e) => setEditingOperator({
                      ...editingOperator,
                      name: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nome completo do operador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha {isCreating ? '*' : '(deixe em branco para manter a atual)'}
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={editingOperator.password_hash}
                      onChange={(e) => setEditingOperator({
                        ...editingOperator,
                        password_hash: e.target.value
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={isCreating ? "Senha" : "Nova senha (opcional)"}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissões de Vendas
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingOperator.permissions?.can_discount || false}
                        onChange={(e) => setEditingOperator({
                          ...editingOperator,
                          permissions: {
                            ...editingOperator.permissions || {},
                            can_discount: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Aplicar descontos
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingOperator.permissions?.can_cancel || false}
                        onChange={(e) => setEditingOperator({
                          ...editingOperator,
                          permissions: {
                            ...editingOperator.permissions || {},
                            can_cancel: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Cancelar vendas
                      </span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingOperator.permissions?.can_view_expected_balance || false}
                        onChange={(e) => setEditingOperator({
                          ...editingOperator,
                          permissions: {
                            ...editingOperator.permissions || {},
                            can_view_expected_balance: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Ver saldo esperado no fechamento de caixa
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissões de Acesso aos Menus
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingOperator.permissions?.can_view_sales || false}
                        onChange={(e) => setEditingOperator({
                          ...editingOperator,
                          permissions: {
                            ...editingOperator.permissions || {},
                            can_view_sales: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Acessar menu de vendas
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingOperator.permissions?.can_view_cash_register || false}
                        onChange={(e) => setEditingOperator({
                          ...editingOperator,
                          permissions: {
                            ...editingOperator.permissions || {},
                            can_view_cash_register: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Acessar controle de caixa
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingOperator.permissions?.can_view_products || false}
                        onChange={(e) => setEditingOperator({
                          ...editingOperator,
                          permissions: {
                            ...editingOperator.permissions || {},
                            can_view_products: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Acessar gerenciamento de produtos
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingOperator.permissions?.can_view_orders || false}
                        onChange={(e) => setEditingOperator({
                          ...editingOperator,
                          permissions: {
                            ...editingOperator.permissions || {},
                            can_view_orders: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Acessar pedidos de delivery
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingOperator.permissions?.can_view_reports || false}
                        onChange={(e) => setEditingOperator({
                          ...editingOperator,
                          permissions: {
                            ...editingOperator.permissions || {},
                            can_view_reports: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Acessar relatórios
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingOperator.is_active}
                      onChange={(e) => setEditingOperator({
                        ...editingOperator,
                        is_active: e.target.checked
                      })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Operador ativo
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingOperator(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !editingOperator.name.trim() ||
                    !editingOperator.code.trim()
                  }
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {isCreating ? 'Criar Operador' : 'Salvar Alterações'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default PDVOperators;