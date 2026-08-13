import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ContextHelp from '../components/ContextHelp';
import { useToast } from '../context/useToast';
import {
  createFinancialCategory,
  createFinancialTransaction,
  deleteFinancialCategory,
  deleteFinancialTransaction,
  listFinancialCategories,
  listFinancialTransactions,
  updateFinancialCategory,
  updateFinancialTransaction,
  type FinancialCategoryPayload,
  type FinancialCategoryRecord,
  type FinancialCategoryType,
  type FinancialTransactionPayload,
  type FinancialTransactionRecord,
  type FinancialTransactionStatus,
  type FinancialTransactionType,
} from '../services/financeApi';

type TipoTransacao = FinancialTransactionType;
type StatusTransacao = FinancialTransactionStatus;
type TipoCategoria = FinancialCategoryType;
type FormaPagamento =
  | 'PIX'
  | 'Dinheiro'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Boleto'
  | 'Transferência';

type CategoriaFinanceira = FinancialCategoryRecord;
type Transacao = FinancialTransactionRecord & {
  forma_pagamento: FormaPagamento;
  tipo: TipoTransacao;
  status: StatusTransacao;
  data_pagamento?: string;
};

type PendingFinanceAction =
  | { kind: 'transaction'; id: number; label: string }
  | { kind: 'category'; id: number; label: string };

type TransactionFormState = {
  tipo: TipoTransacao;
  descricao: string;
  valor: string;
  data_vencimento: string;
  data_pagamento: string;
  id_categoria: string;
  forma_pagamento: FormaPagamento;
  status: Exclude<StatusTransacao, 'Cancelado'>;
  protocolo_venda: string;
  observacoes: string;
};

type CategoryFormState = {
  nome: string;
  tipo: TipoCategoria;
  cor: string;
};

const paymentOptions: FormaPagamento[] = [
  'PIX',
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Transferência',
];

const colorOptions = [
  { value: 'bg-green-500', label: 'Verde' },
  { value: 'bg-red-500', label: 'Vermelho' },
  { value: 'bg-yellow-500', label: 'Amarelo' },
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-violet-500', label: 'Violeta' },
  { value: 'bg-cyan-500', label: 'Ciano' },
  { value: 'bg-pink-500', label: 'Rosa' },
  { value: 'bg-orange-500', label: 'Laranja' },
  { value: 'bg-gray-500', label: 'Cinza' },
];

const emptyTransactionForm = (tipo: TipoTransacao): TransactionFormState => ({
  tipo,
  descricao: '',
  valor: '',
  data_vencimento: todayDate(),
  data_pagamento: '',
  id_categoria: '',
  forma_pagamento: 'PIX',
  status: 'Pendente',
  protocolo_venda: '',
  observacoes: '',
});

const emptyCategoryForm = (): CategoryFormState => ({
  nome: '',
  tipo: 'receita',
  cor: 'bg-green-500',
});

export default function Financeiro() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'extrato' | 'categorias'>('extrato');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDeletingAction, setIsDeletingAction] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingFinanceAction | null>(null);

  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  const [filterBusca, setFilterBusca] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | TipoTransacao>('Todos');
  const [filterStatus, setFilterStatus] = useState<'Todos' | StatusTransacao>('Todos');

  const [isModalTransacaoOpen, setIsModalTransacaoOpen] = useState(false);
  const [isModalCategoriaOpen, setIsModalCategoriaOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoriaFinanceira | null>(null);
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(emptyTransactionForm('receita'));
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [transacaoDetalheModal, setTransacaoDetalheModal] = useState<Transacao | null>(null);

  const carregarDados = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoadingData(true);
    }

    try {
      const [categoriesResponse, transactionsResponse] = await Promise.all([
        listFinancialCategories(),
        listFinancialTransactions(),
      ]);

      setCategorias(categoriesResponse);
      setTransacoes(transactionsResponse.map(mapTransaction));
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui carregar o financeiro',
        description: 'Os dados financeiros nao vieram da API agora.',
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    void carregarDados(true);
  }, [carregarDados]);

  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter((transacao) => {
        const matchBusca =
          transacao.descricao.toLowerCase().includes(filterBusca.toLowerCase()) ||
          transacao.protocolo_venda?.toLowerCase().includes(filterBusca.toLowerCase());
        const matchTipo = filterTipo === 'Todos' || transacao.tipo === filterTipo;
        const matchStatus = filterStatus === 'Todos' || transacao.status === filterStatus;

        return matchBusca && matchTipo && matchStatus;
      })
      .sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime());
  }, [filterBusca, filterStatus, filterTipo, transacoes]);

  const totalReceitas = transacoesFiltradas
    .filter((transacao) => transacao.tipo === 'receita' && transacao.status === 'Pago')
    .reduce((acc, transacao) => acc + transacao.valor, 0);

  const totalDespesas = transacoesFiltradas
    .filter((transacao) => transacao.tipo === 'despesa' && transacao.status === 'Pago')
    .reduce((acc, transacao) => acc + transacao.valor, 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  const totalPendenteReceber = transacoesFiltradas
    .filter((transacao) => transacao.tipo === 'receita' && transacao.status === 'Pendente')
    .reduce((acc, transacao) => acc + transacao.valor, 0);

  const totalPendentePagar = transacoesFiltradas
    .filter((transacao) => transacao.tipo === 'despesa' && transacao.status === 'Pendente')
    .reduce((acc, transacao) => acc + transacao.valor, 0);

  const handleNovaTransacaoClick = (tipo: TipoTransacao) => {
    setEditingTransaction(null);
    setTransactionForm(emptyTransactionForm(tipo));
    setIsModalTransacaoOpen(true);
  };

  const handleEditarTransacaoClick = (transacao: Transacao) => {
    setEditingTransaction(transacao);
    setTransactionForm({
      tipo: transacao.tipo,
      descricao: transacao.descricao,
      valor: String(transacao.valor),
      data_vencimento: transacao.data_vencimento,
      data_pagamento: transacao.data_pagamento ?? '',
      id_categoria: String(transacao.id_categoria),
      forma_pagamento: transacao.forma_pagamento,
      status: transacao.status === 'Cancelado' ? 'Pendente' : transacao.status,
      protocolo_venda: transacao.protocolo_venda ?? '',
      observacoes: transacao.observacoes ?? '',
    });
    setIsModalTransacaoOpen(true);
  };

  const handleNovaCategoriaClick = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm());
    setIsModalCategoriaOpen(true);
  };

  const handleEditarCategoriaClick = (categoria: CategoriaFinanceira) => {
    setEditingCategory(categoria);
    setCategoryForm({
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor,
    });
    setIsModalCategoriaOpen(true);
  };

  const handleSalvarTransacao = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!transactionForm.descricao.trim() || !transactionForm.valor || !transactionForm.data_vencimento) {
      showToast({
        tone: 'info',
        title: 'Faltam campos obrigatorios',
        description: 'Preencha descricao, valor e vencimento antes de salvar.',
      });
      return;
    }

    setIsSavingTransaction(true);

    const payload: FinancialTransactionPayload = {
      tipo: transactionForm.tipo,
      descricao: transactionForm.descricao,
      valor: Number(transactionForm.valor),
      data_vencimento: transactionForm.data_vencimento,
      data_pagamento: transactionForm.data_pagamento || null,
      id_categoria: transactionForm.id_categoria ? Number(transactionForm.id_categoria) : null,
      forma_pagamento: transactionForm.forma_pagamento,
      status: transactionForm.data_pagamento ? 'Pago' : transactionForm.status,
      protocolo_venda: transactionForm.protocolo_venda || null,
      observacoes: transactionForm.observacoes || null,
    };

    try {
      const savedTransaction = editingTransaction
        ? await updateFinancialTransaction(editingTransaction.id, payload)
        : await createFinancialTransaction(payload);

      const mapped = mapTransaction(savedTransaction);
      setTransacoes((prev) => {
        if (editingTransaction) {
          return prev.map((transacao) => (transacao.id === mapped.id ? mapped : transacao));
        }

        return [mapped, ...prev];
      });
      setTransacaoDetalheModal((prev) => (prev?.id === mapped.id ? mapped : prev));
      setIsModalTransacaoOpen(false);
      setEditingTransaction(null);
      showToast({
        tone: 'success',
        title: editingTransaction ? 'Lancamento atualizado' : 'Lancamento criado',
        description: 'O financeiro foi salvo na API de verdade.',
      });
    } catch (error) {
      console.error('Erro ao salvar lancamento financeiro:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar o lancamento',
        description: 'A API financeira nao confirmou essa mudanca agora.',
      });
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const handleSalvarCategoria = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryForm.nome.trim()) {
      showToast({
        tone: 'info',
        title: 'Nome obrigatorio',
        description: 'Preencha o nome da categoria antes de salvar.',
      });
      return;
    }

    setIsSavingCategory(true);

    const payload: FinancialCategoryPayload = {
      nome: categoryForm.nome,
      tipo: categoryForm.tipo,
      cor: categoryForm.cor,
    };

    try {
      const savedCategory = editingCategory
        ? await updateFinancialCategory(editingCategory.id, payload)
        : await createFinancialCategory(payload);

      setCategorias((prev) => {
        if (editingCategory) {
          return prev.map((categoria) => (categoria.id === savedCategory.id ? savedCategory : categoria));
        }

        return [savedCategory, ...prev];
      });
      setIsModalCategoriaOpen(false);
      setEditingCategory(null);
      showToast({
        tone: 'success',
        title: editingCategory ? 'Categoria atualizada' : 'Categoria criada',
        description: 'A categoria financeira foi salva com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar categoria financeira:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar a categoria',
        description: 'A API financeira nao confirmou essa mudanca agora.',
      });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDarBaixa = async (transacao: Transacao) => {
    try {
      const updated = await updateFinancialTransaction(transacao.id, {
        status: 'Pago',
        data_pagamento: todayDate(),
      });

      const mapped = mapTransaction(updated);
      setTransacoes((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setTransacaoDetalheModal(mapped);
      showToast({
        tone: 'success',
        title: 'Baixa confirmada',
        description: 'O lancamento foi marcado como pago na API.',
      });
    } catch (error) {
      console.error('Erro ao dar baixa no lancamento:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui dar baixa',
        description: 'A API financeira nao confirmou essa baixa agora.',
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    setIsDeletingAction(true);

    try {
      if (pendingAction.kind === 'transaction') {
        const response = await deleteFinancialTransaction(pendingAction.id);
        const updatedTransaction = mapTransaction(response.transaction);

        setTransacoes((prev) => prev.map((transaction) => (transaction.id === updatedTransaction.id ? updatedTransaction : transaction)));
        setTransacaoDetalheModal((prev) => (prev?.id === updatedTransaction.id ? updatedTransaction : prev));
        showToast({
          tone: 'success',
          title: 'Lancamento cancelado',
          description: `${pendingAction.label} continuou no historico como cancelado.`,
        });
      }

      if (pendingAction.kind === 'category') {
        await deleteFinancialCategory(pendingAction.id);
        setCategorias((prev) => prev.filter((category) => category.id !== pendingAction.id));
        showToast({
          tone: 'success',
          title: 'Categoria excluida',
          description: `${pendingAction.label} foi removida do cadastro financeiro.`,
        });
      }

      setPendingAction(null);
    } catch (error) {
      console.error('Erro ao executar acao financeira:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui concluir a acao',
        description: 'A API financeira nao confirmou essa operacao agora.',
      });
    } finally {
      setIsDeletingAction(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Gestão Financeira</h2>
          <p className="text-gray-400 text-sm">Agora criar, editar, dar baixa e categorias gravam na API real.</p>
        </div>
        <div className="flex items-center space-x-2">
          <ContextHelp title="Ajuda do financeiro">
            <p>Excluir lancamento cancela e preserva historico.</p>
            <p>Dar baixa agora muda o status para pago direto na API.</p>
          </ContextHelp>
          <button
            onClick={() => setActiveTab('extrato')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center ${activeTab === 'extrato' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
          >
            Fluxo de Caixa
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center ${activeTab === 'categorias' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
          >
            Categorias Base
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'extrato' && (
          <div className="absolute inset-0 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
              <StatCard
                title="Receitas Pagas"
                value={formatCurrency(totalReceitas)}
                helper={`+ ${formatCurrency(totalPendenteReceber)} pendentes`}
                tone="green"
              />
              <StatCard
                title="Despesas Pagas"
                value={formatCurrency(totalDespesas)}
                helper={`+ ${formatCurrency(totalPendentePagar)} pendentes`}
                tone="red"
              />
              <div className="bg-gradient-to-br from-[#1a1e23] to-[#23272d] rounded-2xl p-6 border border-[#00e6e6] shadow-[0_0_20px_rgba(0,230,230,0.1)] relative overflow-hidden">
                <h3 className="text-[#00e6e6] text-sm font-semibold uppercase tracking-widest mb-1 relative z-10">Saldo Líquido Período</h3>
                <p className={`text-4xl font-black relative z-10 ${saldoLiquido >= 0 ? 'text-[#00e6e6]' : 'text-red-500'}`}>
                  {formatCurrency(saldoLiquido)}
                </p>
                <div className="mt-3 flex space-x-2 relative z-10">
                  <button onClick={() => handleNovaTransacaoClick('receita')} className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1 rounded text-xs font-bold transition-colors">
                    + Nova Receita
                  </button>
                  <button onClick={() => handleNovaTransacaoClick('despesa')} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded text-xs font-bold transition-colors">
                    - Nova Despesa
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-[#23272d] rounded-2xl shadow-xl border border-gray-800 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a1e23]">
                <div className="relative w-full md:w-96">
                  <input
                    type="text"
                    placeholder="Buscar lançamento ou nº venda..."
                    value={filterBusca}
                    onChange={(event) => setFilterBusca(event.target.value)}
                    className="w-full bg-[#23272d] border border-gray-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-[#00e6e6]"
                  />
                </div>

                <div className="flex space-x-3 w-full md:w-auto">
                  <select
                    value={filterTipo}
                    onChange={(event) => setFilterTipo(event.target.value as 'Todos' | TipoTransacao)}
                    className="flex-1 md:w-auto bg-[#23272d] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                  >
                    <option value="Todos">Tipo: Todos</option>
                    <option value="receita">Apenas Receitas</option>
                    <option value="despesa">Apenas Despesas</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value as 'Todos' | StatusTransacao)}
                    className="flex-1 md:w-auto bg-[#23272d] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                  >
                    <option value="Todos">Status: Todos</option>
                    <option value="Pago">Status: Pagos</option>
                    <option value="Pendente">Status: Pendentes</option>
                    <option value="Cancelado">Status: Cancelados</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {isLoadingData ? (
                  <div className="py-10 text-center text-gray-500">Carregando lançamentos financeiros...</div>
                ) : (
                  <div className="space-y-3">
                    {transacoesFiltradas.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">Nenhum lançamento financeiro encontrado.</div>
                    ) : (
                      transacoesFiltradas.map((transacao) => {
                        const categoria = categorias.find((item) => item.id === transacao.id_categoria);
                        const isReceita = transacao.tipo === 'receita';
                        const isCancelado = transacao.status === 'Cancelado';

                        return (
                          <div
                            key={transacao.id}
                            onClick={() => setTransacaoDetalheModal(transacao)}
                            className={`bg-[#1a1e23] border border-gray-800 hover:border-gray-600 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer transition-colors group ${isCancelado ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-center space-x-4 w-full md:w-auto">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${isReceita ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
                                {isReceita ? '+' : '-'}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-white font-bold text-sm md:text-base leading-tight group-hover:text-[#00e6e6] transition-colors">
                                    {transacao.descricao}
                                  </span>
                                  {transacao.protocolo_venda && (
                                    <span className="bg-gray-800 text-gray-400 text-[9px] px-2 py-0.5 rounded font-mono">
                                      Ref: {transacao.protocolo_venda}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-xs">
                                  <span className="text-gray-400 font-mono">Venc: {transacao.data_vencimento}</span>
                                  <span className="text-gray-600">•</span>
                                  <div className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full mr-1 ${categoria?.cor || 'bg-gray-500'}`}></span>
                                    <span className="text-gray-400">{categoria?.nome || 'Sem Categoria'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-3 md:mt-0 pt-3 md:pt-0 border-t border-gray-800 md:border-t-0">
                              <span className={`text-xl font-bold ${isCancelado ? 'text-gray-500 line-through' : isReceita ? 'text-green-500' : 'text-red-500'}`}>
                                {isReceita ? '+' : '-'}
                                {formatCurrency(transacao.valor)}
                              </span>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">{transacao.forma_pagamento}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${transacao.status === 'Pago' ? 'border-green-500 text-green-500 bg-green-500/10' : transacao.status === 'Cancelado' ? 'border-gray-500 text-gray-500 bg-gray-500/10' : 'border-yellow-500 text-yellow-500 bg-yellow-500/10'}`}>
                                  {transacao.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categorias' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6 overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg">Categorias de Transação</h3>
              <button onClick={handleNovaCategoriaClick} className="bg-[#00e6e6] bg-opacity-20 text-[#00e6e6] hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-bold transition">
                + Nova Categoria
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categorias.map((categoria) => (
                <div key={categoria.id} className="bg-[#1a1e23] border border-gray-800 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${categoria.cor}`}></div>
                    <div>
                      <p className="text-white font-bold text-sm">{categoria.nome}</p>
                      <p className="text-[10px] uppercase text-gray-500 tracking-wider mt-0.5">{categoria.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleEditarCategoriaClick(categoria)} className="text-sky-300 hover:text-sky-200 text-xs font-bold">
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAction({ kind: 'category', id: categoria.id, label: categoria.nome })}
                      className="text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isModalTransacaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-3xl flex flex-col">
            <div className={`px-6 py-4 border-b border-gray-700 flex justify-between items-center rounded-t-2xl ${transactionForm.tipo === 'receita' ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
              <h3 className={`text-lg font-bold ${transactionForm.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                {editingTransaction ? 'Editar Lançamento' : transactionForm.tipo === 'receita' ? 'Registrar Nova Receita' : 'Registrar Nova Despesa'}
              </h3>
              <button onClick={() => setIsModalTransacaoOpen(false)} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form onSubmit={handleSalvarTransacao} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Tipo</label>
                  <select
                    value={transactionForm.tipo}
                    onChange={(event) => setTransactionForm((prev) => ({ ...prev, tipo: event.target.value as TipoTransacao, id_categoria: '' }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Descrição *</label>
                  <input
                    type="text"
                    value={transactionForm.descricao}
                    onChange={(event) => setTransactionForm((prev) => ({ ...prev, descricao: event.target.value }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldInput
                  label="Valor (R$) *"
                  type="number"
                  step="0.01"
                  value={transactionForm.valor}
                  onChange={(value) => setTransactionForm((prev) => ({ ...prev, valor: value }))}
                />
                <FieldInput
                  label="Vencimento *"
                  type="date"
                  value={transactionForm.data_vencimento}
                  onChange={(value) => setTransactionForm((prev) => ({ ...prev, data_vencimento: value }))}
                />
                <FieldInput
                  label="Data Pagamento"
                  type="date"
                  value={transactionForm.data_pagamento}
                  onChange={(value) => setTransactionForm((prev) => ({ ...prev, data_pagamento: value, status: value ? 'Pago' : prev.status }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria</label>
                  <select
                    value={transactionForm.id_categoria}
                    onChange={(event) => setTransactionForm((prev) => ({ ...prev, id_categoria: event.target.value }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  >
                    <option value="">Selecione...</option>
                    {categorias
                      .filter((categoria) => categoria.tipo === transactionForm.tipo || categoria.tipo === 'ambos')
                      .map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Forma de Pagamento</label>
                  <select
                    value={transactionForm.forma_pagamento}
                    onChange={(event) => setTransactionForm((prev) => ({ ...prev, forma_pagamento: event.target.value as FormaPagamento }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  >
                    {paymentOptions.map((payment) => (
                      <option key={payment} value={payment}>
                        {payment}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Status Inicial</label>
                  <select
                    value={transactionForm.data_pagamento ? 'Pago' : transactionForm.status}
                    onChange={(event) => setTransactionForm((prev) => ({ ...prev, status: event.target.value as Exclude<StatusTransacao, 'Cancelado'> }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  >
                    <option value="Pago">Pago / Recebido</option>
                    <option value="Pendente">Pendente / A Pagar</option>
                  </select>
                </div>
              </div>

              {transactionForm.tipo === 'receita' && (
                <FieldInput
                  label="Vincular a uma Venda (Opcional)"
                  value={transactionForm.protocolo_venda}
                  onChange={(value) => setTransactionForm((prev) => ({ ...prev, protocolo_venda: value }))}
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Observações</label>
                <textarea
                  rows={3}
                  value={transactionForm.observacoes}
                  onChange={(event) => setTransactionForm((prev) => ({ ...prev, observacoes: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>

              <div className="flex justify-end space-x-3 border-t border-gray-700 pt-4">
                <button type="button" onClick={() => setIsModalTransacaoOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 text-[#1a1e23] text-sm font-bold rounded-lg hover:bg-opacity-80 transition-colors ${transactionForm.tipo === 'receita' ? 'bg-green-500' : 'bg-red-500'} disabled:bg-gray-700 disabled:text-gray-500`}
                  disabled={isSavingTransaction}
                >
                  {isSavingTransaction ? 'Salvando...' : editingTransaction ? 'Salvar Alterações' : `Salvar ${transactionForm.tipo === 'receita' ? 'Receita' : 'Despesa'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalCategoriaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center rounded-t-2xl bg-[#1a1e23]">
              <h3 className="text-lg font-bold text-white">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button onClick={() => setIsModalCategoriaOpen(false)} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form onSubmit={handleSalvarCategoria} className="p-6 space-y-4">
              <FieldInput
                label="Nome *"
                value={categoryForm.nome}
                onChange={(value) => setCategoryForm((prev) => ({ ...prev, nome: value }))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Tipo</label>
                  <select
                    value={categoryForm.tipo}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, tipo: event.target.value as TipoCategoria }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Cor</label>
                  <select
                    value={categoryForm.cor}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, cor: event.target.value }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-[#1a1e23] p-4 flex items-center gap-3">
                <span className={`h-4 w-4 rounded-full ${categoryForm.cor}`}></span>
                <span className="text-sm text-gray-300">Prévia da cor da categoria</span>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
                <button type="button" onClick={() => setIsModalCategoriaOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-[#00e6e6] text-[#1a1e23] text-sm font-bold rounded-lg disabled:bg-gray-700 disabled:text-gray-500" disabled={isSavingCategory}>
                  {isSavingCategory ? 'Salvando...' : editingCategory ? 'Salvar Categoria' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transacaoDetalheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md flex flex-col">
            <div className={`h-24 rounded-t-2xl relative overflow-hidden flex items-center justify-center ${transacaoDetalheModal.tipo === 'receita' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <div className="text-center z-10">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{transacaoDetalheModal.tipo}</p>
                <h2 className={`text-4xl font-black ${transacaoDetalheModal.status === 'Cancelado' ? 'text-gray-500 line-through' : transacaoDetalheModal.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(transacaoDetalheModal.valor)}
                </h2>
              </div>
              <button onClick={() => setTransacaoDetalheModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/20 rounded-full p-1">
                x
              </button>
            </div>

            <div className="p-6 bg-[#1a1e23]">
              <h3 className="text-white font-bold text-lg mb-4 text-center">{transacaoDetalheModal.descricao}</h3>

              <div className="space-y-3 text-sm">
                <DetailRow label="Status" value={transacaoDetalheModal.status} highlight />
                <DetailRow label="Vencimento" value={transacaoDetalheModal.data_vencimento} />
                {transacaoDetalheModal.data_pagamento && <DetailRow label="Data de Pagamento" value={transacaoDetalheModal.data_pagamento} />}
                <DetailRow label="Forma de Pagamento" value={transacaoDetalheModal.forma_pagamento} />
                <DetailRow label="Categoria" value={categorias.find((categoria) => categoria.id === transacaoDetalheModal.id_categoria)?.nome || 'Sem categoria'} />
                {transacaoDetalheModal.protocolo_venda && <DetailRow label="Venda Vinculada" value={transacaoDetalheModal.protocolo_venda} />}
                {transacaoDetalheModal.observacoes && (
                  <div className="pt-2">
                    <span className="text-gray-500 block mb-1 text-xs">Observações:</span>
                    <p className="text-gray-300 italic bg-[#23272d] p-3 rounded-lg text-xs">{transacaoDetalheModal.observacoes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#23272d] rounded-b-2xl border-t border-gray-700 flex flex-wrap justify-between gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleEditarTransacaoClick(transacaoDetalheModal)}
                  className="text-sky-300 hover:text-sky-200 text-sm font-bold"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPendingAction({
                      kind: 'transaction',
                      id: transacaoDetalheModal.id,
                      label: transacaoDetalheModal.descricao,
                    })
                  }
                  className="text-red-500 hover:text-red-400 text-sm font-bold flex items-center transition-colors"
                >
                  Excluir
                </button>
              </div>

              {transacaoDetalheModal.status === 'Pendente' && (
                <button
                  onClick={() => void handleDarBaixa(transacaoDetalheModal)}
                  className="bg-green-500 text-[#1a1e23] px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:bg-opacity-90 transition-all"
                >
                  Dar Baixa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={pendingAction !== null}
        title={pendingAction?.kind === 'transaction' ? 'Cancelar lançamento?' : 'Excluir categoria?'}
        description={
          pendingAction?.kind === 'transaction'
            ? `O lançamento ${pendingAction.label} não será apagado da história. Ele vai virar Cancelado.`
            : `A categoria ${pendingAction?.label ?? ''} será apagada de verdade do cadastro.`
        }
        confirmLabel={pendingAction?.kind === 'transaction' ? 'Cancelar lançamento' : 'Excluir categoria'}
        tone={pendingAction?.kind === 'transaction' ? 'warning' : 'danger'}
        isSubmitting={isDeletingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  tone: 'green' | 'red';
}) {
  return (
    <div className="bg-[#23272d] rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden">
      <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-1 relative z-10">{title}</h3>
      <p className="text-3xl font-black text-white relative z-10">{value}</p>
      <p className={`text-xs mt-2 relative z-10 ${tone === 'green' ? 'text-yellow-500' : 'text-yellow-500'}`}>{helper}</p>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
      />
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-gray-800 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? 'text-white font-bold' : 'text-white'}>{value}</span>
    </div>
  );
}

function todayDate() {
  return new Date().toISOString().split('T')[0];
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function mapTransaction(transaction: FinancialTransactionRecord): Transacao {
  return {
    ...transaction,
    tipo: transaction.tipo as TipoTransacao,
    status: transaction.status as StatusTransacao,
    forma_pagamento: transaction.forma_pagamento as FormaPagamento,
    data_pagamento: transaction.data_pagamento ?? undefined,
  };
}
