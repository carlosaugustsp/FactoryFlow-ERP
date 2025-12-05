export enum Role {
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',
  ENGENHARIA = 'ENGENHARIA',
  VENDAS = 'VENDAS',
  PCP = 'PCP',
  PRODUCAO = 'PRODUCAO',
  QUALIDADE = 'QUALIDADE',
  MONTAGEM = 'MONTAGEM',
  EMBALAGEM = 'EMBALAGEM',
  EXPEDICAO = 'EXPEDICAO',
  FATURAMENTO = 'FATURAMENTO',
  TRANSPORTE = 'TRANSPORTE'
}

export enum OrderStatus {
  CRIADO = 'CRIADO',           // Vendas
  ANALISE_PCP = 'ANALISE_PCP', // PCP
  EM_PRODUCAO = 'EM_PRODUCAO', // Produção
  QUALIDADE_PENDENTE = 'QUALIDADE_PENDENTE', // Qualidade
  REPROVADO = 'REPROVADO',     // Qualidade (Volta pra produção)
  EM_MONTAGEM = 'EM_MONTAGEM', // Montagem
  EM_EMBALAGEM = 'EM_EMBALAGEM', // Embalagem
  AGUARDANDO_EXPEDICAO = 'AGUARDANDO_EXPEDICAO', // Expedição
  EM_FATURAMENTO = 'EM_FATURAMENTO', // Faturamento
  EM_TRANSPORTE = 'EM_TRANSPORTE', // Transporte
  CONCLUIDO = 'CONCLUIDO'      // Final
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  password?: string;
}

export interface ProductIngredient {
  materialId: string;
  materialName: string;
  quantity: number;
}

export type UnitOfMeasure = 'UNIDADE' | 'KG' | 'METRO' | 'LITRO';

export interface Product {
  id: string;
  name: string;
  sku: string;
  reference?: string; // New field for internal/manufacturer reference
  type: 'MATERIA_PRIMA' | 'PRODUTO_FINAL';
  category: 'Tomada' | 'Interruptor' | 'Chuveiro' | 'Outros' | 'Componente' | 'Metal' | 'Plastico';
  stockRaw: number; // For raw materials, this is the actual stock. For final products, this could be parts.
  stockFinished: number; // Only for final products
  price: number; // Cost for Raw Material, Selling Price for Final Product
  recipe?: ProductIngredient[]; // List of raw materials needed
  unitOfMeasure?: UnitOfMeasure; // Unit for raw materials
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number; // Requested
  quantityProduced?: number; // Actual produced
  unitPrice: number;
}

export interface OrderLog {
  stage: OrderStatus;
  timestamp: string;
  userId: string;
  userName: string;
  note?: string;
}

export interface Order {
  id: string;
  externalId?: string; // Client PO Number
  batchNumber?: string; // Lote Number assigned by PCP
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string;
  totalValue: number;
  logs: OrderLog[];
  priority: 'BAIXA' | 'MEDIA' | 'ALTA';
  invoiceNumber?: string;
}