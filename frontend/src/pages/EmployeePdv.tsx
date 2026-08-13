import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../context/useToast';
import { createCustomer, listCustomers, type CustomerRecord } from '../services/customersApi';
import { listProducts, type ProductRecord } from '../services/productsApi';
import { createSale, listSales } from '../services/salesApi';

type Cliente = {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
};

type Produto = {
  id: number;
  sku: string;
  nome: string;
  preco: number;
};

type ItemCarrinho = {
  id_produto: number;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
};

type FormaPagamento = 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro';

type VendaRecente = {
  id: number;
  cliente_nome: string;
  total: number;
  forma_pagamento: string;
  data_hora: string;
};

const formasPagamento: FormaPagamento[] = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];
const walkInCustomerLabel = 'Cliente avulso';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function EmployeePdv() {
  const { showToast } = useToast();
  const [selectedClienteId, setSelectedClienteId] = useState(0);
  const [search, setSearch] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [ultimasVendas, setUltimasVendas] = useState<VendaRecente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [walkInCustomerName, setWalkInCustomerName] = useState(walkInCustomerLabel);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [salesResponse, customersResponse, productsResponse] = await Promise.all([
          listSales(),
          listCustomers(),
          listProducts(),
        ]);

        setUltimasVendas(
          salesResponse.slice(0, 5).map((sale) => ({
            id: sale.id,
            cliente_nome: sale.cliente_nome,
            total: Number(sale.total),
            forma_pagamento: sale.forma_pagamento,
            data_hora: sale.data_hora,
          })),
        );
        setClientes(customersResponse.filter((customer) => customer.status === 'ativo').map(mapCustomerToClient));
        setProdutos(
          productsResponse
            .filter((product) => product.status === 'ativo')
            .map(mapProductToEmployeeProduct),
        );
      } catch (error) {
        console.error('Erro ao carregar PDV da funcionaria:', error);
        showToast({
          tone: 'error',
          title: 'Nao consegui abrir o PDV completo',
          description: 'Os dados reais nao vieram da API agora.',
        });
      } finally {
        setLoadingData(false);
      }
    };

    void carregarDados();
  }, [showToast]);

  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.subtotal, 0);
  const clienteSelecionado = clientes.find((cliente) => cliente.id === selectedClienteId);
  const nomeClienteSelecionado = clienteSelecionado?.nome ?? (walkInCustomerName.trim() || walkInCustomerLabel);

  const produtosFiltrados = useMemo(
    () =>
      produtos.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(search.toLowerCase()) ||
          produto.sku.toLowerCase().includes(search.toLowerCase()),
      ),
    [produtos, search],
  );

  const adicionarProduto = (produto: Produto) => {
    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => item.id_produto === produto.id);

      if (itemExistente) {
        return prev.map((item) =>
          item.id_produto === produto.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                subtotal: (item.quantidade + 1) * item.preco_unitario,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          id_produto: produto.id,
          nome: produto.nome,
          preco_unitario: produto.preco,
          quantidade: 1,
          subtotal: produto.preco,
        },
      ];
    });
  };

  const alterarQuantidade = (idProduto: number, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((item) => {
          if (item.id_produto !== idProduto) {
            return item;
          }

          const novaQuantidade = item.quantidade + delta;

          if (novaQuantidade <= 0) {
            return null;
          }

          return {
            ...item,
            quantidade: novaQuantidade,
            subtotal: novaQuantidade * item.preco_unitario,
          };
        })
        .filter((item): item is ItemCarrinho => item !== null),
    );
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    setSelectedClienteId(0);
    setWalkInCustomerName(walkInCustomerLabel);
    setFormaPagamento('PIX');
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      showToast({
        tone: 'info',
        title: 'Carrinho vazio',
        description: 'Escolha pelo menos um produto antes de salvar a venda.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const sale = await createSale({
        id_cliente: selectedClienteId || undefined,
        cliente_nome: nomeClienteSelecionado,
        data_hora: new Date().toISOString().replace('T', ' ').slice(0, 16),
        total: totalCarrinho,
        forma_pagamento: formaPagamento,
        status: 'Concluída',
        itens: carrinho,
      });

      setUltimasVendas((prev) => [
        {
          id: sale.id,
          cliente_nome: sale.cliente_nome,
          total: Number(sale.total),
          forma_pagamento: sale.forma_pagamento,
          data_hora: sale.data_hora,
        },
        ...prev,
      ].slice(0, 5));

      limparCarrinho();
      showToast({
        tone: 'success',
        title: 'Venda salva',
        description: 'A venda foi registrada com sucesso no servidor.',
      });
    } catch (error) {
      console.error('Erro ao salvar venda no PDV:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar a venda',
        description: 'O servidor nao confirmou essa venda agora.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      notes: '',
    });
  };

  const handleCreateCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerForm.name.trim()) {
      showToast({
        tone: 'info',
        title: 'Nome obrigatorio',
        description: 'Preencha o nome da cliente antes de salvar.',
      });
      return;
    }

    setIsSavingCustomer(true);

    try {
      const customer = await createCustomer({
        name: customerForm.name,
        phone: customerForm.phone || null,
        email: customerForm.email || null,
        notes: customerForm.notes || null,
      });

      const mappedCustomer = mapCustomerToClient(customer);
      setClientes((prev) => [...prev, mappedCustomer]);
      setSelectedClienteId(mappedCustomer.id);
      setIsCustomerModalOpen(false);
      resetCustomerForm();
      showToast({
        tone: 'success',
        title: 'Cliente criada',
        description: `${mappedCustomer.nome} entrou na lista do PDV.`,
      });
    } catch (error) {
      console.error('Erro ao criar cliente no PDV:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui criar a cliente',
        description: 'A API nao confirmou esse cadastro agora.',
      });
    } finally {
      setIsSavingCustomer(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-[#f5efe5] text-slate-900">
      <div className="mx-auto flex min-h-full max-w-[1800px] flex-col gap-5 p-4 md:p-6">
        <div className="grid flex-1 gap-5 xl:grid-cols-[1.2fr_1fr_0.95fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Produtos reais</p>
                <h2 className="text-2xl font-black">Toque para adicionar</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">
                {produtosFiltrados.length} itens
              </span>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou codigo"
              className="mb-5 w-full rounded-3xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-lg outline-none transition focus:border-[#06b6d4]"
            />

            {loadingData ? (
              <div className="rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center text-slate-500">
                Carregando catalogo real...
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {produtosFiltrados.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarProduto(produto)}
                    className="rounded-[1.75rem] border-2 border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#06b6d4] hover:bg-white"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">{produto.sku}</p>
                    <h3 className="mt-3 text-xl font-black leading-tight">{produto.nome}</h3>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <span className="text-2xl font-black text-[#0f766e]">{formatCurrency(produto.preco)}</span>
                      <span className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-black text-white">Adicionar</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] bg-[#111827] p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.15)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Carrinho</p>
                <h2 className="text-2xl font-black">O que a cliente vai levar</h2>
              </div>
              <button
                onClick={limparCarrinho}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5"
              >
                Limpar
              </button>
            </div>

            <div className="space-y-3">
              {carrinho.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 px-5 py-12 text-center text-slate-400">
                  <p className="text-lg font-bold">Carrinho vazio</p>
                  <p className="mt-2 text-sm">Toque em um produto para começar.</p>
                </div>
              ) : (
                carrinho.map((item) => (
                  <div key={item.id_produto} className="rounded-[1.5rem] bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black">{item.nome}</p>
                        <p className="mt-1 text-sm text-slate-400">{formatCurrency(item.preco_unitario)} cada</p>
                      </div>
                      <p className="text-xl font-black text-cyan-300">{formatCurrency(item.subtotal)}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => alterarQuantidade(item.id_produto, -1)} className="h-12 w-12 rounded-2xl bg-white/10 text-2xl font-black text-white">
                          -
                        </button>
                        <span className="min-w-[40px] text-center text-2xl font-black">{item.quantidade}</span>
                        <button onClick={() => alterarQuantidade(item.id_produto, 1)} className="h-12 w-12 rounded-2xl bg-cyan-400 text-2xl font-black text-slate-900">
                          +
                        </button>
                      </div>

                      <button onClick={() => alterarQuantidade(item.id_produto, -item.quantidade)} className="rounded-full border border-red-400/40 px-4 py-2 text-sm font-bold text-red-300">
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="rounded-[2rem] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Cliente real</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black">Quem esta comprando?</h2>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="rounded-full border-2 border-[#f59e0b] bg-[#fff7ed] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#b45309]"
                >
                  Nova cliente
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {clientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => setSelectedClienteId(cliente.id)}
                    className={`w-full rounded-[1.5rem] border-2 px-4 py-4 text-left transition ${
                      selectedClienteId === cliente.id ? 'border-[#f59e0b] bg-[#fff7ed]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                    >
                      <p className="text-lg font-black">{cliente.nome}</p>
                      <p className="mt-1 text-sm text-slate-500">{cliente.telefone ?? cliente.email ?? 'Sem contato cadastrado'}</p>
                    </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedClienteId(0)}
                  className={`w-full rounded-[1.5rem] border-2 px-4 py-4 text-left transition ${
                    selectedClienteId === 0 ? 'border-[#f59e0b] bg-[#fff7ed]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <p className="text-lg font-black">Venda sem cadastro</p>
                  <p className="mt-1 text-sm text-slate-500">Usar cliente avulso no caixa</p>
                </button>
                {selectedClienteId === 0 && (
                  <input
                    type="text"
                    value={walkInCustomerName}
                    onChange={(event) => setWalkInCustomerName(event.target.value)}
                    placeholder="Nome opcional para venda avulsa"
                    className="w-full rounded-[1.25rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 text-base outline-none focus:border-[#06b6d4]"
                  />
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Pagamento</p>
              <h2 className="mt-2 text-2xl font-black">Como vai pagar?</h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {formasPagamento.map((forma) => (
                  <button
                    key={forma}
                    onClick={() => setFormaPagamento(forma)}
                    className={`rounded-[1.5rem] border-2 px-4 py-5 text-center text-base font-black transition ${
                      formaPagamento === forma ? 'border-[#0f766e] bg-[#ecfeff] text-[#0f766e]' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {forma}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-[1.75rem] bg-[#0f172a] p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Resumo</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                  <span>Cliente</span>
                  <span className="font-bold text-white">{nomeClienteSelecionado}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                  <span>Itens</span>
                  <span className="font-bold text-white">{totalItens}</span>
                </div>
                <div className="mt-5 border-t border-white/10 pt-5">
                  <p className="text-sm text-slate-400">Total a cobrar</p>
                  <p className="mt-2 text-4xl font-black text-cyan-300">{formatCurrency(totalCarrinho)}</p>
                </div>

                <button
                  onClick={finalizarVenda}
                  disabled={carrinho.length === 0 || isSaving}
                  className="mt-5 w-full rounded-[1.5rem] bg-[#22c55e] px-5 py-5 text-xl font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isSaving ? 'Salvando...' : 'Finalizar venda'}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Hoje</p>
                  <h2 className="mt-2 text-2xl font-black">Últimas vendas</h2>
                </div>
                {loadingData && <span className="text-sm font-bold text-slate-400">Carregando...</span>}
              </div>

              <div className="mt-5 space-y-3">
                {!loadingData && ultimasVendas.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Nenhuma venda encontrada ainda.
                  </div>
                ) : (
                  ultimasVendas.map((venda) => (
                    <div key={venda.id} className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{venda.cliente_nome}</p>
                          <p className="mt-1 text-sm text-slate-500">{venda.forma_pagamento}</p>
                        </div>
                        <p className="text-lg font-black text-[#0f766e]">{formatCurrency(venda.total)}</p>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-400">{venda.data_hora}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Cliente</p>
                <h2 className="mt-2 text-2xl font-black">Cadastrar nova cliente</h2>
              </div>
              <button
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  resetCustomerForm();
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                x
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Nome *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-[1.25rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 text-base outline-none focus:border-[#06b6d4]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Telefone</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="mt-2 w-full rounded-[1.25rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 text-base outline-none focus:border-[#06b6d4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Email</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="mt-2 w-full rounded-[1.25rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 text-base outline-none focus:border-[#06b6d4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Observacoes</label>
                <textarea
                  rows={3}
                  value={customerForm.notes}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="mt-2 w-full rounded-[1.25rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 text-base outline-none focus:border-[#06b6d4]"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerModalOpen(false);
                    resetCustomerForm();
                  }}
                  className="rounded-[1.25rem] bg-slate-100 px-5 py-4 text-base font-black text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="rounded-[1.25rem] bg-[#22c55e] px-5 py-4 text-base font-black text-slate-950 disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {isSavingCustomer ? 'Salvando...' : 'Salvar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function mapCustomerToClient(customer: CustomerRecord): Cliente {
  return {
    id: customer.id,
    nome: customer.name,
    telefone: customer.phone ?? undefined,
    email: customer.email ?? undefined,
  };
}

function mapProductToEmployeeProduct(product: ProductRecord): Produto {
  return {
    id: product.id,
    sku: product.sku,
    nome: product.nome,
    preco: Number(product.preco_venda),
  };
}
