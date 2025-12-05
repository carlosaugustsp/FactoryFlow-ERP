import React from 'react';
import { useStore } from '../context/StoreContext';
import { DEPARTMENT_CONFIG } from '../constants';
import { 
  LogOut, LayoutDashboard, ShoppingCart, Activity, Hammer, 
  CheckCircle, Package, Truck, Receipt, Users, Menu, X, ShieldAlert, Wrench, FileText
} from 'lucide-react';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  if (!currentUser) return <>{children}</>;

  const NavItem = ({ role, icon: Icon, label, hash }: { role?: Role, icon: any, label: string, hash: string }) => {
    const isActive = window.location.hash === hash;
    
    // Permission Logic
    // 1. Admin sees everything.
    // 2. Manager (GERENTE) sees everything EXCEPT Admin users page.
    // 3. Department Users see Dashboard + Their Role.
    
    let canAccess = false;

    if (currentUser.role === Role.ADMIN) {
        canAccess = true;
    } else if (currentUser.role === Role.GERENTE) {
        // Manager sees everything EXCEPT Admin User Management
        canAccess = role !== Role.ADMIN;
    } else {
        // Standard User
        canAccess = role === currentUser.role || !role; // !role means public/dashboard
    }

    if (!canAccess) return null;

    return (
      <button 
        onClick={() => {
          window.location.hash = hash;
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
          isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Activity className="text-blue-500" />
              <h1 className="text-xl font-bold tracking-tight">FactoryFlow</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <NavItem hash="#/" icon={LayoutDashboard} label="Dashboard" />
            
            {(currentUser.role === Role.ADMIN || currentUser.role === Role.GERENTE) && (
                 <NavItem hash="#/relatorios" icon={FileText} label="Relatórios" />
            )}

            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Departamentos
            </div>
            
            <NavItem role={Role.ENGENHARIA} hash="#/engenharia" icon={Wrench} label="Engenharia" />
            <NavItem role={Role.VENDAS} hash="#/vendas" icon={ShoppingCart} label="Vendas" />
            <NavItem role={Role.PCP} hash="#/pcp" icon={Activity} label="PCP" />
            <NavItem role={Role.PRODUCAO} hash="#/producao" icon={Hammer} label="Produção" />
            <NavItem role={Role.QUALIDADE} hash="#/qualidade" icon={ShieldAlert} label="Qualidade" />
            <NavItem role={Role.MONTAGEM} hash="#/montagem" icon={CheckCircle} label="Montagem" />
            <NavItem role={Role.EMBALAGEM} hash="#/embalagem" icon={Package} label="Embalagem" />
            <NavItem role={Role.EXPEDICAO} hash="#/expedicao" icon={Truck} label="Expedição" />
            <NavItem role={Role.FATURAMENTO} hash="#/faturamento" icon={Receipt} label="Faturamento" />
            <NavItem role={Role.TRANSPORTE} hash="#/transporte" icon={Truck} label="Transporte" />

            {currentUser.role === Role.ADMIN && (
              <>
                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </div>
                <NavItem role={Role.ADMIN} hash="#/admin" icon={Users} label="Usuários" />
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3 mb-3 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${DEPARTMENT_CONFIG[currentUser.role]?.color || 'bg-gray-600'}`}>
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{currentUser.name}</p>
                <p className="text-xs text-gray-400 capitalize">{currentUser.role.toLowerCase()}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm lg:hidden h-16 flex items-center px-4 no-print">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold text-gray-800">FactoryFlow ERP</span>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 print-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};