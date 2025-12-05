import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Role, User } from '../types';
import { Trash2, UserPlus, Shield, Edit, X } from 'lucide-react';

export const Admin = () => {
  const { users, addUser, updateUser, removeUser } = useStore();
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: Role.VENDAS });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username) return;

    if (editingId) {
      // Update existing user
      updateUser({
        id: editingId,
        name: formData.name,
        username: formData.username,
        password: formData.password || '123456', // Keep existing logic or fetch real one, for now default/update
        role: formData.role,
      });
      setEditingId(null);
    } else {
      // Create new user
      addUser({
        id: `u-${Date.now()}`,
        name: formData.name,
        username: formData.username,
        password: formData.password || '123456',
        role: formData.role,
      });
    }
    
    setFormData({ name: '', username: '', password: '', role: Role.VENDAS });
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', username: '', password: '', role: Role.VENDAS });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
        <p className="text-gray-500">Controle de acesso e departamentos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User List Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-800">Nome</th>
                <th className="px-6 py-4 font-bold text-gray-800">Usuário</th>
                <th className="px-6 py-4 font-bold text-gray-800">Departamento</th>
                <th className="px-6 py-4 text-right font-bold text-gray-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-700">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <button 
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      {user.role !== Role.ADMIN && (
                        <button 
                          onClick={() => removeUser(user.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span className="flex items-center">
              {editingId ? <Edit size={20} className="mr-2 text-orange-600" /> : <UserPlus size={20} className="mr-2 text-blue-600" />}
              {editingId ? 'Editar Usuário' : 'Novo Usuário'}
            </span>
            {editingId && (
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            )}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username (Login)</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Senha</label>
              <input
                type="text"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white"
                placeholder={editingId ? "Manter atual" : "Padrão: 123456"}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Departamento</label>
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white"
              >
                {Object.values(Role).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <button 
              type="submit"
              className={`w-full text-white py-2 rounded-lg transition-colors font-bold text-sm ${
                editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingId ? 'Atualizar Usuário' : 'Adicionar Usuário'}
            </button>
            {editingId && (
               <button 
                type="button"
                onClick={handleCancelEdit}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-bold text-sm"
              >
                Cancelar
              </button>
            )}
          </form>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
             <div className="flex items-start">
               <Shield className="text-yellow-600 w-5 h-5 mr-2 mt-0.5" />
               <p className="text-xs text-yellow-800">
                 Administradores têm acesso total ao sistema. Cuidado ao conceder permissões.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};