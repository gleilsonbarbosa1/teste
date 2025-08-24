import React, { useState } from 'react';
import { X, User, Users, Save } from 'lucide-react';
import { RestaurantTable } from '../../types/table-sales';

interface TableSaleModalProps {
  table: RestaurantTable;
  isOpen: boolean;
  onClose: () => void;
  onCreateSale: (tableId: string, customerName?: string, customerCount?: number) => Promise<void>;
}

const TableSaleModal: React.FC<TableSaleModalProps> = ({
  table,
  isOpen,
  onClose,
  onCreateSale
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onCreateSale(table.id, customerName || undefined, customerCount);
      onClose();
      setCustomerName('');
      setCustomerCount(1);
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Abrir Mesa {table.number}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente (opcional)
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do cliente"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Pessoas
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCustomerCount(Math.max(1, customerCount - 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Users size={16} />
              </button>
              <span className="text-xl font-semibold w-12 text-center">{customerCount}</span>
              <button
                type="button"
                onClick={() => setCustomerCount(Math.min(table.capacity, customerCount + 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Users size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Capacidade máxima: {table.capacity} pessoas
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>Mesa:</strong> {table.name}
            </p>
            <p className="text-blue-700 text-xs">
              Capacidade: {table.capacity} pessoas
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Abrindo...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Abrir Mesa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableSaleModal;