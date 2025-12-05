import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Printer, AlertTriangle, FileText, Package } from 'lucide-react';
import { OrderStatus } from '../types';

export const Reports = () => {
  const { products, orders } = useStore();
  const [reportType, setReportType] = useState<'LOW_STOCK' | 'RAW_MATERIAL' | 'ORDERS'>('ORDERS');

  const handlePrint = () => {
    window.print();
  };

  // Data Filters
  const lowStockProducts = products.filter(p => p.type === 'PRODUTO_FINAL' && p.stockFinished < 50); // Example threshold
  const lowStockMaterials = products.filter(p => p.type === 'MATERIA_PRIMA' && p.stockRaw < 100);
  const activeOrders = orders.filter(o => o.status !== OrderStatus.CONCLUIDO);

  const getReportTitle = () => {
    switch(reportType) {
      case 'LOW_STOCK': return 'Relatório de Produtos com Estoque Baixo';
      case 'RAW_MATERIAL': return 'Relatório de Matéria Prima Crítica';
      case 'ORDERS': return 'Relatório Geral de Pedidos em Aberto';
      default: return 'Relatório';
    }
  };

  return (
    <div className="space-y-6 print-full">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Gerenciais</h1>
          <p className="text-gray-500">Impressão e análise de dados operacionais.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black flex items-center space-x-2 shadow-sm"
        >
          <Printer size={20} />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      {/* Tabs - Hidden on Print */}
      <div className="flex space-x-4 border-b border-gray-200 no-print">
        <button
          onClick={() => setReportType('ORDERS')}
          className={`pb-3 px-4 font-medium text-sm transition-colors flex items-center ${
            reportType === 'ORDERS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={16} className="mr-2" /> Pedidos
        </button>
        <button
          onClick={() => setReportType('LOW_STOCK')}
          className={`pb-3 px-4 font-medium text-sm transition-colors flex items-center ${
            reportType === 'LOW_STOCK' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package size={16} className="mr-2" /> Estoque Produtos
        </button>
        <button
          onClick={() => setReportType('RAW_MATERIAL')}
          className={`pb-3 px-4 font-medium text-sm transition-colors flex items-center ${
            reportType === 'RAW_MATERIAL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle size={16} className="mr-2" /> Matéria Prima Baixa
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
        
        {/* Print Header */}
        <div className="hidden print:block mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-black">FactoryFlow ERP</h1>
          <h2 className="text-xl text-gray-600">{getReportTitle()}</h2>
          <p className="text-sm text-gray-400 mt-2">Gerado em: {new Date().toLocaleString()}</p>
        </div>

        {reportType === 'ORDERS' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 no-print">Pedidos em Andamento</h3>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="p-3 font-bold text-black">ID</th>
                  <th className="p-3 font-bold text-black">Cliente</th>
                  <th className="p-3 font-bold text-black">Status</th>
                  <th className="p-3 font-bold text-black">Data Entrega</th>
                  <th className="p-3 font-bold text-black text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeOrders.map(o => (
                  <tr key={o.id}>
                    <td className="p-3 text-black font-medium">{o.id}</td>
                    <td className="p-3 text-black">{o.customerName}</td>
                    <td className="p-3 text-black">{o.status}</td>
                    <td className="p-3 text-black">{new Date(o.deliveryDate).toLocaleDateString()}</td>
                    <td className="p-3 text-black text-right">R$ {o.totalValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'LOW_STOCK' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 no-print flex items-center text-red-600">
              <AlertTriangle size={20} className="mr-2" /> Estoque Baixo (Produtos Finais)
            </h3>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="p-3 font-bold text-black">SKU</th>
                  <th className="p-3 font-bold text-black">Produto</th>
                  <th className="p-3 font-bold text-black">Preço Venda</th>
                  <th className="p-3 font-bold text-black text-right">Estoque Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockProducts.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum produto com estoque crítico.</td></tr>
                ) : (
                    lowStockProducts.map(p => (
                    <tr key={p.id}>
                        <td className="p-3 text-black font-medium">{p.sku}</td>
                        <td className="p-3 text-black">{p.name}</td>
                        <td className="p-3 text-black">R$ {p.price.toFixed(2)}</td>
                        <td className="p-3 text-red-600 font-bold text-right">{p.stockFinished} un</td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'RAW_MATERIAL' && (
          <div>
             <h3 className="text-lg font-bold text-gray-900 mb-4 no-print flex items-center text-red-600">
              <AlertTriangle size={20} className="mr-2" /> Matéria Prima Crítica
            </h3>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="p-3 font-bold text-black">SKU</th>
                  <th className="p-3 font-bold text-black">Material</th>
                  <th className="p-3 font-bold text-black">Categoria</th>
                  <th className="p-3 font-bold text-black text-right">Estoque Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {lowStockMaterials.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum material com estoque crítico.</td></tr>
                ) : (
                    lowStockMaterials.map(p => (
                    <tr key={p.id}>
                        <td className="p-3 text-black font-medium">{p.sku}</td>
                        <td className="p-3 text-black">{p.name}</td>
                        <td className="p-3 text-black">{p.category}</td>
                        <td className="p-3 text-red-600 font-bold text-right">{p.stockRaw} un</td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};