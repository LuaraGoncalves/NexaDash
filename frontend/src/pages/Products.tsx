import { useState } from 'react';

type Categoria = { id: number; nome: string; descricao?: string };
type Fornecedor = { id: number; nome: string; cnpj_cpf?: string; contato?: string };
type Unidade = { id: number; sigla: string; nome: string };

type Produto = {
  id: number;
  sku: string;
  nome: string;
  descricao: string;
  preco_custo: number;
  preco_venda: number;
  quantidade: number;
  estoque_minimo: number;
  status: 'ativo' | 'inativo'; // exclusão lógica
  id_categoria: number;
  id_fornecedor: number;
  id_unidade: number;
  foto_url?: string;
};

type Movimentacao = {
  id: number;
  id_produto: number;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data_hora: string;
  motivo: string;
  responsavel: string;
};

export default function Products() {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'movimentacoes' | 'cadastros'>('catalogo');
  
  // Modals state
  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  
  // Mocks: Estruturas Auxiliares
  const categorias: Categoria[] = [
    { id: 1, nome: 'Eletrônicos', descricao: 'Equipamentos, gadgets e afins' },
    { id: 2, nome: 'Acessórios', descricao: 'Capas, cabos, películas' },
    { id: 3, nome: 'Serviços', descricao: 'Manutenções e consultoria' }
  ];

  const fornecedores: Fornecedor[] = [
    { id: 1, nome: 'Tech Distribuidora S.A', cnpj_cpf: '12.345.678/0001-90', contato: '(11) 98765-4321' },
    { id: 2, nome: 'Imports Brasil', cnpj_cpf: '98.765.432/0001-10', contato: '(21) 99999-8888' }
  ];

  const unidades: Unidade[] = [
    { id: 1, sigla: 'UN', nome: 'Unidade' },
    { id: 2, sigla: 'CX', nome: 'Caixa' },
    { id: 3, sigla: 'KG', nome: 'Quilograma' }
  ];

  // Mocks: Produtos
  const [produtos] = useState<Produto[]>([
    {
      id: 1,
      sku: 'EL-001',
      nome: 'Smartphone Alpha X',
      descricao: '128GB, Tela 6.5, Câmera 48MP',
      preco_custo: 1200.00,
      preco_venda: 2500.00,
      quantidade: 15,
      estoque_minimo: 5,
      status: 'ativo',
      id_categoria: 1,
      id_fornecedor: 1,
      id_unidade: 1
    },
    {
      id: 2,
      sku: 'AC-102',
      nome: 'Cabo USB-C Turbo',
      descricao: '2 metros, blindado',
      preco_custo: 15.50,
      preco_venda: 45.00,
      quantidade: 2, // Baixo estoque
      estoque_minimo: 10,
      status: 'ativo',
      id_categoria: 2,
      id_fornecedor: 2,
      id_unidade: 1
    },
    {
      id: 3,
      sku: 'EL-099',
      nome: 'Tablet Ultra (Modelo Antigo)',
      descricao: 'Fora de linha',
      preco_custo: 800.00,
      preco_venda: 1100.00,
      quantidade: 0,
      estoque_minimo: 0,
      status: 'inativo',
      id_categoria: 1,
      id_fornecedor: 1,
      id_unidade: 1
    }
  ]);

  // Mocks: Movimentações
  const movimentacoes: Movimentacao[] = [
    { id: 101, id_produto: 1, tipo: 'entrada', quantidade: 20, data_hora: '2026-03-01 10:00', motivo: 'Compra de Fornecedor', responsavel: 'Carlos Admin' },
    { id: 102, id_produto: 1, tipo: 'saida', quantidade: 5, data_hora: '2026-03-02 14:30', motivo: 'Venda Balcão', responsavel: 'Fernanda Vendas' },
    { id: 103, id_produto: 2, tipo: 'saida', quantidade: 1, data_hora: '2026-03-03 09:15', motivo: 'Brinde/Uso Interno', responsavel: 'Carlos Admin' }
  ];

  // Filtros de Pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<number | 'todas'>('todas');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativo' | 'inativo'>('ativo');

  // Filtragem
  const produtosFiltrados = produtos.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCat === 'todas' || p.id_categoria === filterCat;
    const matchesStatus = filterStatus === 'todos' || p.status === filterStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Helpers
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const getCategoriaNome = (id: number) => categorias.find(c => c.id === id)?.nome || 'Sem Categoria';
  const getFornecedorNome = (id: number) => fornecedores.find(f => f.id === id)?.nome || 'Desconhecido';
  const getUnidadeSigla = (id: number) => unidades.find(u => u.id === id)?.sigla || 'UN';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header & Tabs */}
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Gestão de Produtos & Estoque</h2>
          <p className="text-gray-400 text-sm">Controle seu inventário, compras, vendas e margens de lucro.</p>
        </div>
        <div className="flex space-x-2">
           <button 
             onClick={() => setActiveTab('catalogo')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'catalogo' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#ff8c00]' : 'text-gray-400 hover:text-white'}`}
           >
             Catálogo & Estoque
           </button>
           <button 
             onClick={() => setActiveTab('movimentacoes')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'movimentacoes' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#ff8c00]' : 'text-gray-400 hover:text-white'}`}
           >
             Movimentações
           </button>
           <button 
             onClick={() => setActiveTab('cadastros')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'cadastros' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#ff8c00]' : 'text-gray-400 hover:text-white'}`}
           >
             Parâmetros (Cat/Forn)
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* ABA 1: CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6">
            
            {/* Action Bar & Filters */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div className="flex flex-wrap gap-3 items-center">
                <input 
                  type="text" 
                  placeholder="Buscar produto ou SKU..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]" 
                />
                <select 
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00] appearance-none"
                >
                  <option value="todas">Todas as Categorias</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00] appearance-none"
                >
                  <option value="todos">Status: Todos</option>
                  <option value="ativo">Status: Ativos</option>
                  <option value="inativo">Status: Inativos</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsMovimentacaoModalOpen(true)}
                  className="bg-[#2a3038] text-white hover:bg-gray-700 border border-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M7 11V7a5 5 0 0 1 10 0v4"/><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/></svg>
                  Movimentar
                </button>
                <button 
                  onClick={() => setIsProdutoModalOpen(true)}
                  className="bg-[#ff8c00] text-[#1a1e23] hover:bg-opacity-80 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center shadow-[0_0_10px_rgba(255,140,0,0.3)]"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                  Novo Produto
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto rounded-xl border border-gray-700">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#1a1e23] text-gray-300 uppercase text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-medium w-16">Item</th>
                    <th className="px-6 py-4 font-medium">Produto / SKU</th>
                    <th className="px-6 py-4 font-medium text-center">Estoque</th>
                    <th className="px-6 py-4 font-medium">Preço (Custo / Venda)</th>
                    <th className="px-6 py-4 font-medium">Categoria / Fornecedor</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {produtosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-500">Nenhum produto encontrado.</td>
                    </tr>
                  ) : produtosFiltrados.map((p) => {
                    const lucro = p.preco_venda - p.preco_custo;
                    const margem = p.preco_custo > 0 ? ((lucro / p.preco_custo) * 100).toFixed(1) : '100';
                    const isLowStock = p.quantidade <= p.estoque_minimo && p.status === 'ativo';

                    return (
                      <tr key={p.id} className={`transition-colors ${p.status === 'inativo' ? 'opacity-50 bg-[#1a1e23]' : 'hover:bg-[#2a3038]'}`}>
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden">
                             {p.foto_url ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover"/> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{p.nome}</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded font-mono">{p.sku}</span>
                              {p.status === 'inativo' && <span className="text-[10px] text-red-500 font-bold border border-red-500 px-1 rounded uppercase">Inativo</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-xl font-bold ${isLowStock ? 'text-red-500' : 'text-white'}`}>{p.quantidade} <span className="text-xs font-normal text-gray-500">{getUnidadeSigla(p.id_unidade)}</span></span>
                            {isLowStock && <span className="text-[10px] text-red-500 font-semibold bg-red-500 bg-opacity-10 px-2 py-0.5 rounded-full mt-1">Baixo Estoque (Min: {p.estoque_minimo})</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <div className="flex justify-between w-32">
                              <span className="text-xs text-gray-500">Custo:</span>
                              <span className="text-gray-300">{formatCurrency(p.preco_custo)}</span>
                            </div>
                            <div className="flex justify-between w-32">
                              <span className="text-xs text-gray-500">Venda:</span>
                              <span className="text-[#00e6e6] font-bold">{formatCurrency(p.preco_venda)}</span>
                            </div>
                            <div className="flex justify-between w-32 border-t border-gray-700 pt-1 mt-1">
                              <span className="text-[10px] text-gray-500">Lucro:</span>
                              <span className="text-[10px] text-green-500 font-bold">+{formatCurrency(lucro)} ({margem}%)</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white text-sm">{getCategoriaNome(p.id_categoria)}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate w-40" title={getFornecedorNome(p.id_fornecedor)}>{getFornecedorNome(p.id_fornecedor)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end space-x-2">
                             <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors" title="Editar">
                               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                             </button>
                             {p.status === 'ativo' ? (
                               <button className="p-2 bg-red-500 bg-opacity-10 hover:bg-opacity-20 text-red-500 border border-transparent hover:border-red-500 rounded transition-colors" title="Inativar/Excluir">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                               </button>
                             ) : (
                               <button className="p-2 bg-green-500 bg-opacity-10 hover:bg-opacity-20 text-green-500 border border-transparent hover:border-green-500 rounded transition-colors" title="Reativar">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/></svg>
                               </button>
                             )}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Relatório Resumo Footer */}
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-xs text-gray-400">
               <span>Total de Produtos Cadastrados: <strong className="text-white">{produtos.length}</strong></span>
               <span>Total de Itens em Estoque (Ativos): <strong className="text-[#00e6e6] text-sm">{produtos.filter(p=>p.status==='ativo').reduce((acc, p) => acc + p.quantidade, 0)} UN</strong></span>
               <span>Valor de Estoque (Custo): <strong className="text-white">{formatCurrency(produtos.filter(p=>p.status==='ativo').reduce((acc, p) => acc + (p.quantidade * p.preco_custo), 0))}</strong></span>
            </div>
          </div>
        )}

        {/* ABA 2: MOVIMENTAÇÕES (Histórico) */}
        {activeTab === 'movimentacoes' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
              <h3 className="text-lg font-bold text-white">Histórico de Entrada e Saída (Kardex)</h3>
              <button 
                  onClick={() => setIsMovimentacaoModalOpen(true)}
                  className="bg-[#2a3038] text-white hover:bg-gray-700 border border-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M7 11V7a5 5 0 0 1 10 0v4"/><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/></svg>
                  Registrar Nova Movimentação
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="space-y-4">
                {movimentacoes.slice().reverse().map(mov => {
                  const produtoRelacionado = produtos.find(p => p.id === mov.id_produto);
                  const isEntrada = mov.tipo === 'entrada';
                  
                  return (
                    <div key={mov.id} className="bg-[#1a1e23] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 ${isEntrada ? 'bg-green-500 bg-opacity-10 border-green-500 text-green-500' : 'bg-red-500 bg-opacity-10 border-red-500 text-red-500'}`}>
                           {isEntrada ? (
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><polyline points="20 6 9 17 4 12"/></svg>
                           ) : (
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                           )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                             <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isEntrada ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{mov.tipo}</span>
                             <span className="text-gray-400 text-xs">{mov.data_hora}</span>
                          </div>
                          <h4 className="text-white font-bold text-md mt-1">{produtoRelacionado?.nome || 'Produto Excluído'} <span className="text-gray-500 font-mono text-xs">({produtoRelacionado?.sku})</span></h4>
                          <p className="text-gray-400 text-sm">{mov.motivo} • Responsável: {mov.responsavel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className={`text-2xl font-bold ${isEntrada ? 'text-green-500' : 'text-red-500'}`}>
                           {isEntrada ? '+' : '-'}{mov.quantidade} <span className="text-sm font-normal">UN</span>
                         </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: CADASTROS (Configurações da área de produto) */}
        {activeTab === 'cadastros' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6 overflow-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                
                {/* Categorias */}
                <div className="bg-[#1a1e23] border border-gray-700 rounded-xl p-6 flex flex-col">
                   <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                      <h3 className="text-white font-bold text-lg">Categorias</h3>
                      <button className="text-[#00e6e6] hover:text-white text-sm font-semibold">+ Nova Categoria</button>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-2">
                     {categorias.map(cat => (
                        <div key={cat.id} className="bg-[#23272d] p-3 rounded-lg flex justify-between items-center group">
                           <div>
                             <p className="text-white font-semibold text-sm">{cat.nome}</p>
                             <p className="text-gray-500 text-xs">{cat.descricao}</p>
                           </div>
                           <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                        </div>
                     ))}
                   </div>
                </div>

                {/* Fornecedores */}
                <div className="bg-[#1a1e23] border border-gray-700 rounded-xl p-6 flex flex-col">
                   <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                      <h3 className="text-white font-bold text-lg">Fornecedores</h3>
                      <button className="text-[#00e6e6] hover:text-white text-sm font-semibold">+ Novo Fornecedor</button>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-2">
                     {fornecedores.map(forn => (
                        <div key={forn.id} className="bg-[#23272d] p-3 rounded-lg flex justify-between items-center group">
                           <div>
                             <p className="text-white font-semibold text-sm">{forn.nome}</p>
                             <p className="text-gray-500 text-xs">CNPJ/CPF: {forn.cnpj_cpf} • {forn.contato}</p>
                           </div>
                           <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                        </div>
                     ))}
                   </div>
                </div>

             </div>
          </div>
        )}

      </div>

      {/* =========================================
          MODALS
      ============================================= */}

      {/* Modal: Novo/Editar Produto */}
      {isProdutoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white flex items-center">
                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2 text-[#ff8c00]"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                 Cadastrar Novo Produto
              </h3>
              <button onClick={() => setIsProdutoModalOpen(false)} className="text-gray-400 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
               <form className="space-y-6">
                 
                 {/* Bloco 1: Identificação */}
                 <div>
                    <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2 mb-4">Identificação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                       <div className="md:col-span-8">
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Nome do Produto *</label>
                          <input type="text" placeholder="Ex: Monitor Dell 24 polegadas" className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]" />
                       </div>
                       <div className="md:col-span-4">
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Código / SKU *</label>
                          <input type="text" placeholder="Ex: EL-004" className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00] font-mono" />
                       </div>
                       <div className="md:col-span-12">
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Descrição</label>
                          <textarea rows={2} className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]" placeholder="Detalhes técnicos, especificações..."></textarea>
                       </div>
                    </div>
                 </div>

                 {/* Bloco 2: Classificação */}
                 <div>
                    <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2 mb-4">Classificação e Origem</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria *</label>
                          <select className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00] appearance-none">
                            <option value="">Selecione...</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Fornecedor Padrão</label>
                          <select className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00] appearance-none">
                            <option value="">Selecione...</option>
                            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Unidade de Medida</label>
                          <select className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00] appearance-none">
                            {unidades.map(u => <option key={u.id} value={u.id}>{u.sigla} - {u.nome}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 {/* Bloco 3: Precificação e Estoque */}
                 <div>
                    <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2 mb-4">Valores e Estoque</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Preço de Custo (R$)</label>
                          <input type="number" step="0.01" placeholder="0.00" className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]" />
                       </div>
                       <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Preço de Venda (R$)</label>
                          <input type="number" step="0.01" placeholder="0.00" className="w-full bg-[#1a1e23] border border-gray-700 text-[#00e6e6] font-bold rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]" />
                       </div>
                       <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Estoque Inicial</label>
                          <input type="number" placeholder="0" className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]" />
                       </div>
                       <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Estoque Mínimo (Alerta)</label>
                          <input type="number" placeholder="5" className="w-full bg-[#1a1e23] border border-red-900 focus:border-red-500 text-white rounded-lg px-4 py-2 outline-none" />
                       </div>
                    </div>
                 </div>

               </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-end space-x-3 rounded-b-2xl">
               <button onClick={() => setIsProdutoModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
               <button className="px-6 py-2 bg-[#ff8c00] text-[#1a1e23] text-sm font-bold rounded-lg hover:bg-opacity-80 transition-colors shadow-[0_0_15px_rgba(255,140,0,0.3)]">
                 Salvar Produto
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Movimentação */}
      {isMovimentacaoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white flex items-center">
                 Registrar Movimentação
              </h3>
              <button onClick={() => setIsMovimentacaoModalOpen(false)} className="text-gray-400 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6">
               <form className="space-y-4">
                 
                 <div className="grid grid-cols-2 gap-4 mb-2">
                   <button type="button" className="py-3 border-2 border-green-500 bg-green-500 bg-opacity-10 text-green-500 font-bold rounded-xl flex items-center justify-center">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 mr-2"><polyline points="20 6 9 17 4 12"/></svg>
                     Entrada
                   </button>
                   <button type="button" className="py-3 border-2 border-transparent bg-[#1a1e23] text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                     Saída
                   </button>
                 </div>

                 <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Selecione o Produto *</label>
                    <select className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-[#00e6e6] appearance-none">
                      <option value="">Buscar produto...</option>
                      {produtos.filter(p=>p.status==='ativo').map(p => <option key={p.id} value={p.id}>{p.sku} - {p.nome} (Estoque: {p.quantidade})</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Quantidade *</label>
                      <input type="number" min="1" placeholder="1" className="w-full bg-[#1a1e23] border border-gray-700 text-white text-lg font-bold rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]" />
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Data / Hora</label>
                      <input type="datetime-local" className="w-full bg-[#1a1e23] border border-gray-700 text-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]" />
                   </div>
                 </div>

                 <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Motivo / Observação *</label>
                    <input type="text" placeholder="Ex: Compra ref. NF-e 1234 / Venda Loja" className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]" />
                 </div>

               </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-end space-x-3 rounded-b-2xl">
               <button onClick={() => setIsMovimentacaoModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
               <button className="px-6 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-colors shadow-lg">
                 Confirmar Entrada
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
