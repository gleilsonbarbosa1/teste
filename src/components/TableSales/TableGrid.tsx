import React from 'react';
import { Users, User, DollarSign, Package, CheckCircle } from 'lucide-react';
import { RestaurantTable } from '../../types/table-sales';

interface TableGridProps {
  tables: RestaurantTable[];
  onTableClick: (table: RestaurantTable) => void;
}

const TableGrid: React.FC<TableGridProps> = ({ tables, onTableClick }) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'livre': return <CheckCircle size={16} />;
      case 'ocupada': return <User size={16} />;
      case 'aguardando_conta': return <DollarSign size={16} />;
      case 'limpeza': return <Package size={16} />;
      default: return <Users size={16} />;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {tables.map((table) => (
        <div
          key={table.id}
          onClick={() => onTableClick(table)}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(table.status)}`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {getStatusIcon(table.status)}
            </div>
            <h4 className="font-bold text-lg mb-1">Mesa {table.number}</h4>
            <p className="text-sm font-medium mb-2">{table.name}</p>
            
            {table.current_sale && (
              <div className="text-xs space-y-1">
                {table.current_sale.customer_name && (
                  <p>Cliente: {table.current_sale.customer_name}</p>
                )}
                <p>Pessoas: {table.current_sale.customer_count}</p>
                <p className="font-semibold">
                  Total: {formatPrice(table.current_sale.total_amount)}
                </p>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-600">
              Capacidade: {table.capacity} pessoas
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableGrid;