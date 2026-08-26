import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../context/useToast';
import { createCustomer, listCustomers, type CustomerRecord } from '../services/customersApi';
import { listProducts, type ProductRecord } from '../services/productsApi';
import { createSale, listSales, type SaleRecord } from '../services/salesApi';
import { formatCurrency } from '../utils/formatters';

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
  quantidade_estoque: number;
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
    const itemExistente = carrinho.find((item) => item.id_produto === produto.id);
    const quantidadeNoCarrinho = itemExistente?.quantidade ?? 0;

    if (quantidadeNoCarrinho >= produto.quantidade_estoque) {
      showToast({
        tone: 'info',
        title: 'Estoque no limite',
        description: `Voce ja separou tudo que existe de ${produto.nome}.`,
      });
      return;
    }

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
    const produto = produtos.find((item) => item.id === idProduto);

    setCarrinho((prev) =>
      prev
        .map((item) => {
          if (item.id_produto !== idProduto) {
            return item;
          }

          const estoqueDisponivel = produto?.quantidade_estoque ?? item.quantidade;
          const novaQuantidade = Math.min(estoqueDisponivel, item.quantidade + delta);

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
      setProdutos((prev) => reconcileEmployeeProductStock(prev, sale));

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
    <div className="h-full overflow-auto bg-[#f6f1e8] text-[#20242c]">
      <div className="mx-auto flex min-h-full max-w-[1680px] flex-col gap-4 p-4 md:p-5">
        <section className="overflow-hidden rounded-[2rem] bg-[#fffdfa] shadow-[0_18px_45px_rgba(56,50,43,0.10)] ring-1 ring-[#ded6c9]">
          <div className="h-3 bg-[linear-gradient(90deg,#20242c_0%,#20242c_66%,#f97316_66%,#f97316_100%)]" />
          <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[#20242c]">Frente de caixa</h2>
              <p className="mt-1 text-sm text-[#766f66]">Venda rápida com produtos, cupom e total sempre visíveis.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <span className="rounded-2xl bg-[#f97316] px-4 py-3 text-center text-sm font-semibold text-white">
                Caixa livre
              </span>
              <span className="rounded-2xl bg-[#f6d957]/35 px-4 py-3 text-center text-sm font-semibold text-[#9a5b17]">
                {totalItens} itens
              </span>
              <span className="rounded-2xl bg-[#20242c] px-4 py-3 text-center text-sm font-semibold text-[#fffdfa]">
                {formatCurrency(totalCarrinho)}
              </span>
            </div>
          </div>
        </section>

        <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-[2rem] bg-[#fffdfa] shadow-[0_18px_45px_rgba(56,50,43,0.10)] ring-1 ring-[#ded6c9]">
            <div className="flex flex-col gap-3 bg-[#20242c] px-5 py-4 text-[#fffdfa] lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold">Venda aberta</h3>
                <p className="mt-1 text-sm text-[#e9e3d9]">Digite o código ou toque no produto para lançar no cupom.</p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Código ou nome do produto"
                className="min-h-12 w-full rounded-2xl border border-white/30 bg-[#fffdfa] px-4 text-base text-[#20242c] outline-none transition focus:border-[#f6d957] lg:max-w-md"
              />
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="rounded-[1.5rem] border border-[#ded6c9] bg-[#f6f1e8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold text-[#20242c]">Produtos</h4>
                  <span className="rounded-xl bg-[#fffdfa] px-2 py-1 text-sm font-medium text-[#766f66] ring-1 ring-[#eee6da]">
                    {produtosFiltrados.length}
                  </span>
                </div>

                {loadingData ? (
                  <div className="mt-4 rounded-xl bg-[#fffdfa] px-4 py-10 text-center text-sm text-[#766f66]">
                    Carregando produtos...
                  </div>
                ) : produtosFiltrados.length === 0 ? (
                  <div className="mt-4 rounded-xl bg-[#fffdfa] px-4 py-10 text-center text-sm text-[#766f66]">
                    Nenhum produto encontrado.
                  </div>
                ) : (
                  <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                    {produtosFiltrados.map((produto) => (
                      <button
                        type="button"
                        key={produto.id}
                        onClick={() => adicionarProduto(produto)}
                        disabled={produto.quantidade_estoque <= 0}
                        className="group w-full rounded-[1.25rem] bg-[#fffdfa] p-3 text-left ring-1 ring-[#eee6da] transition hover:-translate-y-0.5 hover:ring-[#f97316] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-[#20242c]">{produto.nome}</p>
                            <p className="mt-1 text-xs font-medium text-[#766f66]">
                              {produto.sku} / estoque {produto.quantidade_estoque}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-xl bg-[#f6d957]/35 px-2 py-1 text-sm font-semibold text-[#9a5b17]">
                            {formatCurrency(produto.preco)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-[#766f66]">
                            {produto.quantidade_estoque > 0 ? 'Disponível' : 'Sem estoque'}
                          </span>
                          <span className="rounded-xl bg-[#20242c] px-3 py-2 text-sm font-semibold text-[#fffdfa] group-disabled:bg-[#c9beaf]">
                            Lançar
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[1.5rem] border border-[#ded6c9] bg-[#fffdfa]">
                <div className="flex flex-col gap-2 border-b border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">Cupom da venda</h4>
                    <p className="text-sm text-[#766f66]">Cliente: {nomeClienteSelecionado}</p>
                  </div>
                  <button
                    type="button"
                    onClick={limparCarrinho}
                    disabled={carrinho.length === 0}
                    className="rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-3 py-2 text-sm font-medium text-[#766f66] transition hover:border-[#c9beaf] hover:text-[#20242c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Limpar cupom
                  </button>
                </div>

                {carrinho.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center bg-[linear-gradient(#eee6da_1px,transparent_1px)] bg-[length:100%_44px] px-5 text-center text-[#766f66]">
                    Toque em um produto para lançar o primeiro item.
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="sticky top-0 bg-[#eee8de] text-xs font-semibold uppercase text-[#766f66]">
                        <tr>
                          <th className="px-4 py-3">Código</th>
                          <th className="px-4 py-3">Produto</th>
                          <th className="px-4 py-3 text-center">Qtd</th>
                          <th className="px-4 py-3 text-right">Unitário</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eee6da]">
                        {carrinho.map((item) => (
                          <tr key={item.id_produto} className="hover:bg-[#f6f1e8]">
                            <td className="px-4 py-3 font-medium text-[#766f66]">{item.id_produto}</td>
                            <td className="px-4 py-3 font-semibold text-[#20242c]">{item.nome}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  aria-label={`Diminuir ${item.nome}`}
                                  onClick={() => alterarQuantidade(item.id_produto, -1)}
                                  className="h-9 w-9 rounded-xl border border-[#ded6c9] bg-[#fffdfa] text-lg font-semibold text-[#20242c]"
                                >
                                  -
                                </button>
                                <span className="min-w-8 text-center text-base font-semibold">{item.quantidade}</span>
                                <button
                                  type="button"
                                  aria-label={`Aumentar ${item.nome}`}
                                  onClick={() => alterarQuantidade(item.id_produto, 1)}
                                  className="h-9 w-9 rounded-xl bg-[#20242c] text-lg font-semibold text-[#fffdfa]"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-[#766f66]">{formatCurrency(item.preco_unitario)}</td>
                            <td className="px-4 py-3 text-right text-base font-semibold text-[#20242c]">{formatCurrency(item.subtotal)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => alterarQuantidade(item.id_produto, -item.quantidade)}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-[#9f2d2d] hover:bg-[#f8eaea]"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-[#ded6c9] bg-[#f6f1e8] px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium text-[#766f66]">{totalItens} itens lançados</span>
                    <span className="text-2xl font-semibold text-[#20242c]">Subtotal {formatCurrency(totalCarrinho)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="xl:sticky xl:top-4 xl:self-start">
            <section className="overflow-hidden rounded-[2rem] bg-[#fffdfa] shadow-[0_18px_45px_rgba(56,50,43,0.10)] ring-1 ring-[#ded6c9]">
              <div className="bg-[#f97316] px-5 py-4 text-white">
                <h3 className="text-xl font-semibold">Total da venda</h3>
                <p className="mt-1 text-sm text-[#fff1e7]">Conferência final antes de cobrar.</p>
              </div>

              <div className="space-y-5 p-5">
                <div className="rounded-[1.5rem] bg-[#20242c] p-5 text-[#fffdfa]">
                  <p className="text-sm text-[#e9e3d9]">Valor a cobrar</p>
                  <p className="mt-2 text-5xl font-semibold">{formatCurrency(totalCarrinho)}</p>
                  <p className="mt-2 text-sm text-[#e9e3d9]">{totalItens} itens no cupom</p>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="customer-select" className="text-sm font-semibold text-[#20242c]">
                      Cliente
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="rounded-2xl border border-[#ded6c9] px-3 py-2 text-sm font-medium text-[#20242c] transition hover:bg-[#f6d957]/35"
                    >
                      Novo cliente
                    </button>
                  </div>
                  <select
                    id="customer-select"
                    value={selectedClienteId}
                    onChange={(event) => setSelectedClienteId(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-4 py-3 text-base text-[#20242c] outline-none transition focus:border-[#f6d957]"
                  >
                    <option value={0}>Venda sem cadastro</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                  {selectedClienteId === 0 && (
                    <input
                      type="text"
                      value={walkInCustomerName}
                      onChange={(event) => setWalkInCustomerName(event.target.value)}
                      placeholder="Nome opcional"
                      className="mt-2 w-full rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 text-base text-[#20242c] outline-none transition focus:border-[#f6d957]"
                    />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#20242c]">Pagamento</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {formasPagamento.map((forma) => (
                      <button
                        type="button"
                        key={forma}
                        onClick={() => setFormaPagamento(forma)}
                        className={`min-h-12 rounded-xl border px-3 text-sm font-semibold transition ${
                          formaPagamento === forma
                            ? 'border-[#20242c] bg-[#20242c] text-[#fffdfa]'
                            : 'border-[#ded6c9] bg-[#f6f1e8] text-[#766f66] hover:bg-[#fffdfa] hover:text-[#20242c]'
                        }`}
                      >
                        {forma}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={finalizarVenda}
                  disabled={carrinho.length === 0 || isSaving}
                  className="w-full rounded-[1.5rem] bg-[#f97316] px-5 py-5 text-xl font-semibold text-white transition hover:bg-[#ea6a0a] disabled:cursor-not-allowed disabled:bg-[#ded6c9] disabled:text-[#766f66]"
                >
                  {isSaving ? 'Salvando...' : `Cobrar ${formatCurrency(totalCarrinho)}`}
                </button>

                <details className="rounded-[1.25rem] bg-[#f6f1e8] px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[#20242c]">
                    Últimas vendas
                  </summary>
                  <div className="mt-3 space-y-2">
                    {!loadingData && ultimasVendas.length === 0 ? (
                      <p className="text-sm text-[#766f66]">Nenhuma venda encontrada ainda.</p>
                    ) : (
                      ultimasVendas.map((venda) => (
                        <div key={venda.id} className="rounded-xl bg-[#fffdfa] px-3 py-2 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-[#20242c]">{venda.cliente_nome}</p>
                              <p className="text-[#766f66]">{venda.forma_pagamento}</p>
                            </div>
                            <p className="font-semibold text-[#20242c]">{formatCurrency(venda.total)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </details>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20242c]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] p-6 shadow-[0_24px_70px_rgba(56,50,43,0.22)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9a5b17]">Cliente</p>
                <h2 className="mt-2 text-2xl font-black">Cadastrar nova cliente</h2>
              </div>
              <button
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  resetCustomerForm();
                }}
                className="text-[#766f66] hover:text-[#20242c]"
              >
                x
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#766f66]">Nome *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-[1.25rem] border-2 border-[#ded6c9] bg-[#f6f1e8] px-4 py-4 text-base outline-none focus:border-[#f6d957]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#766f66]">Telefone</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="mt-2 w-full rounded-[1.25rem] border-2 border-[#ded6c9] bg-[#f6f1e8] px-4 py-4 text-base outline-none focus:border-[#f6d957]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#766f66]">Email</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="mt-2 w-full rounded-[1.25rem] border-2 border-[#ded6c9] bg-[#f6f1e8] px-4 py-4 text-base outline-none focus:border-[#f6d957]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#766f66]">Observacoes</label>
                <textarea
                  rows={3}
                  value={customerForm.notes}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="mt-2 w-full rounded-[1.25rem] border-2 border-[#ded6c9] bg-[#f6f1e8] px-4 py-4 text-base outline-none focus:border-[#f6d957]"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerModalOpen(false);
                    resetCustomerForm();
                  }}
                  className="rounded-[1.25rem] bg-[#eee8de] px-5 py-4 text-base font-black text-[#766f66]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="rounded-[1.25rem] bg-[#20242c] px-5 py-4 text-base font-black text-[#fffdfa] disabled:bg-[#ded6c9] disabled:text-[#766f66]"
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
    quantidade_estoque: product.quantidade,
  };
}

function reconcileEmployeeProductStock(products: Produto[], sale: Pick<SaleRecord, 'status' | 'itens'>): Produto[] {
  if (sale.status !== 'Concluída') {
    return products;
  }

  const saleQuantities = sale.itens.reduce((map, item) => {
    map.set(item.id_produto, (map.get(item.id_produto) ?? 0) + item.quantidade);
    return map;
  }, new Map<number, number>());

  return products.map((product) => ({
    ...product,
    quantidade_estoque: Math.max(0, product.quantidade_estoque - (saleQuantities.get(product.id) ?? 0)),
  }));
}
