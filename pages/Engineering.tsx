import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, ProductIngredient, Role, UnitOfMeasure } from '../types';
import { Plus, Package, Database, Trash2, Save, AlertTriangle, Edit3, Shield, Upload, List, X, HelpCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export const Engineering = () => {
  const { products, addProduct, addProductsBatch, updateProductStock, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'MATERIALS'>('PRODUCTS');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportHelp, setShowImportHelp] = useState(false);

  // --- States for New Material ---
  const [newMaterial, setNewMaterial] = useState<Partial<Product>>({
    name: '', sku: '', reference: '', category: 'Outros', price: 0, stockRaw: 0, type: 'MATERIA_PRIMA', unitOfMeasure: 'UNIDADE'
  });

  // --- States for New Product ---
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', sku: '', reference: '', category: 'Outros', price: 0, stockFinished: 0, type: 'PRODUTO_FINAL', unitOfMeasure: 'UNIDADE'
  });
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState(1);

  // --- State for Stock Adjustment ---
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductToAdjust, setSelectedProductToAdjust] = useState<Product | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);

  // --- State for List Modal ---
  const [listModalOpen, setListModalOpen] = useState(false);

  const rawMaterials = products.filter(p => p.type === 'MATERIA_PRIMA');
  const finishedProducts = products.filter(p => p.type === 'PRODUTO_FINAL');
  const criticalStockItems = rawMaterials.filter(m => m.stockRaw < 100);

  // Manager and Admin can adjust stock, Engineering can do everything
  const canAdjustStock = currentUser?.role === Role.ENGENHARIA || currentUser?.role === Role.ADMIN || currentUser?.role === Role.GERENTE;
  const canEditProducts = currentUser?.role === Role.ENGENHARIA || currentUser?.role === Role.ADMIN;

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProducts) { alert("Apenas Engenharia/Admin pode criar materiais."); return; }
    if (!newMaterial.name || !newMaterial.sku) return;

    addProduct({
      ...newMaterial as Product,
      id: `m-${Date.now()}`,
      stockFinished: 0,
    });
    setNewMaterial({ name: '', sku: '', reference: '', category: 'Outros', price: 0, stockRaw: 0, type: 'MATERIA_PRIMA', unitOfMeasure: 'UNIDADE' });
    alert("Matéria Prima cadastrada!");
  };

  const handleAddIngredient = () => {
    if (!selectedIngredientId) return;
    const material = rawMaterials.find(m => m.id === selectedIngredientId);
    if (!material) return;

    setIngredients([...ingredients, {
      materialId: material.id,
      materialName: material.name,
      quantity: ingredientQty
    }]);
    setSelectedIngredientId('');
    setIngredientQty(1);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProducts) { alert("Apenas Engenharia/Admin pode criar produtos."); return; }
    if (!newProduct.name || !newProduct.sku) return;
    if (ingredients.length === 0) {
      alert("Adicione pelo menos uma matéria prima à receita.");
      return;
    }

    addProduct({
      ...newProduct as Product,
      id: `p-${Date.now()}`,
      stockRaw: 0,
      recipe: ingredients
    });
    setNewProduct({ name: '', sku: '', reference: '', category: 'Outros', price: 0, stockFinished: 0, type: 'PRODUTO_FINAL', unitOfMeasure: 'UNIDADE' });
    setIngredients([]);
    alert("Produto cadastrado com sucesso!");
  };

  const openAdjustmentModal = (product: Product) => {
    if (!canAdjustStock) return;
    setSelectedProductToAdjust(product);
    setAdjustmentQty(0);
    setAdjustModalOpen(true);
  };

  const handleStockAdjustment = () => {
    if (selectedProductToAdjust && adjustmentQty !== 0) {
      // If raw material, adjust stockRaw. If finished, adjust stockFinished.
      const rawChange = selectedProductToAdjust.type === 'MATERIA_PRIMA' ? adjustmentQty : 0;
      const finishedChange = selectedProductToAdjust.type === 'PRODUTO_FINAL' ? adjustmentQty : 0;
      
      updateProductStock(selectedProductToAdjust.id, rawChange, finishedChange);
      setAdjustModalOpen(false);
      setSelectedProductToAdjust(null);
      setAdjustmentQty(0);
    }
  };

  const triggerImport = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    // Using ArrayBuffer is safer for various file types including CSV
    reader.readAsArrayBuffer(file);
    
    reader.onload = (evt) => {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Converts to JSON
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
            alert("O arquivo parece estar vazio ou não foi possível ler as colunas.");
            return;
        }

        console.log("Dados importados:", data); // Debug

        // Normalize data keys to handle slight variations in header names
        const newItems: Product[] = data.map((row: any) => {
            // Helper to find case-insensitive key
            const getVal = (keys: string[]) => {
                for (const k of keys) {
                    // Direct match
                    if (row[k] !== undefined) return row[k];
                    // Case insensitive search
                    const rowKey = Object.keys(row).find(rk => rk.toLowerCase() === k.toLowerCase());
                    if (rowKey) return row[rowKey];
                }
                return undefined;
            };

            const name = getVal(['Nome', 'Name', 'Produto', 'Material']) || 'Sem Nome';
            const sku = getVal(['SKU', 'Codigo', 'Code']) || `SKU-${Math.floor(Math.random()*10000)}`;
            const price = Number(getVal(['Preco', 'Preço', 'Price', 'Custo', 'Valor']) || 0);
            const stock = Number(getVal(['Estoque', 'Stock', 'Quantidade', 'Qtd']) || 0);
            const ref = getVal(['Referencia', 'Ref', 'Reference']) || '';
            const cat = getVal(['Categoria', 'Category']) || 'Outros';
            const unit = getVal(['Unidade', 'Unit', 'Medida']) || 'UNIDADE';

            return {
                id: `${activeTab === 'MATERIALS' ? 'm' : 'p'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: String(name),
                sku: String(sku),
                reference: String(ref),
                category: cat,
                price: price,
                stockRaw: activeTab === 'MATERIALS' ? stock : 0,
                stockFinished: activeTab === 'PRODUCTS' ? stock : 0,
                type: activeTab === 'MATERIALS' ? 'MATERIA_PRIMA' : 'PRODUTO_FINAL',
                unitOfMeasure: String(unit).toUpperCase() as UnitOfMeasure
            };
        });

        if (confirm(`Encontrados ${newItems.length} itens. Deseja importar para ${activeTab === 'MATERIALS' ? 'Matéria Prima' : 'Produtos Finais'}?`)) {
            addProductsBatch(newItems);
            alert("Importação concluída com sucesso!");
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
        alert("Erro ao ler o arquivo.");
    };
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        ref={fileInputRef} 
        onChange={handleExcelUpload} 
        className="hidden" 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Engenharia de Produto</h1>
          <p className="text-gray-500">Gestão de SKUs, Custos e Listas Técnicas (BOM).</p>
        </div>
        <div className="flex flex-wrap gap-2">
            {canEditProducts && (
                <>
                <button 
                    onClick={() => setShowImportHelp(true)}
                    className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-200 flex items-center shadow-sm"
                    title="Instruções de Importação"
                >
                    <HelpCircle size={18} className="mr-2" />
                    <span>Ajuda</span>
                </button>
                <button 
                    onClick={triggerImport}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center shadow-sm"
                >
                    <Upload size={18} className="mr-2" />
                    <span>Importar (Excel/CSV)</span>
                </button>
                </>
            )}
            <button 
                onClick={() => setListModalOpen(true)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center shadow-sm"
            >
                <List size={18} className="mr-2" />
                <span>Listar Todos</span>
            </button>
        </div>
      </div>

      {currentUser?.role === Role.GERENTE && (
            <div className="bg-teal-100 text-teal-800 px-4 py-2 rounded-lg flex items-center w-fit">
                <Shield size={18} className="mr-2" />
                <span className="font-bold text-sm">Acesso Gerencial: Ajuste de Estoque Liberado</span>
            </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
            activeTab === 'PRODUCTS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Produtos Finais
        </button>
        <button
          onClick={() => setActiveTab('MATERIALS')}
          className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
            activeTab === 'MATERIALS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Matéria Prima
        </button>
      </div>

      {activeTab === 'MATERIALS' ? (
        <div className="space-y-8">
           
           {/* CRITICAL STOCK ALERT SECTION */}
           {criticalStockItems.length > 0 && (
             <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="text-red-600 mr-2" size={24} />
                  <h3 className="text-lg font-bold text-red-800">Alerta de Estoque Crítico</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-red-900 border-b border-red-200">
                         <th className="pb-2 font-bold">SKU</th>
                         <th className="pb-2 font-bold">Item</th>
                         <th className="pb-2 font-bold">Estoque Atual</th>
                         <th className="pb-2 font-bold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalStockItems.map(item => (
                        <tr key={item.id} className="border-b border-red-100 last:border-0">
                          <td className="py-2 font-bold text-red-900">{item.sku}</td>
                          <td className="py-2 text-red-900">{item.name}</td>
                          <td className="py-2 font-bold text-red-700">{item.stockRaw} {item.unitOfMeasure || 'un'}</td>
                          <td className="py-2 text-right">
                            {canAdjustStock && (
                                <button 
                                onClick={() => openAdjustmentModal(item)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
                                >
                                Ajustar
                                </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Material */}
              {canEditProducts && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                        <Plus size={18} className="mr-2" /> Nova Matéria Prima
                      </h3>
                      <form onSubmit={handleSaveMaterial} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700">Nome do Material</label>
                          <input type="text" required className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                            value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700">SKU</label>
                            <input type="text" required className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                              value={newMaterial.sku} onChange={e => setNewMaterial({...newMaterial, sku: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700">Referência</label>
                            <input type="text" className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                              value={newMaterial.reference} onChange={e => setNewMaterial({...newMaterial, reference: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700">Custo Unit. (R$)</label>
                            <input type="number" step="0.01" required className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                              value={newMaterial.price} onChange={e => setNewMaterial({...newMaterial, price: Number(e.target.value)})} />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700">Unidade Medida</label>
                            <select className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white"
                                value={newMaterial.unitOfMeasure} onChange={e => setNewMaterial({...newMaterial, unitOfMeasure: e.target.value as UnitOfMeasure})}>
                                <option value="UNIDADE">Unidade</option>
                                <option value="KG">Quilo (kg)</option>
                                <option value="METRO">Metro (m)</option>
                                <option value="LITRO">Litro (l)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700">Estoque Inicial</label>
                            <input type="number" required className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                              value={newMaterial.stockRaw} onChange={e => setNewMaterial({...newMaterial, stockRaw: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700">Categoria</label>
                            <select className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white"
                                value={newMaterial.category} onChange={e => setNewMaterial({...newMaterial, category: e.target.value as any})}>
                                <option value="Metal">Metal</option>
                                <option value="Plastico">Plástico</option>
                                <option value="Componente">Componente</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">Salvar Material</button>
                      </form>
                  </div>
              )}
              
              {/* List Materials */}
              <div className={`${canEditProducts ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                <div className="p-4 bg-gray-50 border-b font-bold text-gray-900 flex justify-between items-center">
                    <span>Lista de Materiais</span>
                    <span className="text-xs font-normal text-gray-500">Total: {rawMaterials.length}</span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-4 font-bold text-gray-800">SKU / Ref</th>
                      <th className="p-4 font-bold text-gray-800">Nome</th>
                      <th className="p-4 font-bold text-gray-800">Estoque</th>
                      {canAdjustStock && <th className="p-4 font-bold text-gray-800 text-right">Ação</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rawMaterials.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="p-4 text-black">
                           <div className="font-mono text-xs">{m.sku}</div>
                           {m.reference && <div className="text-xs text-gray-500">{m.reference}</div>}
                        </td>
                        <td className="p-4 text-black">{m.name}</td>
                        <td className="p-4">
                            <span className={`font-bold ${m.stockRaw < 100 ? 'text-red-600' : 'text-black'}`}>
                                {m.stockRaw} {m.unitOfMeasure || 'un'}
                            </span>
                        </td>
                        {canAdjustStock && (
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => openAdjustmentModal(m)}
                                    className="text-blue-600 hover:text-blue-800 p-1" title="Ajustar Estoque"
                                >
                                    <Edit3 size={18} />
                                </button>
                            </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Product */}
          {canEditProducts && (
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center text-lg">
                    <Package className="mr-2 text-blue-600" /> Cadastro de Produto Final
                </h3>
                
                <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Nome do Produto</label>
                        <input type="text" required className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                        value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">SKU</label>
                        <input type="text" required className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                        value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Referência</label>
                        <input type="text" className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                        value={newProduct.reference} onChange={e => setNewProduct({...newProduct, reference: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Preço de Venda (R$)</label>
                        <input type="number" step="0.01" required className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white" 
                        value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Categoria</label>
                        <select className="w-full mt-1 border border-gray-600 rounded p-2 bg-gray-700 text-white"
                            value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}>
                            <option value="Tomada">Tomada</option>
                            <option value="Interruptor">Interruptor</option>
                            <option value="Chuveiro">Chuveiro</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Database size={16} className="mr-2" /> Receita / Lista Técnica (BOM)
                    </h4>
                    
                    <div className="flex gap-2 mb-4 bg-gray-50 p-4 rounded-lg">
                        <select className="flex-1 border border-gray-600 rounded p-2 text-sm bg-gray-700 text-white"
                            value={selectedIngredientId} onChange={e => setSelectedIngredientId(e.target.value)}>
                            <option value="">Selecione a Matéria Prima...</option>
                            {rawMaterials.map(m => (
                                <option key={m.id} value={m.id}>{m.sku} | {m.name} ({m.unitOfMeasure || 'un'}) (R$ {m.price.toFixed(2)})</option>
                            ))}
                        </select>
                        <input type="number" placeholder="Qtd" className="w-24 border border-gray-600 rounded p-2 text-sm bg-gray-700 text-white placeholder-gray-300"
                            value={ingredientQty} onChange={e => setIngredientQty(Number(e.target.value))} />
                        <button type="button" onClick={handleAddIngredient} className="bg-gray-800 text-white px-3 py-2 rounded hover:bg-black font-bold">
                            <Plus size={16} />
                        </button>
                    </div>

                    {ingredients.length > 0 && (
                        <div className="bg-gray-50 rounded border border-gray-200">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-100">
                                        <th className="p-2 text-left text-black font-bold">Material</th>
                                        <th className="p-2 text-center text-black font-bold">Qtd</th>
                                        <th className="p-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ingredients.map((ing, idx) => (
                                        <tr key={idx} className="border-b last:border-0">
                                            <td className="p-2 text-black">{ing.materialName}</td>
                                            <td className="p-2 text-center text-black">{ing.quantity}</td>
                                            <td className="p-2">
                                                <button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))} 
                                                    className="text-red-600 hover:text-red-800">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center font-bold">
                        <Save size={18} className="mr-2" /> Salvar Produto Final
                    </button>
                </div>
                </form>
            </div>
          )}

          {/* List Products */}
          <div className={`${canEditProducts ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit`}>
              <div className="p-4 bg-gray-50 border-b font-bold text-gray-900">
                  Produtos Cadastrados
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                  {finishedProducts.map(p => (
                      <div key={p.id} className="p-4 border-b hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-1">
                              <div>
                                <span className="font-bold text-black">{p.sku}</span>
                                {p.reference && <span className="ml-2 text-xs text-gray-500 font-mono">({p.reference})</span>}
                              </div>
                              <span className="text-green-600 font-bold">R$ {p.price.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-black font-medium mb-2">{p.name}</div>
                          <div className="text-xs text-gray-600">
                              Receita: {p.recipe?.length || 0} componentes
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalOpen && selectedProductToAdjust && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajuste de Estoque</h3>
            <p className="text-sm text-gray-600 mb-2">{selectedProductToAdjust.name}</p>
            <p className="text-xs text-gray-500 mb-4">Estoque Atual: {selectedProductToAdjust.stockRaw} {selectedProductToAdjust.unitOfMeasure || 'un'}</p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Quantidade a Adicionar/Remover</label>
              <input 
                type="number"
                value={adjustmentQty}
                onChange={e => setAdjustmentQty(Number(e.target.value))}
                className="w-full border-2 border-gray-600 rounded p-2 text-lg font-bold bg-gray-700 text-white"
                placeholder="Ex: 10 ou -5"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Use números negativos para saída.</p>
            </div>

            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setAdjustModalOpen(false)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={handleStockAdjustment}
                className="px-3 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIST ALL MODAL */}
      {listModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
                  <div className="p-6 border-b flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Listagem Completa: {activeTab === 'MATERIALS' ? 'Matéria Prima' : 'Produtos Finais'}
                        </h2>
                        <p className="text-gray-500">Relatório de itens cadastrados.</p>
                      </div>
                      <button onClick={() => setListModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-6">
                      <table className="w-full text-left text-sm border-collapse">
                          <thead>
                              <tr className="bg-gray-100 text-gray-800">
                                  <th className="p-3 border font-bold">SKU</th>
                                  <th className="p-3 border font-bold">Ref</th>
                                  <th className="p-3 border font-bold">Nome</th>
                                  <th className="p-3 border font-bold">Categoria</th>
                                  <th className="p-3 border font-bold text-right">Preço/Custo</th>
                                  <th className="p-3 border font-bold text-right">Estoque</th>
                                  <th className="p-3 border font-bold text-right">Unidade</th>
                              </tr>
                          </thead>
                          <tbody>
                              {(activeTab === 'MATERIALS' ? rawMaterials : finishedProducts).map((item, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 border-b">
                                      <td className="p-3 border text-black font-mono">{item.sku}</td>
                                      <td className="p-3 border text-gray-600">{item.reference || '-'}</td>
                                      <td className="p-3 border text-black font-medium">{item.name}</td>
                                      <td className="p-3 border text-black">{item.category}</td>
                                      <td className="p-3 border text-black text-right">R$ {item.price.toFixed(2)}</td>
                                      <td className="p-3 border text-black text-right font-bold">
                                          {activeTab === 'MATERIALS' ? item.stockRaw : item.stockFinished}
                                      </td>
                                      <td className="p-3 border text-gray-600 text-right text-xs uppercase">{item.unitOfMeasure}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-4 border-t flex justify-between bg-gray-50">
                      <span className="text-sm text-gray-500 mt-2">
                        Total de registros: {(activeTab === 'MATERIALS' ? rawMaterials : finishedProducts).length}
                      </span>
                      <button 
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold"
                      >
                        Imprimir
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* IMPORT HELP MODAL */}
      {showImportHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
             <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <FileSpreadsheet className="mr-2 text-green-600" /> Instruções de Importação
                </h3>
                <button onClick={() => setShowImportHelp(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
             </div>
             
             <div className="space-y-4 text-sm text-gray-700">
                <p>O arquivo deve estar no formato <strong>.XLSX (Excel)</strong> ou <strong>.CSV</strong>.</p>
                <p>A primeira linha deve conter os cabeçalhos. O sistema tentará identificar automaticamente, mas prefira usar os seguintes nomes de coluna:</p>
                
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 font-mono text-xs overflow-x-auto">
                    <div className="mb-2 font-bold text-gray-900">Colunas Esperadas:</div>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>SKU</strong> (Código único)</li>
                        <li><strong>Nome</strong> (Descrição do item)</li>
                        <li><strong>Preco</strong> (Use ponto para decimais, ex: 10.50)</li>
                        <li><strong>Estoque</strong> (Quantidade inicial)</li>
                        <li><strong>Referencia</strong> (Opcional)</li>
                        <li><strong>Categoria</strong> (Ex: Metal, Plastico, Tomada)</li>
                        <li><strong>Unidade</strong> (Apenas para Matéria Prima: KG, METRO, LITRO, UNIDADE)</li>
                    </ul>
                </div>

                <div className="bg-blue-50 p-3 rounded text-blue-800 text-xs">
                    <strong>Dica:</strong> A importação ignora acentos nos cabeçalhos (ex: "Preço" ou "Preco" funcionam).
                </div>
             </div>

             <div className="mt-6 flex justify-end">
                <button 
                    onClick={() => setShowImportHelp(false)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
                >
                    Entendi
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
