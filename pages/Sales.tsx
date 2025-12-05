import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, OrderItem } from '../types';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

export const Sales = () => {
  const { products, createOrder } = useStore();
  const [customerName, setCustomerName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA'>('MEDIA');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<OrderItem[]>([]);

  // Only show Final Products, not Raw Materials
  const sellableProducts = products.filter(p => p.type === 'PRODUTO_FINAL');

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    setItems([...items, { 
      productId: prod.id, 
      productName: prod.name, 
      quantity,
      unitPrice: prod.price 
    }]);
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Adicione pelo menos um produto.");
      return;
    }
    
    const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    createOrder({
      externalId: externalId || undefined,
      customerName,
      deliveryDate,
      priority,
      items,
      totalValue
    });

    // Reset form
    setCustomerName('');
    setExternalId('');
    setDeliveryDate('');
    setItems([]);
    alert("Pedido criado com sucesso e enviado ao PCP!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Pedido de Venda</h1>
          <p className="text-gray-500">Crie ordens de produção para clientes.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Número do Pedido (Opcional)</label>
              <input
                type="text"
                value={externalId}
                onChange={e => setExternalId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white placeholder-gray-400"
                placeholder="Ex: 2024-001"
              />
            </div>
             <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Cliente</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white placeholder-gray-400"
                placeholder="Nome da Empresa"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Data de Entrega</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Prioridade</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Itens do Pedido</h3>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white"
              >
                <option value="">Selecione um produto...</option>
                {sellableProducts.map(p => (
                  <option key={p.id} value={p.id}>
                     {p.sku} {p.reference ? `| ${p.reference}` : ''} - {p.name} (R$ {p.price.toFixed(2)})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-24 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center justify-center font-bold"
              >
                <Plus size={20} />
              </button>
            </div>

            {items.length > 0 && (
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-black">
                    <tr>
                      <th className="px-4 py-3 font-bold">Produto</th>
                      <th className="px-4 py-3 font-bold w-20">Qtd</th>
                      <th className="px-4 py-3 font-bold w-24">Valor Unit.</th>
                      <th className="px-4 py-3 font-bold w-24">Total</th>
                      <th className="px-4 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-4 py-3 text-black font-medium">{item.productName}</td>
                        <td className="px-4 py-3 text-black font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-black">R$ {item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold text-black">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200 font-bold border-t-2 border-gray-300">
                        <td colSpan={3} className="px-4 py-3 text-right text-black">Total do Pedido:</td>
                        <td className="px-4 py-3 text-black text-lg">
                            R$ {items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toFixed(2)}
                        </td>
                        <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 shadow-md font-bold flex items-center space-x-2"
            >
              <ShoppingCart size={20} />
              <span>Finalizar e Enviar ao PCP</span>
            </button>
          </div>
        </form>
      </div>

      {/* Info Sidebar */}
      <div className="bg-blue-50 p-6 rounded-xl h-fit border border-blue-100">
        <h3 className="text-blue-900 font-bold text-lg mb-4">Informações</h3>
        <ul className="space-y-3 text-sm text-blue-900">
          <li className="flex items-start">
            <span className="mr-2 font-bold">•</span>
            Preencha o Número do Pedido se o cliente fornecer um PO.
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">•</span>
            Ao finalizar, o pedido será enviado automaticamente para análise do PCP.
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">•</span>
            Verifique o estoque antes de prometer prazos curtos.
          </li>
        </ul>
      </div>
    </div>
  );
};