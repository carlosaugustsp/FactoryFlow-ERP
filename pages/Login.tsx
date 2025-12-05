import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Zap, Lock, User, Database, RefreshCw } from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

export const Login = () => {
  const { login, users, initializeDatabase, loading } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    
    const success = await login(username, password);
    if (!success) {
      setError('Usuário ou senha incorretos. (No Firebase, use formato de e-mail)');
    }
    setIsLoggingIn(false);
  };

  const handleInitDB = async () => {
      if(confirm("Isso irá criar os dados padrão no seu banco de dados Firebase. Continuar?")) {
          await initializeDatabase();
      }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        {!isFirebaseConfigured && (
            <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 text-xs p-2 text-center rounded-t-2xl">
                Modo Offline (Sem Firebase Configurado)
            </div>
        )}

        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FactoryFlow</h1>
          <p className="text-gray-500 mt-2">Sistema Integrado de Manufatura</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {isFirebaseConfigured ? 'E-mail' : 'Usuário'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={isFirebaseConfigured ? "text" : "text"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder={isFirebaseConfigured ? "admin@factoryflow.app" : "Digite seu usuário"}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Digite sua senha"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">Senha padrão: 123456</p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center justify-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform disabled:opacity-50 flex justify-center"
          >
            {isLoggingIn || loading ? <RefreshCw className="animate-spin" /> : 'Entrar'}
          </button>
        </form>

        {/* Database Initialization for First Run */}
        {isFirebaseConfigured && (
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <button 
                    onClick={handleInitDB}
                    className="text-xs text-blue-600 hover:underline flex items-center justify-center w-full"
                >
                    <Database size={14} className="mr-1" /> Inicializar Dados Padrão (Primeiro Acesso)
                </button>
                <p className="text-[10px] text-gray-400 mt-2">
                    Use isto apenas na primeira vez para preencher o banco de dados vazio.
                </p>
            </div>
        )}

        {!isFirebaseConfigured && (
            <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400 mb-2">Usuários Locais:</p>
            <div className="flex flex-wrap gap-2 justify-center">
                {users.map(u => (
                <button 
                    key={u.id}
                    onClick={() => {
                    setUsername(u.username);
                    setPassword('123456');
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 transition-colors"
                >
                    {u.username}
                </button>
                ))}
            </div>
            </div>
        )}
      </div>
    </div>
  );
};