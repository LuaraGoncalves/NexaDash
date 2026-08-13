import { useEffect, useMemo, useState } from 'react';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ContextHelp from '../components/ContextHelp';
import SaleEditModal from '../components/SaleEditModal';
import { useToast } from '../context/useToast';
import { createCustomer, listCustomers, type CustomerRecord } from '../services/customersApi';
import { listProducts, type ProductRecord } from '../services/productsApi';
import { createSale, deleteSale, listSales, updateSale, updateSaleStatus, type SalePaymentMethod, type SaleStatus } from '../services/salesApi';

type Cliente = {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
};

type ProdutoVenda = {
  id: number;
  sku: string;
  nome: string;
  preco_venda: number;
  quantidade_estoque: number;
};

type ItemVenda = {
  id_produto: number;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
};

type FormaPagamento = SalePaymentMethod;
type StatusVenda = SaleStatus;

type Venda = {
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

const walkInCustomerLabel = 'Cliente avulso';

export default function Vendas() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'nova_venda' | 'historico'>('nova_venda');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [isUpdatingSale, setIsUpdatingSale] = useState(false);
  const [isDeletingSale, setIsDeletingSale] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<ProdutoVenda[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<number>(0);
  const [walkInCustomerName, setWalkInCustomerName] = useState(walkInCustomerLabel);
  const [searchTermPDV, setSearchTermPDV] = useState('');
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState<FormaPagamento>('PIX');
  const [historicoSearch, setHistoricoSearch] = useState('');
  const [historicoStatus, setHistoricoStatus] = useState<StatusVenda | 'Todas'>('Todas');
  const [vendaDetalhesModal, setVendaDetalhesModal] = useState<Venda | null>(null);
  const [saleToEdit, setSaleToEdit] = useState<Venda | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Venda | null>(null);
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

        setVendas(salesResponse.map(mapSaleRecord));
        setClientes(customersResponse.filter((customer) => customer.status === 'ativo').map(mapCustomerToClient));
        setProdutos(
          productsResponse
            .filter((product) => product.status === 'ativo')
            .map(mapProductToVendaProduto),
        );
      } catch (error) {
        console.error('Erro ao carregar dados de vendas:', error);
        showToast({
          tone: 'error',
          title: 'Nao consegui carregar o modulo de vendas',
          description: 'Os dados do PDV nao vieram da API agora.',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    void carregarDados();
  }, [showToast]);

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItensCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const clienteSelecionado = clientes.find((cliente) => cliente.id === selectedClienteId);
  const nomeClienteVenda = clienteSelecionado?.nome ?? (walkInCustomerName.trim() || walkInCustomerLabel);

  const produtosFiltrados = useMemo(
    () =>
      produtos.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(searchTermPDV.toLowerCase()) ||
          produto.sku.toLowerCase().includes(searchTermPDV.toLowerCase()),
      ),
    [produtos, searchTermPDV],
  );

  const vendasFiltradas = useMemo(
    () =>
      vendas.filter((venda) => {
        const matchBusca =
          venda.cliente_nome.toLowerCase().includes(historicoSearch.toLowerCase()) ||
          venda.protocolo.toLowerCase().includes(historicoSearch.toLowerCase());
        const matchStatus = historicoStatus === 'Todas' || venda.status === historicoStatus;
        return matchBusca && matchStatus;
      }),
    [historicoSearch, historicoStatus, vendas],
  );

  const totalFaturadoPeriodo = vendasFiltradas
    .filter((venda) => venda.status === 'Concluída')
    .reduce((acc, venda) => acc + venda.total, 0);

  const qtdVendasConcluidas = vendasFiltradas.filter((venda) => venda.status === 'Concluída').length;

  const adicionarAoCarrinho = (produto: ProdutoVenda) => {
    setCarrinho((prev) => {
      const existe = prev.find((item) => item.id_produto === produto.id);

      if (existe) {
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
          preco_unitario: produto.preco_venda,
          quantidade: 1,
          subtotal: produto.preco_venda,
        },
      ];
    });

    setSearchTermPDV('');
  };

  const alterarQuantidade = (idProduto: number, delta: number) => {
    setCarrinho((prev) =>
      prev.map((item) => {
        if (item.id_produto !== idProduto) {
          return item;
        }

        const novaQuantidade = Math.max(1, item.quantidade + delta);

        return {
          ...item,
          quantidade: novaQuantidade,
          subtotal: novaQuantidade * item.preco_unitario,
        };
      }),
    );
  };

  const removerDoCarrinho = (idProduto: number) => {
    setCarrinho((prev) => prev.filter((item) => item.id_produto !== idProduto));
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      showToast({
        tone: 'info',
        title: 'Carrinho vazio',
        description: 'Escolha pelo menos um produto antes de finalizar.',
      });
      return;
    }

    setIsSavingSale(true);

    try {
      const sale = await createSale({
        id_cliente: selectedClienteId || undefined,
        cliente_nome: nomeClienteVenda,
        data_hora: new Date().toISOString().replace('T', ' ').slice(0, 16),
        total: totalCarrinho,
        forma_pagamento: formaPagamentoSelecionada,
        status: 'Concluída',
        itens: carrinho,
      });

      const novaVenda = mapSaleRecord(sale);
      setVendas((prev) => [novaVenda, ...prev]);
      setCarrinho([]);
      setSelectedClienteId(0);
      setWalkInCustomerName(walkInCustomerLabel);
      setFormaPagamentoSelecionada('PIX');
      setActiveTab('historico');
      showToast({
        tone: 'success',
        title: 'Venda registrada',
        description: `A venda ${novaVenda.protocolo} foi salva com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar a venda',
        description: 'O servidor nao confirmou essa venda agora.',
      });
    } finally {
      setIsSavingSale(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) {
      return;
    }

    setIsDeletingSale(true);

    try {
      const response = await deleteSale(saleToDelete.id);
      const vendaAtualizada = mapSaleRecord(response.sale);

      setVendas((prev) => prev.map((sale) => (sale.id === vendaAtualizada.id ? vendaAtualizada : sale)));
      setVendaDetalhesModal((prev) => (prev?.id === vendaAtualizada.id ? vendaAtualizada : prev));
      setSaleToDelete(null);
      showToast({
        tone: 'success',
        title: 'Venda cancelada',
        description: `A venda ${vendaAtualizada.protocolo} foi cancelada e continuou no historico.`,
      });
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui cancelar a venda',
        description: 'O servidor nao confirmou esse cancelamento agora.',
      });
    } finally {
      setIsDeletingSale(false);
    }
  };

  const handleUpdateSaleStatus = async (sale: Venda, status: StatusVenda) => {
    try {
      const response = await updateSaleStatus(sale.id, status);
      const vendaAtualizada = mapSaleRecord(response);

      setVendas((prev) => prev.map((item) => (item.id === vendaAtualizada.id ? vendaAtualizada : item)));
      setVendaDetalhesModal(vendaAtualizada);
      showToast({
        tone: 'success',
        title: 'Status da venda atualizado',
        description: `${vendaAtualizada.protocolo} agora esta como ${vendaAtualizada.status}.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status da venda:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui atualizar a venda',
        description: 'A API nao confirmou essa mudanca agora.',
      });
    }
  };

  const handleSaveSaleEdition = async (saleId: number, payload: Parameters<typeof updateSale>[1]) => {
    setIsUpdatingSale(true);

    try {
      const response = await updateSale(saleId, payload);
      const vendaAtualizada = mapSaleRecord(response);

      setVendas((prev) => prev.map((item) => (item.id === vendaAtualizada.id ? vendaAtualizada : item)));
      setVendaDetalhesModal(vendaAtualizada);
      setSaleToEdit(null);
      showToast({
        tone: 'success',
        title: 'Venda atualizada',
        description: `${vendaAtualizada.protocolo} foi editada com os novos dados.`,
      });
    } catch (error) {
      console.error('Erro ao editar venda:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui editar a venda',
        description: 'A API nao confirmou essa edicao agora.',
      });
    } finally {
      setIsUpdatingSale(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

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
        description: 'Preencha pelo menos o nome da cliente antes de salvar.',
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
        description: `${mappedCustomer.nome} agora esta disponivel no PDV.`,
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-700 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300 mb-3">Modo PDV</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Ponto de Venda</h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Agora o PDV usa produtos e clientes reais da API, com cadastro rapido no fluxo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ContextHelp title="Ajuda do PDV">
            <p>Cliente e quem compra. Se a pessoa nao existir ainda, voce pode cadastrar na hora.</p>
            <p>Excluir venda aqui significa cancelar, para o historico nao se perder.</p>
          </ContextHelp>
          <button
            onClick={() => setActiveTab('nova_venda')}
            className={`px-5 py-3 text-sm font-black rounded-full transition-colors ${activeTab === 'nova_venda' ? 'bg-[#23272d] text-white border border-[#00e6e6]' : 'text-gray-400 bg-[#1a1e23] border border-gray-700 hover:text-white'}`}
          >
            Nova Venda
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-5 py-3 text-sm font-black rounded-full transition-colors ${activeTab === 'historico' ? 'bg-[#23272d] text-white border border-[#00e6e6]' : 'text-gray-400 bg-[#1a1e23] border border-gray-700 hover:text-white'}`}
          >
            Histórico de Vendas
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === 'nova_venda' && (
          <div className="absolute inset-0 overflow-y-auto pr-1">
            <div className="flex min-h-full flex-col gap-4">
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <SummaryCard label="Cliente" value={nomeClienteVenda} helper={clienteSelecionado?.telefone ?? clienteSelecionado?.email ?? 'Venda sem cadastro formal'} />
                <SummaryCard label="Itens" value={String(totalItensCarrinho)} helper="Quantidade total no carrinho" />
                <SummaryCard label="Pagamento" value={formaPagamentoSelecionada} helper="Forma escolhida no fechamento" />
                <SummaryCard label="Total" value={formatCurrency(totalCarrinho)} helper="Valor pronto para finalizar" highlight />
              </section>

              <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
                <section className="min-h-0 rounded-[1.75rem] border border-gray-800 bg-[#23272d] p-5 shadow-xl md:p-6 flex flex-col">
                  <div className="mb-5 flex flex-col gap-4 border-b border-gray-800 pb-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300 mb-3">Catálogo rápido</p>
                      <h3 className="text-2xl font-black text-white">Escolha os produtos</h3>
                      <p className="mt-2 text-sm text-gray-400">
                        Aqui entram apenas produtos ativos e reais que vieram da API.
                      </p>
                    </div>

                    <input
                      type="text"
                      placeholder="Buscar produto ou código..."
                      value={searchTermPDV}
                      onChange={(event) => setSearchTermPDV(event.target.value)}
                      className="w-full xl:max-w-md rounded-2xl border border-cyan-500/40 bg-[#1a1e23] px-5 py-4 text-base text-white outline-none transition focus:border-[#00e6e6]"
                    />
                  </div>

                  {isLoadingData ? (
                    <div className="rounded-[1.5rem] border border-dashed border-gray-700 bg-[#1a1e23] px-5 py-12 text-center text-gray-500">
                      Carregando catálogo real...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                      {produtosFiltrados.map((produto) => (
                        <button
                          key={produto.id}
                          onClick={() => adicionarAoCarrinho(produto)}
                          className="rounded-[1.5rem] border border-gray-700 bg-[#1a1e23] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#00e6e6]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-mono text-gray-500">SKU {produto.sku}</p>
                              <p className="mt-2 text-base font-black text-white">{produto.nome}</p>
                            </div>
                            <span className="rounded-full bg-[#23272d] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                              estoque {produto.quantidade_estoque}
                            </span>
                          </div>

                          <div className="mt-5 flex items-end justify-between gap-3">
                            <p className="text-xl font-black text-cyan-300">{formatCurrency(produto.preco_venda)}</p>
                            <span className="rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                              adicionar
                            </span>
                          </div>
                        </button>
                      ))}

                      {produtosFiltrados.length === 0 && (
                        <div className="col-span-full rounded-[1.5rem] border border-dashed border-gray-700 bg-[#1a1e23] px-5 py-12 text-center text-gray-500">
                          Nenhum produto encontrado para essa busca.
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <aside className="flex min-h-0 flex-col gap-4">
                  <section className="rounded-[1.75rem] border border-gray-800 bg-[#23272d] p-5 shadow-xl md:p-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Cliente</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <h3 className="text-xl font-black text-white">Quem vai pagar?</h3>
                      <button
                        type="button"
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300 transition hover:bg-cyan-500/20"
                      >
                        Nova cliente
                      </button>
                    </div>
                    <select
                      value={selectedClienteId}
                      onChange={(event) => setSelectedClienteId(Number(event.target.value))}
                      className="mt-4 w-full rounded-2xl border border-gray-700 bg-[#1a1e23] px-5 py-4 text-base text-white outline-none focus:border-[#00e6e6]"
                    >
                      <option value={0}>Venda sem cadastro</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome} {cliente.telefone ? `- ${cliente.telefone}` : ''}
                        </option>
                      ))}
                    </select>

                    {selectedClienteId === 0 && (
                      <input
                        type="text"
                        value={walkInCustomerName}
                        onChange={(event) => setWalkInCustomerName(event.target.value)}
                        placeholder="Nome opcional para venda avulsa"
                        className="mt-3 w-full rounded-2xl border border-gray-700 bg-[#1a1e23] px-5 py-4 text-base text-white outline-none focus:border-[#00e6e6]"
                      />
                    )}
                  </section>

                  <section className="min-h-[260px] rounded-[1.75rem] border border-gray-800 bg-[#23272d] p-5 shadow-xl md:p-6 flex flex-col">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Carrinho</p>
                        <h3 className="mt-2 text-xl font-black text-white">Resumo da venda</h3>
                      </div>
                      <button
                        onClick={() => setCarrinho([])}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-300 hover:bg-white/10"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {carrinho.length === 0 ? (
                        <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 text-gray-500">
                          Nenhum item no carrinho ainda.
                        </div>
                      ) : (
                        carrinho.map((item, index) => (
                          <div key={item.id_produto} className="rounded-2xl border border-gray-700 bg-[#1a1e23] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-mono text-gray-500">{String(index + 1).padStart(2, '0')}</p>
                                <p className="mt-1 text-base font-black text-white">{item.nome}</p>
                                <p className="mt-1 text-xs text-gray-500">{formatCurrency(item.preco_unitario)} por unidade</p>
                              </div>
                              <button onClick={() => removerDoCarrinho(item.id_produto)} className="text-gray-500 hover:text-red-500">
                                x
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-[#23272d] px-3 py-2">
                                <button onClick={() => alterarQuantidade(item.id_produto, -1)} className="h-8 w-8 rounded-full bg-[#1a1e23] text-white font-black">
                                  -
                                </button>
                                <span className="w-6 text-center font-bold">{item.quantidade}</span>
                                <button onClick={() => alterarQuantidade(item.id_produto, 1)} className="h-8 w-8 rounded-full bg-[#1a1e23] text-cyan-300 font-black">
                                  +
                                </button>
                              </div>
                              <p className="text-lg font-black text-cyan-300">{formatCurrency(item.subtotal)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-gray-800 bg-[#23272d] p-5 shadow-xl md:p-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Fechamento</p>
                    <h3 className="mt-2 text-xl font-black text-white">Pagamento e total</h3>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'].map((forma) => (
                        <button
                          key={forma}
                          onClick={() => setFormaPagamentoSelecionada(forma as FormaPagamento)}
                          className={`rounded-2xl border px-3 py-4 text-sm font-black transition-colors ${
                            formaPagamentoSelecionada === forma
                              ? 'border-[#00e6e6] bg-[#00e6e6]/15 text-[#00e6e6]'
                              : 'border-gray-700 bg-[#1a1e23] text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {forma}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-[#1a1e23] p-4">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Itens</span>
                        <span>{totalItensCarrinho}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-gray-400">
                        <span>Cliente</span>
                        <span className="truncate pl-4 text-right">{nomeClienteVenda}</span>
                      </div>
                      <div className="mt-4 border-t border-gray-700 pt-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Total a pagar</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-[#00e6e6]">{formatCurrency(totalCarrinho)}</p>
                      </div>
                    </div>

                    <button
                      onClick={finalizarVenda}
                      disabled={carrinho.length === 0 || isSavingSale}
                      className="mt-5 w-full rounded-2xl bg-[#00e6e6] py-5 text-lg font-black uppercase text-[#1a1e23] shadow-[0_0_20px_rgba(0,230,230,0.4)] transition-all disabled:bg-gray-700 disabled:text-gray-500"
                    >
                      {isSavingSale ? 'Salvando...' : 'Finalizar Venda'}
                    </button>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-700 pb-6">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Buscar por cliente ou protocolo..."
                  value={historicoSearch}
                  onChange={(event) => setHistoricoSearch(event.target.value)}
                  className="w-full sm:w-80 bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                />
                <select
                  value={historicoStatus}
                  onChange={(event) => setHistoricoStatus(event.target.value as StatusVenda | 'Todas')}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                >
                  <option value="Todas">Status: Todas</option>
                  <option value="Concluída">Status: Concluídas</option>
                  <option value="Aberta">Status: Abertas</option>
                  <option value="Cancelada">Status: Canceladas</option>
                </select>
              </div>

              <div className="flex space-x-6 bg-[#1a1e23] p-3 rounded-xl border border-gray-800 w-full md:w-auto justify-between md:justify-end">
                <div className="text-center md:text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Qtd Vendas</p>
                  <p className="text-lg font-bold text-white leading-none mt-1">{qtdVendasConcluidas}</p>
                </div>
                <div className="w-px bg-gray-700"></div>
                <div className="text-center md:text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Faturado</p>
                  <p className="text-lg font-bold text-[#00e6e6] leading-none mt-1">{formatCurrency(totalFaturadoPeriodo)}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-gray-700">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#1a1e23] text-gray-300 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-bold">Data & Protocolo</th>
                    <th className="px-6 py-4 font-bold">Cliente</th>
                    <th className="px-6 py-4 font-bold">Pagamento</th>
                    <th className="px-6 py-4 font-bold">Total</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {isLoadingData ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-500">Carregando vendas...</td>
                    </tr>
                  ) : vendasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma venda encontrada.</td>
                    </tr>
                  ) : (
                    vendasFiltradas.map((venda) => (
                      <tr key={venda.id} className="hover:bg-[#2a3038] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{venda.data_hora}</span>
                            <span className="text-[10px] text-gray-500 font-mono mt-0.5">{venda.protocolo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{venda.cliente_nome}</td>
                        <td className="px-6 py-4">
                          <span className="bg-[#1a1e23] border border-gray-700 px-2 py-1 rounded text-xs">{venda.forma_pagamento}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#00e6e6] font-bold text-base">{formatCurrency(venda.total)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${venda.status === 'Concluída' ? 'border-green-500 text-green-500 bg-green-500/10' : venda.status === 'Aberta' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
                            {venda.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setVendaDetalhesModal(venda)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors opacity-50 group-hover:opacity-100"
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {vendaDetalhesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">Detalhes do Pedido</h3>
              <button onClick={() => setVendaDetalhesModal(null)} className="text-gray-400 hover:text-white">x</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-[#23272d]">
              <div className="bg-[#1a1e23] rounded-xl p-4 border border-gray-800 mb-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Cliente</p>
                <p className="text-white font-bold">{vendaDetalhesModal.cliente_nome}</p>
                {clientes.find((cliente) => cliente.id === vendaDetalhesModal.id_cliente)?.telefone && (
                  <p className="text-xs text-gray-400">Tel: {clientes.find((cliente) => cliente.id === vendaDetalhesModal.id_cliente)?.telefone}</p>
                )}
                {clientes.find((cliente) => cliente.id === vendaDetalhesModal.id_cliente)?.email && (
                  <p className="text-xs text-gray-400">Email: {clientes.find((cliente) => cliente.id === vendaDetalhesModal.id_cliente)?.email}</p>
                )}
              </div>

              <div className="border border-gray-700 rounded-xl overflow-hidden bg-[#1a1e23]">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-[#23272d] text-[10px] uppercase text-gray-500 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-2 font-bold">Produto</th>
                      <th className="px-4 py-2 font-bold text-center">Qtd</th>
                      <th className="px-4 py-2 font-bold text-right">V. Unit</th>
                      <th className="px-4 py-2 font-bold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {vendaDetalhesModal.itens.map((item, index) => (
                      <tr key={`${item.id_produto}-${index}`}>
                        <td className="px-4 py-3 font-semibold">{item.nome}</td>
                        <td className="px-4 py-3 text-center">{item.quantidade}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(item.preco_unitario)}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-between items-center rounded-b-2xl">
              <div className="flex flex-wrap gap-3">
                {vendaDetalhesModal.status !== 'Aberta' && (
                  <button
                    type="button"
                    onClick={() => void handleUpdateSaleStatus(vendaDetalhesModal, 'Aberta')}
                    className="text-yellow-300 hover:text-yellow-200 text-sm font-bold"
                  >
                    Marcar aberta
                  </button>
                )}
                {vendaDetalhesModal.status !== 'Concluída' && (
                  <button
                    type="button"
                    onClick={() => void handleUpdateSaleStatus(vendaDetalhesModal, 'Concluída')}
                    className="text-emerald-300 hover:text-emerald-200 text-sm font-bold"
                  >
                    Marcar concluida
                  </button>
                )}
                {vendaDetalhesModal.status !== 'Cancelada' && (
                  <button onClick={() => setSaleToDelete(vendaDetalhesModal)} className="text-red-500 hover:text-red-400 text-sm font-bold underline transition-colors">
                    Cancelar Venda
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSaleToEdit(vendaDetalhesModal)}
                  className="text-sky-300 hover:text-sky-200 text-sm font-bold"
                >
                  Editar venda
                </button>
              </div>
              <button onClick={() => setVendaDetalhesModal(null)} className="px-6 py-2 bg-[#00e6e6] text-[#1a1e23] text-sm font-bold rounded-lg">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={saleToDelete !== null}
        title="Cancelar venda?"
        description={`A venda ${saleToDelete?.protocolo ?? ''} não será apagada. Ela vai apenas mudar para Cancelada e continuará no histórico.`}
        confirmLabel="Cancelar venda"
        tone="warning"
        isSubmitting={isDeletingSale}
        onCancel={() => setSaleToDelete(null)}
        onConfirm={handleDeleteSale}
      />

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-700 bg-[#23272d] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 bg-[#1a1e23] px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">Nova cliente do PDV</h3>
              <button onClick={() => { setIsCustomerModalOpen(false); resetCustomerForm(); }} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Observacoes</label>
                <textarea
                  rows={3}
                  value={customerForm.notes}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsCustomerModalOpen(false); resetCustomerForm(); }}
                  className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#00e6e6] px-6 py-2 text-sm font-bold text-[#1a1e23] disabled:bg-gray-700 disabled:text-gray-500"
                  disabled={isSavingCustomer}
                >
                  {isSavingCustomer ? 'Salvando...' : 'Salvar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SaleEditModal
        key={saleToEdit?.id ?? 'sale-edit-modal'}
        sale={saleToEdit}
        customers={clientes}
        products={produtos}
        isSaving={isUpdatingSale}
        onClose={() => setSaleToEdit(null)}
        onSave={handleSaveSaleEdition}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  highlight = false,
}: {
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-xl ${highlight ? 'border-cyan-500/30 bg-[#1d2630]' : 'border-gray-800 bg-[#23272d]'}`}>
      <p className={`text-[10px] uppercase tracking-[0.3em] ${highlight ? 'text-cyan-300' : 'text-gray-500'}`}>{label}</p>
      <p className={`mt-3 font-black ${highlight ? 'text-3xl text-[#00e6e6]' : 'text-lg text-white'}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-400">{helper}</p>
    </div>
  );
}

function mapCustomerToClient(customer: CustomerRecord): Cliente {
  return {
    id: customer.id,
    nome: customer.name,
    telefone: customer.phone ?? undefined,
    email: customer.email ?? undefined,
    observacoes: customer.notes ?? undefined,
  };
}

function mapProductToVendaProduto(product: ProductRecord): ProdutoVenda {
  return {
    id: product.id,
    sku: product.sku,
    nome: product.nome,
    preco_venda: Number(product.preco_venda),
    quantidade_estoque: product.quantidade,
  };
}

function mapSaleRecord(sale: {
  id: number;
  protocolo: string | null;
  id_cliente?: number;
  cliente_nome: string;
  data_hora: string;
  total: number;
  forma_pagamento: string;
  status?: 'Aberta' | 'Concluída' | 'Cancelada';
  itens: ItemVenda[];
}): Venda {
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
