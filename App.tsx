import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Engineering } from './pages/Engineering';
import { DepartmentView } from './components/DepartmentView';
import { Admin } from './pages/Admin';
import { Reports } from './pages/Reports';
import { Role, OrderStatus } from './types';

const AppContent = () => {
  const { currentUser } = useStore();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!currentUser) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentHash) {
      case '#/': return <Dashboard />;
      
      case '#/relatorios':
         return (currentUser.role === Role.ADMIN || currentUser.role === Role.GERENTE) 
            ? <Reports />
            : <div className="p-8 text-center text-gray-500">Acesso restrito</div>;

      case '#/engenharia': 
        // Manager, Admin, and Engineering have access
        return (currentUser.role === Role.ENGENHARIA || currentUser.role === Role.ADMIN || currentUser.role === Role.GERENTE) 
          ? <Engineering /> 
          : <div className="p-8 text-center text-gray-500">Acesso restrito</div>;

      case '#/vendas': return <Sales />;
      
      case '#/pcp': 
        return <DepartmentView 
          title="PCP - Planejamento e Controle" 
          currentRole={currentUser.role}
          viewRole={Role.PCP}
          filterStatus={OrderStatus.ANALISE_PCP} 
        />;
      
      case '#/producao': 
        return <DepartmentView 
          title="Linha de Produção" 
          currentRole={currentUser.role}
          viewRole={Role.PRODUCAO}
          filterStatus={[OrderStatus.EM_PRODUCAO, OrderStatus.REPROVADO]} 
        />;
      
      case '#/qualidade': 
        return <DepartmentView 
          title="Controle de Qualidade" 
          currentRole={currentUser.role}
          viewRole={Role.QUALIDADE}
          filterStatus={OrderStatus.QUALIDADE_PENDENTE} 
          allowReject={true} 
        />;
      
      case '#/montagem': 
        return <DepartmentView 
          title="Montagem" 
          currentRole={currentUser.role}
          viewRole={Role.MONTAGEM}
          filterStatus={OrderStatus.EM_MONTAGEM} 
        />;
      
      case '#/embalagem': 
        return <DepartmentView 
          title="Embalagem" 
          currentRole={currentUser.role}
          viewRole={Role.EMBALAGEM}
          filterStatus={OrderStatus.EM_EMBALAGEM} 
        />;
      
      case '#/expedicao': 
        return <DepartmentView 
          title="Expedição" 
          currentRole={currentUser.role}
          viewRole={Role.EXPEDICAO}
          filterStatus={OrderStatus.AGUARDANDO_EXPEDICAO} 
        />;
      
      case '#/faturamento': 
        return <DepartmentView 
          title="Faturamento" 
          currentRole={currentUser.role}
          viewRole={Role.FATURAMENTO}
          filterStatus={OrderStatus.EM_FATURAMENTO} 
        />;
      
      case '#/transporte': 
        return <DepartmentView 
          title="Transporte" 
          currentRole={currentUser.role}
          viewRole={Role.TRANSPORTE}
          filterStatus={OrderStatus.EM_TRANSPORTE} 
        />;

      case '#/admin':
        return currentUser.role === Role.ADMIN ? <Admin /> : <Dashboard />;

      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;