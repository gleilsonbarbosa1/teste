import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PDVLogin from './PDVLogin';
import PDVMain from './PDVMain';
import { PDVOperator } from '../../types/pdv';

const PDVPage: React.FC = () => {
  const navigate = useNavigate();
  const [loggedInOperator, setLoggedInOperator] = useState<PDVOperator | null>(() => {
    // Verificar se há operador salvo no localStorage
    try {
      const storedOperator = localStorage.getItem('pdv_operator');
      if (storedOperator) {
        return JSON.parse(storedOperator);
      }
    } catch (error) {
      console.error('Erro ao recuperar operador:', error);
      localStorage.removeItem('pdv_operator');
    }
    return null;
  });

  const handleLogin = (operator: PDVOperator) => {
    console.log('✅ Login PDV bem-sucedido:', operator.name);
    setLoggedInOperator(operator);
    localStorage.setItem('pdv_operator', JSON.stringify(operator));
  };

  const handleLogout = () => {
    console.log('🚪 Logout PDV');
    setLoggedInOperator(null);
    localStorage.removeItem('pdv_operator');
  };

  // Se o operador está logado, mostrar sistema PDV
  if (loggedInOperator) {
    return (
      <PDVMain 
        operator={loggedInOperator}
        onBack={handleLogout}
      />
    );
  }

  // Se não está logado, mostrar tela de login
  return (
    <PDVLogin onLogin={handleLogin} />
  );
};

export default PDVPage;