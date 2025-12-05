import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyzeFactoryData } from '../services/geminiService';
import { Bot, RefreshCw, AlertTriangle, TrendingUp, Package, Activity, List, Clock } from 'lucide-react';
import { OrderStatus } from '../types';

export const Dashboard = () => {
  const { orders, products } = useStore();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // KPIs
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status !== OrderStatus.CONCLUIDO).length;
  const completedOrders = orders.filter(o => o.status === OrderStatus.CONCLUIDO).length;
  const lowStockProducts = products.filter(p => p.stockRaw < 100);

  // Data for Charts
  const statusData = Object.values(OrderStatus).map(status => {
    const formatName = (s: string) => {
        const map: Record<string, string> = {
            'CRIADO': 'Novo',
            'ANALISE_PCP': 'PCP',
            'EM_PRODUCAO': 'Produção',
            'QUALIDADE_PENDENTE': 'Qualidade',
            'REPROVADO': 'Reprovado',
            'EM_MONTAGEM': 'Montagem',
            'EM_EMBALAGEM': 'Embalagem',
            'AGUARDANDO_EXPEDICAO': 'Expedição',
            'EM_FATURAMENTO': 'Faturam.',
            'EM_TRANSPORTE': 'Transp.',
            'CONCLUIDO': 'Fim'
        };
        return map[s] || s;
    };
    return {
        name: formatName(status),
        count: orders.filter(o => o.status === status).length
    };
  });

  const priorityData = [
    { name: 'Alta', value: orders.filter(o => o.priority === 'ALTA').length, color: '#ef4444' },
    { name: 'Média', value: orders.filter(o => o.priority === 'MEDIA').length, color: '#f59e0b' },
    { name: 'Baixa', value: orders.filter(o => o.priority === 'BAIXA').length, color: '#10b981' },
  ].filter(d => d.value > 0);

  const stockData = products.slice(0, 6).map(p => ({
    name: p.sku,
    raw: p.stockRaw,
    finished: p.stockFinished
  }));

  const handleAiAnalysis = async () => {
    setIsLoadingAi(true);
    const result = await analyzeFactoryData(orders, products);
    setAiAnalysis(result);
    setIsLoadingAi(false);
  };

  const formatStatus = (s: string) => {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Industrial</h1>
          <p className="text-gray-500">Indicadores de performance e status da fábrica.</p>
        </div>
        <button
          onClick={handleAiAnalysis}
          disabled={isLoadingAi}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isLoadingAi ? <RefreshCw className="animate-spin" size={20} /> : <Bot size={20} />}
          <span>{isLoadingAi ? 'Analisando...' : 'Inteligência Artificial'}</span>
        </button>
      </div>

      {aiAnalysis && (
        <div className="bg-white border-l-4 border-purple-500 p-6 rounded-lg shadow-sm animate-fade-in">
            <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-2 rounded-full">
                    <Bot className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Análise Inteligente</h3>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                        {aiAnalysis}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500">Pedidos em Aberto</p>
              <h3 className="text-3xl font-extrabold text-blue-600 mt-2">{pendingOrders}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500">Pedidos Concluídos</p>
              <h3 className="text-3xl font-extrabold text-green-600 mt-2">{completedOrders}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500">Estoque Crítico</p>
              <h3 className="text-3xl font-extrabold text-red-600 mt-2">{lowStockProducts.length}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Itens abaixo do mínimo</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500">Total SKUs</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{products.length}</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Package className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Status Bar Chart - Takes 2/3 space */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Volume de Pedidos por Estágio</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
              />
              <Bar dataKey="count" name="Qtd Pedidos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Pie Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Distribuição por Prioridade</h3>
          <div className="h-full">
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Níveis de Estoque (Top SKUs)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend />
              <Bar dataKey="raw" name="Matéria Prima" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              <Bar dataKey="finished" name="Prod. Acabado" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <List className="mr-2 text-blue-600" /> Lista Geral de Pedidos
            </h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{orders.length} pedidos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-900">
            <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-800">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nº Externo</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data Entrega</th>
                <th className="px-6 py-4">Prioridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr 
                  key={order.id} 
                  className={`transition-colors border-l-4 ${
                    order.priority === 'ALTA' 
                    ? 'bg-red-50 hover:bg-red-100 border-l-red-500' 
                    : 'hover:bg-gray-50 border-l-transparent'
                  }`}
                >
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {order.id}
                    {order.priority === 'ALTA' && <AlertTriangle size={14} className="inline ml-1 text-red-600" />}
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-mono">{order.externalId || '-'}</td>
                  <td className="px-6 py-4 text-gray-900">{order.customerName}</td>
                  <td className="px-6 py-4 font-bold text-green-700">R$ {order.totalValue.toFixed(2)}</td>
                  <td className="px-6 py-4">
                     <span className={`text-xs px-2 py-1 rounded font-bold
                       ${order.status === OrderStatus.CONCLUIDO ? 'bg-green-200 text-green-900' : 
                         order.status === OrderStatus.REPROVADO ? 'bg-red-200 text-red-900' :
                         'bg-blue-100 text-blue-900'
                       }`}>
                       {formatStatus(order.status)}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 flex items-center">
                     <Clock size={14} className="mr-1 text-gray-400" />
                     {new Date(order.deliveryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`text-xs px-2 py-1 rounded-full
                       ${order.priority === 'ALTA' ? 'bg-red-100 text-red-800 font-bold' : 
                         order.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' : 
                         'bg-green-50 text-green-800'}`}>
                       {order.priority}
                     </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                  <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">Nenhum pedido encontrado.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};