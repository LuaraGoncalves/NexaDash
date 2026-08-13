import { useMemo, useState } from 'react';
import type { SalePaymentMethod, SalePayload, SaleStatus } from '../services/salesApi';

export type SaleEditCustomer = {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
};

export type SaleEditProduct = {
  id: number;
  sku: string;
  nome: string;
  preco_venda: number;
  quantidade_estoque: number;
};

export type SaleEditItem = {
  id_produto: number;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
};

export type EditableSale = {
  id: number;
  id_cliente: number;
  cliente_nome: string;
  data_hora: string;
  forma_pagamento: SalePaymentMethod;
  status: SaleStatus;
  itens: SaleEditItem[];
};

type Props = {
  sale: EditableSale | null;
  customers: SaleEditCustomer[];
  products: SaleEditProduct[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (saleId: number, payload: SalePayload) => Promise<void>;
};

const paymentMethods: SalePaymentMethod[] = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Boleto',
  'Múltiplo',
];

const saleStatuses: SaleStatus[] = ['Aberta', 'Concluída', 'Cancelada'];
const walkInDefaultName = 'Cliente avulso';

export default function SaleEditModal({
  sale,
  customers,
  products,
  isSaving,
  onClose,
  onSave,
}: Props) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => sale?.id_cliente ?? 0);
  const [customerName, setCustomerName] = useState(() => sale?.cliente_nome || walkInDefaultName);
  const [dateTime, setDateTime] = useState(() => sale?.data_hora ?? '');
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>(() => sale?.forma_pagamento ?? 'PIX');
  const [status, setStatus] = useState<SaleStatus>(() => sale?.status ?? 'Aberta');
  const [items, setItems] = useState<SaleEditItem[]>(() => sale?.itens ?? []);
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.nome.toLowerCase().includes(search.toLowerCase()) ||
          product.sku.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  if (!sale) {
    return null;
  }

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);

  const addProduct = (product: SaleEditProduct) => {
    setItems((previous) => {
      const existing = previous.find((item) => item.id_produto === product.id);

      if (existing) {
        return previous.map((item) =>
          item.id_produto === product.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                subtotal: (item.quantidade + 1) * item.preco_unitario,
              }
            : item,
        );
      }

      return [
        ...previous,
        {
          id_produto: product.id,
          nome: product.nome,
          preco_unitario: product.preco_venda,
          quantidade: 1,
          subtotal: product.preco_venda,
        },
      ];
    });
  };

  const changeQuantity = (productId: number, delta: number) => {
    setItems((previous) =>
      previous
        .map((item) => {
          if (item.id_produto !== productId) {
            return item;
          }

          const nextQuantity = item.quantidade + delta;

          if (nextQuantity <= 0) {
            return null;
          }

          return {
            ...item,
            quantidade: nextQuantity,
            subtotal: nextQuantity * item.preco_unitario,
          };
        })
        .filter((item): item is SaleEditItem => item !== null),
    );
  };

  const handleSave = async () => {
    if (items.length === 0) {
      return;
    }

    const resolvedCustomerName = selectedCustomer?.nome ?? (customerName.trim() || walkInDefaultName);

    await onSave(sale.id, {
      id_cliente: selectedCustomer?.id || undefined,
      cliente_nome: resolvedCustomerName,
      data_hora: dateTime,
      forma_pagamento: paymentMethod,
      status,
      total,
      itens: items,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-gray-700 bg-[#111827] shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-gray-700 bg-[#0f172a] px-6 py-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cyan-300">Editar venda</p>
            <h3 className="mt-2 text-2xl font-black text-white">{sale.cliente_nome}</h3>
          </div>
          <button onClick={onClose} className="text-2xl font-black text-slate-400 hover:text-white">
            x
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden xl:grid-cols-[1fr_1.15fr]">
          <section className="overflow-y-auto border-b border-gray-700 p-6 xl:border-b-0 xl:border-r">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Cliente</label>
                <select
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-4 text-white outline-none focus:border-cyan-400"
                >
                  <option value={0}>Venda sem cadastro</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.nome}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomerId === 0 && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Nome da compra avulsa</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-4 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Data e hora</label>
                <input
                  type="text"
                  value={dateTime}
                  onChange={(event) => setDateTime(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-4 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as SaleStatus)}
                  className="mt-2 w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-4 text-white outline-none focus:border-cyan-400"
                >
                  {saleStatuses.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Forma de pagamento</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {paymentMethods.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPaymentMethod(option)}
                      className={`rounded-[1.25rem] border px-4 py-4 text-sm font-black transition ${
                        paymentMethod === option
                          ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300'
                          : 'border-gray-700 bg-[#0f172a] text-slate-400 hover:border-gray-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-gray-700 bg-[#0f172a] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Resumo</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Cliente</span>
                  <span className="font-bold text-white">{selectedCustomer?.nome ?? (customerName || walkInDefaultName)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Itens</span>
                  <span className="font-bold text-white">{items.reduce((acc, item) => acc + item.quantidade, 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-xl font-black text-cyan-300">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden">
            <div className="border-b border-gray-700 p-6">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Adicionar produto</label>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar produto por nome ou SKU"
                className="mt-2 w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-4 text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid flex-1 gap-0 overflow-hidden xl:grid-cols-[0.95fr_1.05fr]">
              <div className="overflow-y-auto border-b border-gray-700 p-4 xl:border-b-0 xl:border-r">
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full rounded-[1.5rem] border border-gray-700 bg-[#0f172a] p-4 text-left transition hover:border-cyan-400"
                    >
                      <p className="text-xs font-mono text-slate-500">SKU {product.sku}</p>
                      <p className="mt-2 text-base font-black text-white">{product.nome}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-cyan-300">{formatCurrency(product.preco_venda)}</span>
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
                          adicionar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto p-4">
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-gray-700 bg-[#0f172a] px-5 py-12 text-center text-slate-500">
                      Adicione pelo menos um item para salvar a venda.
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id_produto} className="rounded-[1.5rem] border border-gray-700 bg-[#0f172a] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-black text-white">{item.nome}</p>
                            <p className="mt-1 text-sm text-slate-400">{formatCurrency(item.preco_unitario)} cada</p>
                          </div>
                          <p className="text-lg font-black text-cyan-300">{formatCurrency(item.subtotal)}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id_produto, -1)}
                              className="h-10 w-10 rounded-2xl bg-white/10 text-xl font-black text-white"
                            >
                              -
                            </button>
                            <span className="min-w-[32px] text-center text-xl font-black text-white">{item.quantidade}</span>
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id_produto, 1)}
                              className="h-10 w-10 rounded-2xl bg-cyan-400 text-xl font-black text-slate-950"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id_produto, -item.quantidade)}
                            className="text-sm font-bold text-red-300"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-700 bg-[#0f172a] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            A venda continua com o mesmo protocolo. A gente só atualiza os dados dela.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[1.25rem] border border-gray-700 px-5 py-3 text-sm font-black text-slate-300"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={items.length === 0 || isSaving}
              className="rounded-[1.25rem] bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isSaving ? 'Salvando...' : 'Salvar alteraçoes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
