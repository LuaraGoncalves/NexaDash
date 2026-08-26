import type { CustomerRecord } from '../../services/customersApi';
import type { ProductRecord } from '../../services/productsApi';
import type { SaleItemPayload, SalePaymentMethod, SaleRecord, SaleStatus } from '../../services/salesApi';

export type Cliente = {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
};

export type ProdutoVenda = {
  id: number;
  sku: string;
  nome: string;
  preco_venda: number;
  quantidade_estoque: number;
};

export type ItemVenda = SaleItemPayload;
export type FormaPagamento = SalePaymentMethod;
export type StatusVenda = SaleStatus;

export type Venda = {
  id: number;
  protocolo: string;
  id_cliente: number;
  cliente_nome: string;
  data_hora: string;
  total: number;
  forma_pagamento: FormaPagamento;
  status: StatusVenda;
  itens: ItemVenda[];
};

export const walkInCustomerLabel = 'Cliente avulso';

export function mapCustomerToClient(customer: CustomerRecord): Cliente {
  return {
    id: customer.id,
    nome: customer.name,
    telefone: customer.phone ?? undefined,
    email: customer.email ?? undefined,
    observacoes: customer.notes ?? undefined,
  };
}

export function mapProductToVendaProduto(product: ProductRecord): ProdutoVenda {
  return {
    id: product.id,
    sku: product.sku,
    nome: product.nome,
    preco_venda: Number(product.preco_venda),
    quantidade_estoque: product.quantidade,
  };
}

export function reconcileProductStock(
  products: ProdutoVenda[],
  previousSale?: Pick<Venda, 'status' | 'itens'> | null,
  nextSale?: Pick<Venda, 'status' | 'itens'> | null,
): ProdutoVenda[] {
  const previousQuantities = saleItemMap(previousSale);
  const nextQuantities = saleItemMap(nextSale);

  return products.map((product) => {
    const restoredQuantity = previousQuantities.get(product.id) ?? 0;
    const consumedQuantity = nextQuantities.get(product.id) ?? 0;

    return {
      ...product,
      quantidade_estoque: Math.max(0, product.quantidade_estoque + restoredQuantity - consumedQuantity),
    };
  });
}

export function mapSaleRecord(sale: SaleRecord): Venda {
  return {
    id: sale.id,
    protocolo: sale.protocolo ?? `VND-${String(sale.id).padStart(3, '0')}`,
    id_cliente: sale.id_cliente ?? 0,
    cliente_nome: sale.cliente_nome,
    data_hora: sale.data_hora,
    total: Number(sale.total),
    forma_pagamento: sale.forma_pagamento as FormaPagamento,
    status: sale.status ?? 'Aberta',
    itens: sale.itens,
  };
}

function saleItemMap(sale?: Pick<Venda, 'status' | 'itens'> | null): Map<number, number> {
  if (!sale || sale.status !== 'Concluída') {
    return new Map();
  }

  return sale.itens.reduce((map, item) => {
    map.set(item.id_produto, (map.get(item.id_produto) ?? 0) + item.quantidade);
    return map;
  }, new Map<number, number>());
}
