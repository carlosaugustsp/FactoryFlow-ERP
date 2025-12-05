import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, Role } from '../types';
import { DEPARTMENT_CONFIG } from '../constants';
import { CheckCircle, XCircle, Clock, Search, ChevronRight, Save, AlertTriangle, Receipt, Undo2, ArrowRight, Box, Play, History, FileText } from 'lucide-react';

interface DepartmentViewProps {
  currentRole: Role;
  filterStatus: OrderStatus | OrderStatus[];
  title: string;
  allowReject?: boolean;
  viewRole?: Role; // The role logic to emulate (e.g. Admin viewing PCP screen acts as PCP)
}

export const DepartmentView: React.FC<DepartmentViewProps> = ({ 
  currentRole, 
  filterStatus, 
  title, 
  allowReject = false,
  viewRole
}) => {
  const { orders, updateOrderStatus, updateOrderFields, splitOrder } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Determine effective role for logic execution
  const effectiveRole = (currentRole === Role.ADMIN || currentRole === Role.GERENTE) && viewRole 
    ? viewRole 
    : currentRole;

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<'PRODUCTION' | 'INVOICE' | 'MONTAGEM' | 'PCP_BATCH' | 'DETAILS' | 'NONE'>('NONE');
  
  // PCP State
  const [generatedBatch, setGeneratedBatch] = useState('');

  // Production State
  const [productionQuantities, setProductionQuantities] = useState<{[key: string]: number}>({});

  // Faturamento State
  const [invoiceInput, setInvoiceInput] = useState('');

  // Montagem State
  const [observation, setObservation] = useState('');

  // Filter orders relevant to this department
  const departmentOrders = orders.filter(o => 
    Array.isArray(filterStatus) ? filterStatus.includes(o.status) : o.status === filterStatus
  ).filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const initiateAdvance = (order: Order) => {
    if (effectiveRole === Role.PCP) {
      // Generate Batch Number
      const date = new Date();
      const timestamp = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0') +
        date.getHours().toString().padStart(2, '0') +
        date.getMinutes().toString().padStart(2, '0');
      
      const autoBatch = `LOTE-${timestamp}`;
      setGeneratedBatch(autoBatch);
      setSelectedOrder(order);
      setModalType('PCP_BATCH');

    } else if (effectiveRole === Role.PRODUCAO) {
      const initialQtys: {[key: string]: number} = {};
      order.items.forEach(i => initialQtys[i.productId] = i.quantity);
      setProductionQuantities(initialQtys);
      setSelectedOrder(order);
      setModalType('PRODUCTION');
    } else if (effectiveRole === Role.FATURAMENTO) {
      setInvoiceInput('');
      setSelectedOrder(order);
      setModalType('INVOICE');
    } else if (effectiveRole === Role.MONTAGEM) {
      setObservation('');
      setSelectedOrder(order);
      setModalType('MONTAGEM');
    } else {
      // Standard Advance for other departments
      const config = DEPARTMENT_CONFIG[effectiveRole];
      if (config.next) {
        const actionName = order.status === OrderStatus.REPROVADO ? "Desbloqueado/Liberado" : "Aprovado";
        updateOrderStatus(order.id, config.next, `${actionName} por ${effectiveRole}`);
      }
    }
  };

  const viewDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalType('DETAILS');
  };

  const submitPcpBatch = () => {
    if (selectedOrder && generatedBatch) {
        updateOrderStatus(
            selectedOrder.id, 
            OrderStatus.EM_PRODUCAO, 
            `Lote gerado: ${generatedBatch} - Enviado para Produção`, 
            { batchNumber: generatedBatch }
        );
        setModalType('NONE');
        setSelectedOrder(null);
    }
  };

  const submitInvoice = () => {
    if (selectedOrder && invoiceInput) {
      updateOrderFields(selectedOrder.id, { invoiceNumber: invoiceInput });
      updateOrderStatus(selectedOrder.id, OrderStatus.EM_TRANSPORTE, `Nota Fiscal emitida: ${invoiceInput}`);
      setModalType('NONE');
      setSelectedOrder(null);
    } else {
      alert("Por favor informe o número da Nota Fiscal.");
    }
  };

  const submitProduction = () => {
    if (!selectedOrder) return;

    let isPartial = false;
    const producedItems = [];

    for (const item of selectedOrder.items) {
      const produced = productionQuantities[item.productId] || 0;
      producedItems.push({ productId: item.productId, qtyProduced: produced });
      if (produced < item.quantity) isPartial = true;
    }

    if (isPartial) {
      const confirmPartial = window.confirm("A quantidade produzida é MENOR que a solicitada. Deseja realizar uma entrega PARCIAL e manter o restante pendente?");
      if (!confirmPartial) return;

      splitOrder(selectedOrder.id, producedItems);
      updateOrderStatus(selectedOrder.id, OrderStatus.QUALIDADE_PENDENTE, "Entrega Parcial realizada.");
    } else {
      updateOrderStatus(selectedOrder.id, OrderStatus.QUALIDADE_PENDENTE, "Produção concluída total.");
    }

    setModalType('NONE');
    setSelectedOrder(null);
  };

  const submitMontagem = (action: 'RETURN' | 'ADVANCE') => {
    if (!selectedOrder) return;

    if (action === 'RETURN') {
        if (!observation) {
            alert("Para devolver à Qualidade, é obrigatório informar o motivo nas observações.");
            return;
        }
        updateOrderStatus(selectedOrder.id, OrderStatus.QUALIDADE_PENDENTE, `DEVOLVIDO DA MONTAGEM: ${observation}`);
    } else {
        updateOrderStatus(selectedOrder.id, OrderStatus.EM_EMBALAGEM, `Montagem Finalizada. Obs: ${observation || 'Sem observações.'}`);
    }
    setModalType('NONE');
    setSelectedOrder(null);
  };

  const handleReject = (orderId: string) => {
    const reason = prompt("Motivo do Bloqueio/Reprovação:");
    if (reason) {
      updateOrderStatus(orderId, OrderStatus.REPROVADO, `BLOQUEADO PELA QUALIDADE: ${reason}`);
    }
  };

  const formatStatus = (s: string) => s.replace(/_/g, ' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">Gerencie a fila de produção deste setor.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-900">
            <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-800">
              <tr>
                <th className="px-6 py-4">ID Pedido</th>
                {effectiveRole !== Role.VENDAS && <th className="px-6 py-4">Lote</th>}
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Entrada</th>
                <th className="px-6 py-4">Prioridade</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departmentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle size={48} className="mb-2 opacity-20" />
                      <p>Nenhum pedido pendente neste setor.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                departmentOrders.map((order) => {
                  const isBlocked = order.status === OrderStatus.REPROVADO;
                  return (
                    <tr key={order.id} className={`transition-colors ${isBlocked ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {order.id}
                        {isBlocked && <span className="block text-xs text-red-700 font-bold mt-1">BLOQUEADO</span>}
                      </td>
                      {effectiveRole !== Role.VENDAS && (
                        <td className="px-6 py-4 font-mono text-gray-700">
                          {order.batchNumber || '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-900">{order.customerName}</td>
                      <td className="px-6 py-4 text-gray-900">
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-bold">{item.quantity}x</span> {item.productName}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        <div className="flex items-center text-xs">
                          <Clock size={14} className="mr-1" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold
                          ${order.priority === 'ALTA' ? 'bg-red-100 text-red-800' : 
                            order.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                           <button 
                              onClick={() => viewDetails(order)}
                              className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
                              title="Ver Histórico e Detalhes"
                            >
                              <History size={16} />
                            </button>

                          {allowReject && !isBlocked && (
                            <button 
                              onClick={() => handleReject(order.id)}
                              className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-bold text-xs flex items-center"
                              title="Bloquear Pedido"
                            >
                              <XCircle size={16} className="mr-1" /> Bloquear
                            </button>
                          )}
                          
                          <button
                            onClick={() => initiateAdvance(order)}
                            className={`flex items-center space-x-1 px-3 py-2 text-white font-bold rounded-lg shadow-sm transition-all text-xs
                              ${isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                          >
                              {isBlocked ? (
                                <>
                                  <CheckCircle size={16} className="mr-1" />
                                  <span>Liberar / Aprovado</span>
                                </>
                              ) : (
                                <>
                                  {effectiveRole === Role.PCP ? (
                                    <>
                                        <span>Gerar Lote</span>
                                        <Box size={16} className="ml-1"/>
                                    </>
                                  ) : effectiveRole === Role.MONTAGEM ? (
                                    <span>Processar</span>
                                  ) : (
                                    <>
                                        <span>Avançar</span>
                                        <ChevronRight size={16} />
                                    </>
                                  )}
                                </>
                              )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAILS: HISTORY & INFO */}
      {modalType === 'DETAILS' && selectedOrder && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <FileText className="mr-2 text-blue-600" /> Detalhes do Pedido
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{selectedOrder.id} - {selectedOrder.customerName}</p>
                    </div>
                    <button onClick={() => { setModalType('NONE'); setSelectedOrder(null); }} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                            <span className="block text-xs font-bold text-gray-500 uppercase">Valor Total</span>
                            <span className="font-bold text-green-700">R$ {selectedOrder.totalValue.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-gray-500 uppercase">Prioridade</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${selectedOrder.priority === 'ALTA' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {selectedOrder.priority}
                            </span>
                        </div>
                        <div>
                             <span className="block text-xs font-bold text-gray-500 uppercase">Nº Externo</span>
                             <span className="font-mono text-gray-800">{selectedOrder.externalId || '-'}</span>
                        </div>
                        <div>
                             <span className="block text-xs font-bold text-gray-500 uppercase">Entrega</span>
                             <span className="text-gray-800">{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-2 border-b pb-1">Itens do Pedido</h4>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">Produto</th>
                                    <th className="p-2 text-center">Qtd</th>
                                    <th className="p-2 text-right">Unitário</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.items.map((item, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="p-2 font-medium">{item.productName}</td>
                                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                                        <td className="p-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* History / Logs */}
                    <div>
                         <h4 className="font-bold text-gray-900 mb-4 border-b pb-1 flex items-center">
                            <History size={16} className="mr-2" /> Histórico de Movimentações
                         </h4>
                         <div className="space-y-4 pl-2">
                            {selectedOrder.logs.map((log, idx) => (
                                <div key={idx} className="relative pl-6 pb-2 border-l-2 border-gray-300 last:border-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{formatStatus(log.stage)}</p>
                                            <p className="text-xs text-gray-500">Por: <span className="font-semibold">{log.userName}</span></p>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    {log.note && (
                                        <div className="mt-1 p-2 bg-yellow-50 text-yellow-900 text-xs rounded border border-yellow-100 italic">
                                            "{log.note}"
                                        </div>
                                    )}
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button 
                        onClick={() => { setModalType('NONE'); setSelectedOrder(null); }}
                        className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900"
                    >
                        Fechar
                    </button>
                </div>
            </div>
         </div>
      )}

      {/* MODAL PCP: BATCH GENERATION */}
      {modalType === 'PCP_BATCH' && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <Box className="text-purple-600 mr-2" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Gerar Ordem de Produção</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
                O pedido será convertido em Ordem de Produção. O sistema gerou o seguinte lote de rastreio:
            </p>

            <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-300 text-center">
                <span className="block text-xs text-gray-500 uppercase tracking-wide">Número do Lote</span>
                <span className="text-2xl font-mono font-bold text-gray-900 tracking-wider">{generatedBatch}</span>
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => { setModalType('NONE'); setSelectedOrder(null); }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={submitPcpBatch}
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Play size={18} className="mr-2" />
                Confirmar e Produzir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FATURAMENTO: INVOICE NUMBER */}
      {modalType === 'INVOICE' && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <Receipt className="text-blue-600 mr-2" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Emissão de Nota Fiscal</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Faturamento do Pedido: <strong>{selectedOrder.id}</strong></p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">Número da NF</label>
              <input 
                type="text" 
                value={invoiceInput}
                onChange={e => setInvoiceInput(e.target.value)}
                className="w-full border-2 border-gray-600 rounded-lg p-3 text-lg font-mono focus:border-blue-500 outline-none bg-gray-700 text-white"
                placeholder="Ex: 001.999.888"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => { setModalType('NONE'); setSelectedOrder(null); }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={submitInvoice}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center"
              >
                <Save size={18} className="mr-2" />
                Salvar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTION: QUANTITY CHECK */}
      {modalType === 'PRODUCTION' && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Apontamento de Produção</h3>
            <div className="flex items-center bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
               <AlertTriangle className="text-yellow-600 mr-2" size={20} />
               <p className="text-xs text-yellow-800">Se a quantidade produzida for menor que a solicitada, o sistema perguntará sobre entrega parcial.</p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                   <div className="flex-1">
                     <p className="font-bold text-gray-900">{item.productName}</p>
                     <p className="text-xs text-gray-500">Solicitado: {item.quantity}</p>
                   </div>
                   <div className="flex flex-col items-end">
                      <label className="text-xs font-bold text-gray-700 mb-1">Qtd Produzida</label>
                      <input 
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={productionQuantities[item.productId] ?? 0}
                        onChange={(e) => setProductionQuantities(prev => ({
                          ...prev,
                          [item.productId]: Number(e.target.value)
                        }))}
                        className="w-24 border-2 border-gray-600 rounded p-1 text-center font-bold bg-gray-700 text-white focus:border-blue-500"
                      />
                   </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => { setModalType('NONE'); setSelectedOrder(null); }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={submitProduction}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center"
              >
                <Save size={18} className="mr-2" />
                Finalizar Produção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MONTAGEM: OBSERVATIONS & ROUTING */}
      {modalType === 'MONTAGEM' && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Conferência de Montagem</h3>
            <p className="text-sm text-gray-500 mb-4">Pedido: {selectedOrder.id} - {selectedOrder.customerName}</p>

            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">Observações / Problemas</label>
                <textarea 
                    value={observation}
                    onChange={e => setObservation(e.target.value)}
                    className="w-full h-32 border-2 border-gray-600 rounded-lg p-3 bg-gray-700 text-white focus:border-blue-500 outline-none resize-none"
                    placeholder="Descreva problemas para a Qualidade ou observações gerais de montagem..."
                />
            </div>

            <div className="flex justify-between gap-3">
              <button 
                onClick={() => submitMontagem('RETURN')}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center justify-center"
              >
                <Undo2 size={18} className="mr-2" />
                Devolver p/ Qualidade
              </button>
              <button 
                onClick={() => submitMontagem('ADVANCE')}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <span>Enviar p/ Embalagem</span>
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
            <div className="mt-3 text-center">
                <button 
                    onClick={() => { setModalType('NONE'); setSelectedOrder(null); }}
                    className="text-gray-500 text-sm hover:underline"
                >
                    Cancelar
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};