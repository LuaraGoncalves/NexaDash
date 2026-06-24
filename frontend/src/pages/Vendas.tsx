import { useState } from 'react';

// =======================
// TIPAGENS / TYPES
// =======================
type Cliente = {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
};

type ProdutoVenda = {
  id: number;
  sku: string;
  nome: string;
  preco_venda: number;
  quantidade_estoque: number;
  foto_url?: string;
};

type ItemVenda = {
  id_produto: number;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
};

type FormaPagamento = 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Boleto' | 'Múltiplo';
type StatusVenda = 'Concluída' | 'Aberta' | 'Cancelada';

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

export default function Vendas() {
  const [activeTab, setActiveTab] = useState<'nova_venda' | 'historico'>('nova_venda');

  // =======================
  // MOCKS / DADOS FALSOS
  // =======================
  const clientesMock: Cliente[] = [
    { id: 1, nome: "Consumidor Final" },
    { id: 2, nome: "Maria Silva (Lead)", telefone: "(11) 98888-7777" },
    { id: 3, nome: "João Pedro (Lead)", telefone: "(21) 97777-6666" },
    { id: 4, nome: "Empresa XPTO Ltda", email: "compras@xpto.com.br" }
  ];

  const produtosMock: ProdutoVenda[] = [
    { id: 1, sku: "EL-001", nome: "Smartphone Alpha X", preco_venda: 2500.00, quantidade_estoque: 15 },
    { id: 2, sku: "AC-102", nome: "Cabo USB-C Turbo", preco_venda: 45.00, quantidade_estoque: 50 },
    { id: 3, sku: "AC-103", nome: "Carregador 20W Fast", preco_venda: 120.00, quantidade_estoque: 10 },
    { id: 4, sku: "SV-001", nome: "Película de Vidro (Aplicação)", preco_venda: 30.00, quantidade_estoque: 999 }
  ];

  const [vendas, setVendas] = useState<Venda[]>([
    {
      id: 1,
      protocolo: "VND-20260301-001",
      id_cliente: 2,
      cliente_nome: "Maria Silva (Lead)",
      data_hora: "2026-03-01 10:30",
      total: 2545.00,
      forma_pagamento: "PIX",
      status: "Concluída",
      itens: [
        { id_produto: 1, nome: "Smartphone Alpha X", preco_unitario: 2500.00, quantidade: 1, subtotal: 2500.00 },
        { id_produto: 2, nome: "Cabo USB-C Turbo", preco_unitario: 45.00, quantidade: 1, subtotal: 45.00 }
      ]
    },
    {
      id: 2,
      protocolo: "VND-20260302-002",
      id_cliente: 1,
      cliente_nome: "Consumidor Final",
      data_hora: "2026-03-02 14:15",
      total: 60.00,
      forma_pagamento: "Cartão de Débito",
      status: "Concluída",
      itens: [
        { id_produto: 4, nome: "Película de Vidro (Aplicação)", preco_unitario: 30.00, quantidade: 2, subtotal: 60.00 }
      ]
    },
    {
      id: 3,
      protocolo: "VND-20260303-003",
      id_cliente: 4,
      cliente_nome: "Empresa XPTO Ltda",
      data_hora: "2026-03-03 09:00",
      total: 1200.00,
      forma_pagamento: "Boleto",
      status: "Aberta", // Faturado, aguardando pagamento
      itens: [
        { id_produto: 3, nome: "Carregador 20W Fast", preco_unitario: 120.00, quantidade: 10, subtotal: 1200.00 }
      ]
    }
  ]);

  // =======================
  // ESTADOS DA NOVA VENDA (PDV)
  // =======================
  const [selectedClienteId, setSelectedClienteId] = useState<number>(1);
  const [searchTermPDV, setSearchTermPDV] = useState('');
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState<FormaPagamento>('PIX');

  // Cálculos do Carrinho
  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItensCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  const adicionarAoCarrinho = (produto: ProdutoVenda) => {
    setCarrinho(prev => {
      const existe = prev.find(i => i.id_produto === produto.id);
      if (existe) {
        return prev.map(i => 
          i.id_produto === produto.id 
          ? { ...i, quantidade: i.quantidade + 1, subtotal: (i.quantidade + 1) * i.preco_unitario } 
          : i
        );
      }
      return [...prev, {
        id_produto: produto.id,
        nome: produto.nome,
        preco_unitario: produto.preco_venda,
        quantidade: 1,
        subtotal: produto.preco_venda
      }];
    });
    setSearchTermPDV(''); // Limpa busca após adicionar
  };

  const alterarQuantidade = (id_produto: number, delta: number) => {
    setCarrinho(prev => prev.map(i => {
      if (i.id_produto === id_produto) {
        const novaQtd = Math.max(1, i.quantidade + delta);
        return { ...i, quantidade: novaQtd, subtotal: novaQtd * i.preco_unitario };
      }
      return i;
    }));
  };

  const removerDoCarrinho = (id_produto: number) => {
    setCarrinho(prev => prev.filter(i => i.id_produto !== id_produto));
  };

  const finalizarVenda = () => {
    if (carrinho.length === 0) return alert("Adicione produtos ao carrinho antes de finalizar!");

    const cliente = clientesMock.find(c => c.id === selectedClienteId);
    
    const novaVenda: Venda = {
      id: Date.now(),
      protocolo: `VND-20260303-${Math.floor(Math.random() * 1000)}`,
      id_cliente: selectedClienteId,
      cliente_nome: cliente?.nome || "Consumidor Final",
      data_hora: new Date().toISOString().replace('T', ' ').slice(0, 16),
      total: totalCarrinho,
      forma_pagamento: formaPagamentoSelecionada,
      status: 'Concluída',
      itens: [...carrinho]
    };

    setVendas([novaVenda, ...vendas]);
    
    // Limpar PDV
    setCarrinho([]);
    setSelectedClienteId(1);
    alert("Venda registrada com sucesso!");
    setActiveTab('historico');
  };

  // =======================
  // ESTADOS DO HISTÓRICO
  // =======================
  const [historicoSearch, setHistoricoSearch] = useState('');
  const [historicoStatus, setHistoricoStatus] = useState<StatusVenda | 'Todas'>('Todas');
  const [vendaDetalhesModal, setVendaDetalhesModal] = useState<Venda | null>(null);

  const vendasFiltradas = vendas.filter(v => {
    const matchBusca = v.cliente_nome.toLowerCase().includes(historicoSearch.toLowerCase()) || v.protocolo.toLowerCase().includes(historicoSearch.toLowerCase());
    const matchStatus = historicoStatus === 'Todas' || v.status === historicoStatus;
    return matchBusca && matchStatus;
  });

  // Totais do Relatório Simples
  const totalFaturadoPeriodo = vendasFiltradas.filter(v => v.status === 'Concluída').reduce((acc, v) => acc + v.total, 0);
  const qtdVendasConcluidas = vendasFiltradas.filter(v => v.status === 'Concluída').length;

  // =======================
  // HELPERS
  // =======================
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Top Header & Tabs */}
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Ponto de Venda (PDV)</h2>
          <p className="text-gray-400 text-sm">Registre vendas, acompanhe o faturamento e gerencie os recebimentos.</p>
        </div>
        <div className="flex space-x-2">
           <button 
             onClick={() => setActiveTab('nova_venda')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center ${activeTab === 'nova_venda' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
           >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
             Nova Venda
           </button>
           <button 
             onClick={() => setActiveTab('historico')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center ${activeTab === 'historico' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
           >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
             Histórico de Vendas
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">

        {/* ========================================================= */}
        {/* ABA 1: NOVA VENDA (PDV) */}
        {/* ========================================================= */}
        {activeTab === 'nova_venda' && (
          <div className="absolute inset-0 flex flex-col md:flex-row gap-6">
             
             {/* Esquerda: Busca de Produtos e Informações da Venda */}
             <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                
                {/* Seleção de Cliente */}
                <div className="bg-[#23272d] rounded-2xl shadow-xl border border-gray-800 p-6 shrink-0">
                   <h3 className="text-white font-bold mb-4 flex items-center">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-[#00e6e6]"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                     1. Identificação do Cliente
                   </h3>
                   <select 
                      value={selectedClienteId}
                      onChange={(e) => setSelectedClienteId(Number(e.target.value))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-[#00e6e6] appearance-none"
                    >
                      {clientesMock.map(c => <option key={c.id} value={c.id}>{c.nome} {c.telefone ? `- ${c.telefone}` : ''}</option>)}
                   </select>
                </div>

                {/* Busca e Lista Rápida de Produtos */}
                <div className="bg-[#23272d] rounded-2xl shadow-xl border border-gray-800 p-6 flex-1 flex flex-col overflow-hidden">
                   <h3 className="text-white font-bold mb-4 flex items-center">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-[#00e6e6]"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                     2. Adicionar Produtos
                   </h3>
                   
                   <div className="relative mb-4 shrink-0">
                     <input 
                        type="text" 
                        placeholder="Pesquisar por nome ou código de barras..." 
                        value={searchTermPDV}
                        onChange={(e) => setSearchTermPDV(e.target.value)}
                        className="w-full bg-[#1a1e23] border border-[#00e6e6] text-white rounded-xl px-12 py-4 outline-none focus:ring-2 focus:ring-[#00e6e6] focus:ring-opacity-50 text-lg shadow-[0_0_15px_rgba(0,230,230,0.1)] transition-all"
                     />
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                   </div>

                   {/* Grade de Produtos Pesquisados */}
                   <div className="flex-1 overflow-y-auto pr-2">
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {produtosMock.filter(p => p.nome.toLowerCase().includes(searchTermPDV.toLowerCase()) || p.sku.toLowerCase().includes(searchTermPDV.toLowerCase())).map(produto => (
                           <div 
                             key={produto.id} 
                             onClick={() => adicionarAoCarrinho(produto)}
                             className="bg-[#1a1e23] border border-gray-700 hover:border-[#00e6e6] rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between group"
                           >
                              <div>
                                <p className="text-white font-bold text-sm group-hover:text-[#00e6e6] transition-colors">{produto.nome}</p>
                                <p className="text-gray-500 text-xs mt-1 font-mono">Cód: {produto.sku} • Estq: {produto.quantidade_estoque}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold">{formatCurrency(produto.preco_venda)}</p>
                                <span className="bg-[#00e6e6] bg-opacity-10 text-[#00e6e6] text-[10px] px-2 py-1 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity">Adicionar</span>
                              </div>
                           </div>
                        ))}
                     </div>
                   </div>
                </div>

             </div>

             {/* Direita: Carrinho / Cupom Fiscal */}
             <div className="w-full md:w-[450px] bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden shrink-0">
                <div className="bg-[#1a1e23] p-6 border-b border-gray-700">
                   <h3 className="text-white font-bold text-lg text-center tracking-wider">RESUMO DA VENDA</h3>
                   <p className="text-gray-500 text-xs text-center mt-1">Nº {Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                </div>

                {/* Itens do Carrinho */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                   {carrinho.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-16 h-16 mb-4"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                        <p>O carrinho está vazio</p>
                     </div>
                   ) : (
                     carrinho.map((item, index) => (
                       <div key={item.id_produto} className="bg-[#1a1e23] rounded-lg p-3 border border-gray-700 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-gray-500 font-mono w-6">{String(index + 1).padStart(2, '0')}</span>
                            <span className="text-sm text-white font-bold flex-1 leading-tight">{item.nome}</span>
                            <button onClick={() => removerDoCarrinho(item.id_produto)} className="text-gray-500 hover:text-red-500 transition-colors ml-2">
                               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                          <div className="flex justify-between items-center pl-6">
                             <div className="flex items-center space-x-2 bg-[#23272d] rounded px-1 py-0.5 border border-gray-700">
                                <button onClick={() => alterarQuantidade(item.id_produto, -1)} className="text-gray-400 hover:text-white px-1 font-bold">-</button>
                                <span className="text-white text-xs font-bold w-4 text-center">{item.quantidade}</span>
                                <button onClick={() => alterarQuantidade(item.id_produto, 1)} className="text-[#00e6e6] hover:text-white px-1 font-bold">+</button>
                             </div>
                             <div className="text-right">
                                <span className="text-xs text-gray-500 block">{formatCurrency(item.preco_unitario)} un</span>
                                <span className="text-sm text-[#00e6e6] font-bold block">{formatCurrency(item.subtotal)}</span>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </div>

                {/* Pagamento e Totais */}
                <div className="bg-[#1a1e23] border-t border-gray-700 p-6 flex flex-col gap-4">
                   
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400">Total de Itens:</span>
                     <span className="text-white font-bold">{totalItensCarrinho}</span>
                   </div>

                   <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Forma de Pagamento</label>
                      <div className="grid grid-cols-2 gap-2">
                         {['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'].map((forma) => (
                            <button 
                              key={forma}
                              onClick={() => setFormaPagamentoSelecionada(forma as FormaPagamento)}
                              className={`py-2 text-xs font-bold rounded border transition-colors ${formaPagamentoSelecionada === forma ? 'bg-[#00e6e6] bg-opacity-20 text-[#00e6e6] border-[#00e6e6]' : 'bg-[#23272d] text-gray-400 border-gray-700 hover:border-gray-500'}`}
                            >
                              {forma}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="flex justify-between items-end border-t border-gray-700 pt-4 mt-2">
                     <span className="text-gray-300 uppercase tracking-widest text-sm font-bold">Total a Pagar</span>
                     <span className="text-4xl text-[#00e6e6] font-black tracking-tighter">{formatCurrency(totalCarrinho)}</span>
                   </div>

                   <button 
                     onClick={finalizarVenda}
                     disabled={carrinho.length === 0}
                     className="w-full mt-2 bg-[#00e6e6] disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none text-[#1a1e23] text-lg font-black uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(0,230,230,0.4)] hover:bg-opacity-90 hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     Finalizar Venda
                   </button>
                </div>
             </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: HISTÓRICO DE VENDAS */}
        {/* ========================================================= */}
        {activeTab === 'historico' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6">
            
            {/* Toolbar Histórico */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-700 pb-6">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar por cliente, nº do pedido..." 
                    value={historicoSearch}
                    onChange={(e) => setHistoricoSearch(e.target.value)}
                    className="w-full sm:w-80 bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-[#00e6e6]" 
                  />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                
                <select 
                  value={historicoStatus}
                  onChange={(e) => setHistoricoStatus(e.target.value as any)}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6] appearance-none cursor-pointer"
                >
                  <option value="Todas">Status: Todas</option>
                  <option value="Concluída">Status: Concluídas</option>
                  <option value="Aberta">Status: Abertas/Pendentes</option>
                  <option value="Cancelada">Status: Canceladas</option>
                </select>
              </div>

              {/* Relatório Rápido Cabeçalho */}
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

            {/* Tabela do Histórico */}
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
                  {vendasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma venda encontrada para os filtros aplicados.</td>
                    </tr>
                  ) : vendasFiltradas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-[#2a3038] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{venda.data_hora}</span>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5">{venda.protocolo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{venda.cliente_nome}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[#1a1e23] border border-gray-700 px-2 py-1 rounded text-xs">{venda.forma_pagamento}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#00e6e6] font-bold text-base">{formatCurrency(venda.total)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${
                          venda.status === 'Concluída' ? 'border-green-500 text-green-500 bg-green-500 bg-opacity-10' : 
                          venda.status === 'Aberta' ? 'border-yellow-500 text-yellow-500 bg-yellow-500 bg-opacity-10' : 
                          'border-red-500 text-red-500 bg-red-500 bg-opacity-10'
                        }`}>
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
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL: DETALHES DA VENDA (RECIBO) */}
      {/* ========================================================= */}
      {vendaDetalhesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white flex items-center">
                 Detalhes do Pedido
              </h3>
              <button onClick={() => setVendaDetalhesModal(null)} className="text-gray-400 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-[#23272d] relative">
               
               {/* Marca d'água de Status */}
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black uppercase tracking-widest opacity-5 transform -rotate-45 pointer-events-none ${
                  vendaDetalhesModal.status === 'Concluída' ? 'text-green-500' : 
                  vendaDetalhesModal.status === 'Aberta' ? 'text-yellow-500' : 'text-red-500'
               }`}>
                 {vendaDetalhesModal.status}
               </div>

               {/* Cabeçalho do Recibo */}
               <div className="flex justify-between items-start mb-8 relative z-10">
                 <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">NexaDash</h2>
                    <p className="text-xs text-gray-400">Recibo gerado eletronicamente.</p>
                 </div>
                 <div className="text-right">
                    <p className="text-gray-300 font-bold mb-1">Pedido: <span className="text-[#00e6e6] font-mono">{vendaDetalhesModal.protocolo}</span></p>
                    <p className="text-xs text-gray-400">Data: {vendaDetalhesModal.data_hora}</p>
                 </div>
               </div>

               {/* Dados do Cliente */}
               <div className="bg-[#1a1e23] rounded-xl p-4 border border-gray-800 mb-6 relative z-10">
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Cliente</p>
                 <p className="text-white font-bold">{vendaDetalhesModal.cliente_nome}</p>
                 {clientesMock.find(c => c.nome === vendaDetalhesModal.cliente_nome)?.telefone && (
                   <p className="text-xs text-gray-400">Tel: {clientesMock.find(c => c.nome === vendaDetalhesModal.cliente_nome)?.telefone}</p>
                 )}
               </div>

               {/* Itens */}
               <div className="relative z-10">
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Itens do Pedido</p>
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
                        {vendaDetalhesModal.itens.map((item, idx) => (
                          <tr key={idx}>
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

               {/* Resumo Financeiro */}
               <div className="flex justify-end mt-6 relative z-10">
                 <div className="w-full sm:w-1/2 bg-[#1a1e23] rounded-xl p-4 border border-gray-800">
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-400">
                      <span>Forma de Pagamento:</span>
                      <span className="font-bold text-white">{vendaDetalhesModal.forma_pagamento}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-400">
                      <span>Total de Itens:</span>
                      <span className="font-bold text-white">{vendaDetalhesModal.itens.reduce((acc, i) => acc + i.quantidade, 0)}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-3 mt-3 flex justify-between items-center">
                      <span className="uppercase tracking-widest text-xs font-bold text-gray-500">Total Pago:</span>
                      <span className="text-2xl font-black text-[#00e6e6]">{formatCurrency(vendaDetalhesModal.total)}</span>
                    </div>
                 </div>
               </div>

            </div>

            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-between items-center rounded-b-2xl">
               <div>
                  {vendaDetalhesModal.status !== 'Cancelada' && (
                    <button 
                      onClick={() => {
                        setVendas(prev => prev.map(v => v.id === vendaDetalhesModal.id ? {...v, status: 'Cancelada'} : v));
                        setVendaDetalhesModal({...vendaDetalhesModal, status: 'Cancelada'});
                      }}
                      className="text-red-500 hover:text-red-400 text-sm font-bold underline transition-colors"
                    >
                      Cancelar Venda
                    </button>
                  )}
               </div>
               <div className="flex space-x-3">
                 <button className="px-4 py-2 bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-600 transition-colors flex items-center">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                   Imprimir
                 </button>
                 <button onClick={() => setVendaDetalhesModal(null)} className="px-6 py-2 bg-[#00e6e6] text-[#1a1e23] text-sm font-bold rounded-lg hover:bg-opacity-80 transition-colors shadow-[0_0_15px_rgba(0,230,230,0.3)]">
                   Fechar
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
