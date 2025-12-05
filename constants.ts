import { Role, User, Product, OrderStatus } from './types';

export const DEPARTMENT_CONFIG = {
  [Role.ENGENHARIA]: { label: 'Engenharia', color: 'bg-cyan-600', next: null },
  [Role.VENDAS]: { label: 'Vendas', color: 'bg-blue-500', next: OrderStatus.ANALISE_PCP },
  [Role.PCP]: { label: 'PCP', color: 'bg-purple-500', next: OrderStatus.EM_PRODUCAO },
  [Role.PRODUCAO]: { label: 'Produção', color: 'bg-orange-500', next: OrderStatus.QUALIDADE_PENDENTE },
  [Role.QUALIDADE]: { label: 'Qualidade', color: 'bg-red-500', next: OrderStatus.EM_MONTAGEM },
  [Role.MONTAGEM]: { label: 'Montagem', color: 'bg-indigo-500', next: OrderStatus.EM_EMBALAGEM },
  [Role.EMBALAGEM]: { label: 'Embalagem', color: 'bg-pink-500', next: OrderStatus.AGUARDANDO_EXPEDICAO },
  [Role.EXPEDICAO]: { label: 'Expedição', color: 'bg-yellow-500', next: OrderStatus.EM_FATURAMENTO },
  [Role.FATURAMENTO]: { label: 'Faturamento', color: 'bg-green-600', next: OrderStatus.EM_TRANSPORTE },
  [Role.TRANSPORTE]: { label: 'Transporte', color: 'bg-slate-600', next: OrderStatus.CONCLUIDO },
  [Role.GERENTE]: { label: 'Gerência', color: 'bg-teal-700', next: null },
  [Role.ADMIN]: { label: 'Administração', color: 'bg-gray-800', next: null },
};

export const INITIAL_PRODUCTS: Product[] = [
  // Raw Materials
  { id: 'm1', name: 'Plástico ABS Branco', sku: 'MAT-001', reference: 'ABS-W-2024', category: 'Plastico', type: 'MATERIA_PRIMA', stockRaw: 1000, stockFinished: 0, price: 0.50, unitOfMeasure: 'KG' },
  { id: 'm2', name: 'Cobre Condutor', sku: 'MAT-002', reference: 'COBRE-99', category: 'Metal', type: 'MATERIA_PRIMA', stockRaw: 500, stockFinished: 0, price: 2.00, unitOfMeasure: 'KG' },
  { id: 'm3', name: 'Parafuso Latão', sku: 'MAT-003', reference: 'PAR-LAT-3MM', category: 'Metal', type: 'MATERIA_PRIMA', stockRaw: 5000, stockFinished: 0, price: 0.10, unitOfMeasure: 'UNIDADE' },
  
  // Finished Products
  { 
    id: 'p1', name: 'Tomada 3 Pinos 10A', sku: 'TOM-001', reference: 'T10A-STD', category: 'Tomada', type: 'PRODUTO_FINAL', stockRaw: 0, stockFinished: 200, price: 8.50, unitOfMeasure: 'UNIDADE',
    recipe: [
      { materialId: 'm1', materialName: 'Plástico ABS Branco', quantity: 1 },
      { materialId: 'm2', materialName: 'Cobre Condutor', quantity: 0.5 },
      { materialId: 'm3', materialName: 'Parafuso Latão', quantity: 2 }
    ]
  },
  { 
    id: 'p2', name: 'Tomada 3 Pinos 20A Vermelha', sku: 'TOM-002', reference: 'T20A-RED', category: 'Tomada', type: 'PRODUTO_FINAL', stockRaw: 0, stockFinished: 50, price: 12.00, unitOfMeasure: 'UNIDADE',
    recipe: [
      { materialId: 'm1', materialName: 'Plástico ABS Branco', quantity: 1.2 },
      { materialId: 'm2', materialName: 'Cobre Condutor', quantity: 0.8 },
      { materialId: 'm3', materialName: 'Parafuso Latão', quantity: 2 }
    ]
  },
  { 
    id: 'p3', name: 'Chuveiro Eletrônico Turbo', sku: 'CHU-001', reference: 'CHU-TRB-7500', category: 'Chuveiro', type: 'PRODUTO_FINAL', stockRaw: 0, stockFinished: 20, price: 150.00, unitOfMeasure: 'UNIDADE',
    recipe: [
      { materialId: 'm1', materialName: 'Plástico ABS Branco', quantity: 5 },
      { materialId: 'm2', materialName: 'Cobre Condutor', quantity: 2 }
    ]
  },
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Administrador', username: 'admin', role: Role.ADMIN },
  { id: 'u12', name: 'Carlos Gerente', username: 'gerente', role: Role.GERENTE },
  { id: 'u11', name: 'Roberto Engenharia', username: 'engenharia', role: Role.ENGENHARIA },
  { id: 'u2', name: 'João Vendas', username: 'vendas', role: Role.VENDAS },
  { id: 'u3', name: 'Maria PCP', username: 'pcp', role: Role.PCP },
  { id: 'u4', name: 'Carlos Produção', username: 'producao', role: Role.PRODUCAO },
  { id: 'u5', name: 'Ana Qualidade', username: 'qualidade', role: Role.QUALIDADE },
  { id: 'u6', name: 'Pedro Montagem', username: 'montagem', role: Role.MONTAGEM },
  { id: 'u7', name: 'Julia Embalagem', username: 'embalagem', role: Role.EMBALAGEM },
  { id: 'u8', name: 'Roberto Expedição', username: 'expedicao', role: Role.EXPEDICAO },
  { id: 'u9', name: 'Fernanda Faturamento', username: 'faturamento', role: Role.FATURAMENTO },
  { id: 'u10', name: 'Paulo Transporte', username: 'transporte', role: Role.TRANSPORTE },
];