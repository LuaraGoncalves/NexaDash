import { useState } from 'react';

// =======================
// TIPAGENS / TYPES
// =======================
type TipoTransacao = 'receita' | 'despesa';
type StatusTransacao = 'Pago' | 'Pendente' | 'Cancelado';
type FormaPagamento = 'PIX' | 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Boleto' | 'Transferência';

type CategoriaFinanceira = {
  id: number;
  nome: string;
  tipo: 'receita' | 'despesa' | 'ambos';
  cor: string;
};

type Transacao = {
  id: number;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  id_categoria: number;
  forma_pagamento: FormaPagamento;
  status: StatusTransacao;
  protocolo_venda?: string; // Vínculo com módulo de vendas
  observacoes?: string;
};

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<'extrato' | 'categorias'>('extrato');

  // =======================
  // MOCKS / DADOS FALSOS
  // =======================
  const [categorias] = useState<CategoriaFinanceira[]>([
    { id: 1, nome: "Vendas (PDV)", tipo: "receita", cor: "bg-green-500" },
    { id: 2, nome: "Serviços/Consultoria", tipo: "receita", cor: "bg-blue-500" },
    { id: 3, nome: "Fornecedores", tipo: "despesa", cor: "bg-orange-500" },
    { id: 4, nome: "Folha de Pagamento", tipo: "despesa", cor: "bg-red-500" },
    { id: 5, nome: "Aluguel/Infraestrutura", tipo: "despesa", cor: "bg-yellow-500" },
    { id: 6, nome: "Impostos", tipo: "despesa", cor: "bg-purple-500" },
    { id: 7, nome: "Marketing/Ads", tipo: "despesa", cor: "bg-pink-500" }
  ]);

  const [transacoes, setTransacoes] = useState<Transacao[]>([
    {
      id: 1001,
      tipo: 'receita',
      descricao: 'Venda de Smartphone + Acessórios',
      valor: 2545.00,
      data_vencimento: '2026-03-01',
      data_pagamento: '2026-03-01',
      id_categoria: 1,
      forma_pagamento: 'PIX',
      status: 'Pago',
      protocolo_venda: 'VND-20260301-001'
    },
    {
      id: 1002,
      tipo: 'despesa',
      descricao: 'Pagamento de Aluguel (Escritório)',
      valor: 1500.00,
      data_vencimento: '2026-03-05',
      id_categoria: 5,
      forma_pagamento: 'Boleto',
      status: 'Pendente',
      observacoes: 'Boleto no app do banco Itaú'
    },
    {
      id: 1003,
      tipo: 'receita',
      descricao: 'Aplicação de Películas x2',
      valor: 60.00,
      data_vencimento: '2026-03-02',
      data_pagamento: '2026-03-02',
      id_categoria: 1,
      forma_pagamento: 'Cartão de Débito',
      status: 'Pago',
      protocolo_venda: 'VND-20260302-002'
    },
    {
      id: 1004,
      tipo: 'despesa',
      descricao: 'Compra Lote Capas Tech Distribuidora',
      valor: 850.00,
      data_vencimento: '2026-03-02',
      data_pagamento: '2026-03-02',
      id_categoria: 3,
      forma_pagamento: 'Transferência',
      status: 'Pago'
    },
    {
      id: 1005,
      tipo: 'receita',
      descricao: 'Venda Faturada Empresa XPTO (Cabos)',
      valor: 1200.00,
      data_vencimento: '2026-03-10',
      id_categoria: 1,
      forma_pagamento: 'Boleto',
      status: 'Pendente',
      protocolo_venda: 'VND-20260303-003'
    }
  ]);

  // =======================
  // ESTADOS E FILTROS DO EXTRATO
  // =======================
  const [filterBusca, setFilterBusca] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'receita' | 'despesa'>('Todos');
  const [filterStatus, setFilterStatus] = useState<'Todos' | StatusTransacao>('Todos');

  const [isModalTransacaoOpen, setIsModalTransacaoOpen] = useState(false);
  const [tipoNovaTransacao, setTipoNovaTransacao] = useState<TipoTransacao>('receita');
  
  const [transacaoDetalheModal, setTransacaoDetalheModal] = useState<Transacao | null>(null);

  // Lógica de Filtragem
  const transacoesFiltradas = transacoes.filter(t => {
    const matchBusca = t.descricao.toLowerCase().includes(filterBusca.toLowerCase()) || 
                       (t.protocolo_venda?.toLowerCase().includes(filterBusca.toLowerCase()));
    const matchTipo = filterTipo === 'Todos' || t.tipo === filterTipo;
    const matchStatus = filterStatus === 'Todos' || t.status === filterStatus;
    
    return matchBusca && matchTipo && matchStatus;
  }).sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime());

  // Lógica de Totais (Dashboard)
  const totalReceitas = transacoesFiltradas.filter(t => t.tipo === 'receita' && t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0);
  const totalDespesas = transacoesFiltradas.filter(t => t.tipo === 'despesa' && t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0);
  const saldoLiquido = totalReceitas - totalDespesas;
  
  const totalPendenteReceber = transacoesFiltradas.filter(t => t.tipo === 'receita' && t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);
  const totalPendentePagar = transacoesFiltradas.filter(t => t.tipo === 'despesa' && t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);

  // =======================
  // HELPERS
  // =======================
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const getCategoria = (id: number) => categorias.find(c => c.id === id);

  const handleNovaTransacaoClick = (tipo: TipoTransacao) => {
    setTipoNovaTransacao(tipo);
    setIsModalTransacaoOpen(true);
  };

  const handleDarBaixa = (idTransacao: number) => {
    setTransacoes(prev => prev.map(t => 
      t.id === idTransacao ? { ...t, status: 'Pago', data_pagamento: new Date().toISOString().split('T')[0] } : t
    ));
    setTransacaoDetalheModal(prev => prev ? { ...prev, status: 'Pago', data_pagamento: new Date().toISOString().split('T')[0] } : null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Top Header & Tabs */}
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Gestão Financeira</h2>
          <p className="text-gray-400 text-sm">Controle de fluxo de caixa, receitas, despesas e relatórios.</p>
        </div>
        <div className="flex space-x-2">
           <button 
             onClick={() => setActiveTab('extrato')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center ${activeTab === 'extrato' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
           >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             Fluxo de Caixa
           </button>
           <button 
             onClick={() => setActiveTab('categorias')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center ${activeTab === 'categorias' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
           >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
             Categorias Base
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">

        {/* ========================================================= */}
        {/* ABA 1: FLUXO DE CAIXA E DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'extrato' && (
          <div className="absolute inset-0 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
             
             {/* DASHBOARD CARDS */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                {/* Entradas */}
                <div className="bg-[#23272d] rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-green-500 opacity-10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-32 h-32"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-1 relative z-10">Receitas Pagas</h3>
                  <p className="text-3xl font-black text-white relative z-10">{formatCurrency(totalReceitas)}</p>
                  <p className="text-xs text-yellow-500 mt-2 relative z-10">+ {formatCurrency(totalPendenteReceber)} pendentes</p>
                </div>

                {/* Saídas */}
                <div className="bg-[#23272d] rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-red-500 opacity-10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-32 h-32"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </div>
                  <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-1 relative z-10">Despesas Pagas</h3>
                  <p className="text-3xl font-black text-white relative z-10">{formatCurrency(totalDespesas)}</p>
                  <p className="text-xs text-yellow-500 mt-2 relative z-10">+ {formatCurrency(totalPendentePagar)} pendentes</p>
                </div>

                {/* Saldo */}
                <div className="bg-gradient-to-br from-[#1a1e23] to-[#23272d] rounded-2xl p-6 border border-[#00e6e6] shadow-[0_0_20px_rgba(0,230,230,0.1)] relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-[#00e6e6] opacity-10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-32 h-32"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h3 className="text-[#00e6e6] text-sm font-semibold uppercase tracking-widest mb-1 relative z-10">Saldo Líquido Período</h3>
                  <p className={`text-4xl font-black relative z-10 ${saldoLiquido >= 0 ? 'text-[#00e6e6]' : 'text-red-500'}`}>
                    {formatCurrency(saldoLiquido)}
                  </p>
                  <div className="mt-2 flex space-x-2 relative z-10">
                     <button onClick={() => handleNovaTransacaoClick('receita')} className="bg-green-500 bg-opacity-20 text-green-500 hover:bg-opacity-30 px-3 py-1 rounded text-xs font-bold transition-colors">+ Nova Receita</button>
                     <button onClick={() => handleNovaTransacaoClick('despesa')} className="bg-red-500 bg-opacity-20 text-red-500 hover:bg-opacity-30 px-3 py-1 rounded text-xs font-bold transition-colors">- Nova Despesa</button>
                  </div>
                </div>
             </div>

             {/* LISTA / TABELA DE EXTRATO */}
             <div className="flex-1 bg-[#23272d] rounded-2xl shadow-xl border border-gray-800 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a1e23]">
                   
                   <div className="relative w-full md:w-96">
                     <input 
                       type="text" 
                       placeholder="Buscar lançamento ou nº venda..." 
                       value={filterBusca}
                       onChange={(e) => setFilterBusca(e.target.value)}
                       className="w-full bg-[#23272d] border border-gray-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-[#00e6e6]" 
                     />
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                   </div>
                   
                   <div className="flex space-x-3 w-full md:w-auto">
                     <select 
                       value={filterTipo}
                       onChange={(e) => setFilterTipo(e.target.value as any)}
                       className="flex-1 md:w-auto bg-[#23272d] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                     >
                       <option value="Todos">Tipo: Todos</option>
                       <option value="receita">Apenas Receitas</option>
                       <option value="despesa">Apenas Despesas</option>
                     </select>

                     <select 
                       value={filterStatus}
                       onChange={(e) => setFilterStatus(e.target.value as any)}
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
                   <div className="space-y-3">
                     {transacoesFiltradas.length === 0 ? (
                       <div className="text-center py-10 text-gray-500">Nenhum lançamento financeiro encontrado.</div>
                     ) : transacoesFiltradas.map(transacao => {
                       const categoria = getCategoria(transacao.id_categoria);
                       const isReceita = transacao.tipo === 'receita';
                       const isPago = transacao.status === 'Pago';
                       const isCancelado = transacao.status === 'Cancelado';

                       return (
                         <div 
                           key={transacao.id} 
                           onClick={() => setTransacaoDetalheModal(transacao)}
                           className={`bg-[#1a1e23] border border-gray-800 hover:border-gray-600 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer transition-colors group ${isCancelado ? 'opacity-50' : ''}`}
                         >
                           <div className="flex items-center space-x-4 w-full md:w-auto">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${isReceita ? 'border-green-500 text-green-500 bg-green-500 bg-opacity-10' : 'border-red-500 text-red-500 bg-red-500 bg-opacity-10'}`}>
                                {isReceita ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-white font-bold text-sm md:text-base leading-tight group-hover:text-[#00e6e6] transition-colors">{transacao.descricao}</span>
                                  {transacao.protocolo_venda && <span className="bg-gray-800 text-gray-400 text-[9px] px-2 py-0.5 rounded font-mono">Ref: {transacao.protocolo_venda}</span>}
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
                                {isReceita ? '+' : '-'}{formatCurrency(transacao.valor)}
                              </span>
                              <div className="flex items-center space-x-2 mt-1">
                                 <span className="text-xs text-gray-500">{transacao.forma_pagamento}</span>
                                 <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${isPago ? 'border-green-500 text-green-500 bg-green-500 bg-opacity-10' : isCancelado ? 'border-gray-500 text-gray-500 bg-gray-500 bg-opacity-10' : 'border-yellow-500 text-yellow-500 bg-yellow-500 bg-opacity-10'}`}>
                                    {transacao.status}
                                 </span>
                              </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ABA 2: CATEGORIAS E CONFIGURAÇÕES */}
        {activeTab === 'categorias' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6 overflow-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">Categorias de Transação</h3>
                <button className="bg-[#00e6e6] bg-opacity-20 text-[#00e6e6] hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-bold transition">
                   + Nova Categoria
                </button>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categorias.map(cat => (
                   <div key={cat.id} className="bg-[#1a1e23] border border-gray-800 p-4 rounded-xl flex items-center justify-between group">
                      <div className="flex items-center">
                         <div className={`w-3 h-3 rounded-full mr-3 ${cat.cor}`}></div>
                         <div>
                            <p className="text-white font-bold text-sm">{cat.nome}</p>
                            <p className="text-[10px] uppercase text-gray-500 tracking-wider mt-0.5">{cat.tipo}</p>
                         </div>
                      </div>
                      <button className="text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">Editar</button>
                   </div>
                ))}
             </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL: CADASTRAR NOVA TRANSACAO */}
      {/* ========================================================= */}
      {isModalTransacaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl flex flex-col">
            <div className={`px-6 py-4 border-b border-gray-700 flex justify-between items-center rounded-t-2xl ${tipoNovaTransacao === 'receita' ? 'bg-green-900 bg-opacity-20' : 'bg-red-900 bg-opacity-20'}`}>
              <h3 className={`text-lg font-bold flex items-center ${tipoNovaTransacao === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                 {tipoNovaTransacao === 'receita' ? 'Registrar Nova Receita' : 'Registrar Nova Despesa'}
              </h3>
              <button onClick={() => setIsModalTransacaoOpen(false)} className="text-gray-400 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
               <form className="space-y-4">
                 
                 {/* Valor e Descrição */}
                 <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Valor (R$) *</label>
                      <input type="number" step="0.01" placeholder="0.00" className={`w-full bg-[#1a1e23] border border-gray-700 text-2xl font-black rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6] ${tipoNovaTransacao === 'receita' ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Descrição / Título *</label>
                      <input type="text" placeholder="Ex: Pagamento Fornecedor X" className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-[#00e6e6]" />
                    </div>
                 </div>

                 {/* Categoria e Datas */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria *</label>
                      <select className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6] appearance-none">
                        <option value="">Selecione...</option>
                        {categorias.filter(c => c.tipo === tipoNovaTransacao || c.tipo === 'ambos').map(c => (
                           <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Vencimento *</label>
                      <input type="date" className="w-full bg-[#1a1e23] border border-gray-700 text-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Data Pagamento</label>
                      <input type="date" className="w-full bg-[#1a1e23] border border-gray-700 text-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]" />
                      <span className="text-[9px] text-gray-500 mt-1 block">Deixe vazio se for pendente</span>
                    </div>
                 </div>

                 {/* Pagamento e Status */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Forma de Pagamento</label>
                      <select className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6] appearance-none">
                        <option>PIX</option>
                        <option>Dinheiro</option>
                        <option>Cartão de Crédito</option>
                        <option>Cartão de Débito</option>
                        <option>Boleto</option>
                        <option>Transferência</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Status Inicial</label>
                      <select className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6] appearance-none">
                        <option value="Pago">Pago / Recebido</option>
                        <option value="Pendente">Pendente / A Pagar</option>
                      </select>
                    </div>
                 </div>

                 {/* Vínculo Opcional */}
                 {tipoNovaTransacao === 'receita' && (
                    <div className="p-4 bg-[#1a1e23] border border-gray-800 rounded-xl mt-2">
                       <label className="block text-xs font-semibold text-gray-400 mb-1">Vincular a uma Venda (Opcional)</label>
                       <input type="text" placeholder="Ex: VND-20260301-001" className="w-full bg-[#23272d] border border-gray-700 text-white rounded-lg px-4 py-2 font-mono text-sm outline-none focus:border-[#00e6e6]" />
                    </div>
                 )}

               </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-end space-x-3 rounded-b-2xl">
               <button onClick={() => setIsModalTransacaoOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
               <button className={`px-6 py-2 text-[#1a1e23] text-sm font-bold rounded-lg hover:bg-opacity-80 transition-colors ${tipoNovaTransacao === 'receita' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                 Salvar {tipoNovaTransacao === 'receita' ? 'Receita' : 'Despesa'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETALHES DO LANÇAMENTO E AÇÕES */}
      {/* ========================================================= */}
      {transacaoDetalheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md flex flex-col">
            
            <div className={`h-24 rounded-t-2xl relative overflow-hidden flex items-center justify-center ${transacaoDetalheModal.tipo === 'receita' ? 'bg-green-900 bg-opacity-30' : 'bg-red-900 bg-opacity-30'}`}>
               <div className={`absolute -right-10 -bottom-10 opacity-20 ${transacaoDetalheModal.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                 {transacaoDetalheModal.tipo === 'receita' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-48 h-48"><polyline points="20 6 9 17 4 12"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-48 h-48"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
               </div>
               <div className="text-center z-10">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{transacaoDetalheModal.tipo}</p>
                  <h2 className={`text-4xl font-black ${transacaoDetalheModal.status === 'Cancelado' ? 'text-gray-500 line-through' : transacaoDetalheModal.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                     {formatCurrency(transacaoDetalheModal.valor)}
                  </h2>
               </div>
               <button onClick={() => setTransacaoDetalheModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black bg-opacity-20 rounded-full p-1">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
            </div>

            <div className="p-6 bg-[#1a1e23]">
               <h3 className="text-white font-bold text-lg mb-4 text-center">{transacaoDetalheModal.descricao}</h3>
               
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-bold ${transacaoDetalheModal.status === 'Pago' ? 'text-green-500' : transacaoDetalheModal.status === 'Pendente' ? 'text-yellow-500' : 'text-gray-500'}`}>{transacaoDetalheModal.status}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-500">Vencimento</span>
                    <span className="text-white">{transacaoDetalheModal.data_vencimento}</span>
                 </div>
                 {transacaoDetalheModal.data_pagamento && (
                   <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-500">Data de Pagamento</span>
                      <span className="text-white">{transacaoDetalheModal.data_pagamento}</span>
                   </div>
                 )}
                 <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-500">Forma de Pagamento</span>
                    <span className="text-white">{transacaoDetalheModal.forma_pagamento}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-500">Categoria</span>
                    <div className="flex items-center">
                       <span className={`w-2 h-2 rounded-full mr-2 ${getCategoria(transacaoDetalheModal.id_categoria)?.cor || 'bg-gray-500'}`}></span>
                       <span className="text-white">{getCategoria(transacaoDetalheModal.id_categoria)?.nome}</span>
                    </div>
                 </div>
                 {transacaoDetalheModal.protocolo_venda && (
                   <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-500">Venda Vinculada</span>
                      <span className="text-[#00e6e6] font-mono underline cursor-pointer">{transacaoDetalheModal.protocolo_venda}</span>
                   </div>
                 )}
                 {transacaoDetalheModal.observacoes && (
                   <div className="pt-2">
                      <span className="text-gray-500 block mb-1 text-xs">Observações:</span>
                      <p className="text-gray-300 italic bg-[#23272d] p-3 rounded-lg text-xs">{transacaoDetalheModal.observacoes}</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="p-4 bg-[#23272d] rounded-b-2xl border-t border-gray-700 flex justify-between">
               <button className="text-red-500 hover:text-red-400 text-sm font-bold flex items-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mr-1"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Excluir
               </button>
               
               {transacaoDetalheModal.status === 'Pendente' && (
                 <button 
                   onClick={() => handleDarBaixa(transacaoDetalheModal.id)}
                   className="bg-green-500 text-[#1a1e23] px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:bg-opacity-90 transition-all"
                 >
                   Dar Baixa (Pagar)
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
