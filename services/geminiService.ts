import { GoogleGenAI } from "@google/genai";
import { Order, Product, OrderStatus } from '../types';

export const analyzeFactoryData = async (orders: Order[], products: Product[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Chave de API não configurada. Por favor, verifique suas variáveis de ambiente.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Summarize data for the prompt to save tokens
  const activeOrders = orders.filter(o => o.status !== OrderStatus.CONCLUIDO);
  const delayedOrders = activeOrders.filter(o => new Date(o.deliveryDate) < new Date());
  const criticalStock = products.filter(p => p.stockRaw < 100);

  const prompt = `
    Atue como um Gerente Industrial Sênior de uma fábrica de componentes elétricos (tomadas, chuveiros, etc).
    Analise os seguintes dados operacionais e forneça um relatório curto (máximo 4 parágrafos) em Português.
    
    DADOS:
    - Total de Pedidos Ativos: ${activeOrders.length}
    - Pedidos Atrasados: ${delayedOrders.length}
    - Produtos com Matéria Prima Crítica (<100 un): ${criticalStock.map(p => p.name).join(', ') || 'Nenhum'}
    - Distribuição por Estágio:
      ${Object.values(OrderStatus).map(status => {
        const count = activeOrders.filter(o => o.status === status).length;
        return count > 0 ? `${status}: ${count}` : null;
      }).filter(Boolean).join(', ')}

    INSTRUÇÕES:
    1. Identifique o gargalo atual (onde tem mais pedidos acumulados).
    2. Sugira uma ação corretiva imediata.
    3. Alerte sobre riscos de estoque se houver.
    4. Mantenha um tom profissional e direto. Use formatação Markdown (negrito, listas).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a IA. Tente novamente mais tarde.";
  }
};
