import { useState } from 'react';

type Permission = 'ver_leads' | 'editar_leads' | 'excluir_leads' | 'ver_financeiro' | 'criar_usuario';

type User = {
  id: number;
  nome: string;
  email: string;
  status: 'ativo' | 'inativo';
  perfil: 'Administrador' | 'Gerente de Vendas' | 'Atendente' | 'Financeiro';
  setor: 'Vendas' | 'Financeiro' | 'Suporte' | 'Marketing' | 'Geral';
  data_criacao: string;
  ultimo_acesso: string;
  foto?: string;
  permissoes: Record<Permission, boolean>;
};

type AuditLog = {
  id: number;
  usuario_nome: string;
  acao: string;
  data_hora: string;
};

function Users() {
  const [activeTab, setActiveTab] = useState<'lista' | 'auditoria'>('lista');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Mock Data: Users
  const [users] = useState<User[]>([
    {
      id: 1,
      nome: 'Carlos Silva',
      email: 'carlos.admin@nexadash.com',
      status: 'ativo',
      perfil: 'Administrador',
      setor: 'Geral',
      data_criacao: '2025-01-15',
      ultimo_acesso: '2026-03-03 14:20',
      foto: 'C',
      permissoes: { ver_leads: true, editar_leads: true, excluir_leads: true, ver_financeiro: true, criar_usuario: true }
    },
    {
      id: 2,
      nome: 'Fernanda Vendas',
      email: 'fernanda@nexadash.com',
      status: 'ativo',
      perfil: 'Gerente de Vendas',
      setor: 'Vendas',
      data_criacao: '2025-02-10',
      ultimo_acesso: '2026-03-03 09:15',
      foto: 'F',
      permissoes: { ver_leads: true, editar_leads: true, excluir_leads: false, ver_financeiro: false, criar_usuario: false }
    },
    {
      id: 3,
      nome: 'Roberto Suporte',
      email: 'roberto@nexadash.com',
      status: 'inativo',
      perfil: 'Atendente',
      setor: 'Suporte',
      data_criacao: '2025-06-22',
      ultimo_acesso: '2026-01-10 16:45',
      foto: 'R',
      permissoes: { ver_leads: true, editar_leads: false, excluir_leads: false, ver_financeiro: false, criar_usuario: false }
    }
  ]);

  // Mock Data: Audit Logs
  const logs: AuditLog[] = [
    { id: 101, usuario_nome: 'Carlos Silva', acao: 'Criou o usuário Fernanda Vendas', data_hora: '2025-02-10 09:00' },
    { id: 102, usuario_nome: 'Fernanda Vendas', acao: 'Mudou o status do lead Maria para Negociação', data_hora: '2026-03-03 10:30' },
    { id: 103, usuario_nome: 'Carlos Silva', acao: 'Inativou o usuário Roberto Suporte', data_hora: '2026-01-10 17:00' },
    { id: 104, usuario_nome: 'Fernanda Vendas', acao: 'Editou os dados do lead João', data_hora: '2026-03-03 11:45' },
    { id: 105, usuario_nome: 'Carlos Silva', acao: 'Excluiu o lead Teste', data_hora: '2026-03-02 15:20' }
  ];

  const handleOpenModal = (user?: User) => {
    if (user) setEditingUser(user);
    else setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Top Header & Tabs */}
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Usuários & Acessos</h2>
          <p className="text-gray-400 text-sm">Gerencie sua equipe, permissões e monitore as atividades.</p>
        </div>
        <div className="flex space-x-2">
           <button 
             onClick={() => setActiveTab('lista')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'lista' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
           >
             Usuários
           </button>
           <button 
             onClick={() => setActiveTab('auditoria')}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'auditoria' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
           >
             Logs de Auditoria
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Users List View */}
        {activeTab === 'lista' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <input type="text" placeholder="Buscar usuário por nome ou email..." className="w-1/3 bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]" />
              <button 
                onClick={() => handleOpenModal()}
                className="bg-[#00e6e6] text-[#1a1e23] hover:bg-opacity-80 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Novo Usuário
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-gray-700">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#1a1e23] text-gray-300 uppercase text-xs sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-medium">Usuário</th>
                    <th className="px-6 py-4 font-medium">Perfil / Setor</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Último Acesso</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#2a3038] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold shrink-0">
                            {user.foto || user.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{user.nome}</p>
                            <p className="text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{user.perfil}</p>
                        <p className="text-xs">{user.setor}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${user.status === 'ativo' ? 'border-green-500 text-green-500 bg-green-500 bg-opacity-10' : 'border-red-500 text-red-500 bg-red-500 bg-opacity-10'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{user.ultimo_acesso}</p>
                        <p className="text-xs">Criado em: {user.data_criacao}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenModal(user)} className="text-[#00e6e6] hover:text-white transition-colors">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs View */}
        {activeTab === 'auditoria' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Logs Recentes do Sistema</h3>
            <div className="flex-1 overflow-auto relative">
              <div className="space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
                 
                 {logs.map((log) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#23272d] bg-[#1a1e23] text-gray-500 group-[.is-active]:text-[#ff8c00] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#1a1e23] p-4 rounded-xl border border-gray-800 shadow">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1">
                          <h4 className="font-bold text-white text-sm">{log.usuario_nome}</h4>
                          <span className="text-xs text-gray-500 font-mono">{log.data_hora}</span>
                        </div>
                        <p className="text-sm text-gray-400">{log.acao}</p>
                      </div>
                    </div>
                 ))}

              </div>
            </div>
          </div>
        )}

      </div>

      {/* User Edit/Create Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-3xl flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form className="space-y-6">
                
                {/* Status Switch (if editing) */}
                {editingUser && (
                  <div className="flex items-center space-x-3 mb-4 p-4 bg-[#1a1e23] rounded-lg border border-gray-800">
                    <span className="text-sm font-semibold text-white">Status do Usuário:</span>
                    <button type="button" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingUser.status === 'ativo' ? 'bg-green-500' : 'bg-gray-600'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingUser.status === 'ativo' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{editingUser.status}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Data */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2">Dados Básicos</h4>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Nome Completo</label>
                      <input type="text" defaultValue={editingUser?.nome} className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">E-mail (Login)</label>
                      <input type="email" defaultValue={editingUser?.email} className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">{editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}</label>
                      <input type="password" placeholder="******" className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]" />
                    </div>
                  </div>

                  {/* Role and Sector */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2">Acesso & Setor</h4>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Perfil de Usuário</label>
                      <select defaultValue={editingUser?.perfil || 'Atendente'} className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6] appearance-none">
                        <option value="Administrador">Administrador</option>
                        <option value="Gerente de Vendas">Gerente de Vendas</option>
                        <option value="Atendente">Atendente</option>
                        <option value="Financeiro">Financeiro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Setor / Área</label>
                      <select defaultValue={editingUser?.setor || 'Vendas'} className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6] appearance-none">
                        <option value="Geral">Geral (Todas as áreas)</option>
                        <option value="Vendas">Vendas</option>
                        <option value="Financeiro">Financeiro</option>
                        <option value="Suporte">Suporte</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Permissions Toggles */}
                <div>
                  <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2 mb-4 mt-6">Permissões Específicas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    
                    {[
                      { key: 'ver_leads', label: 'Ver Leads' },
                      { key: 'editar_leads', label: 'Editar Leads' },
                      { key: 'excluir_leads', label: 'Excluir Leads' },
                      { key: 'ver_financeiro', label: 'Ver Financeiro' },
                      { key: 'criar_usuario', label: 'Criar Usuários' }
                    ].map((perm) => (
                      <div key={perm.key} className="flex items-center space-x-3 p-3 bg-[#1a1e23] rounded-lg border border-gray-800">
                        <button type="button" className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${editingUser?.permissoes[perm.key as Permission] ? 'bg-[#00e6e6]' : 'bg-gray-700'}`}>
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editingUser?.permissoes[perm.key as Permission] ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm font-medium text-gray-300">{perm.label}</span>
                      </div>
                    ))}

                  </div>
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-end space-x-3 rounded-b-2xl">
               <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
               <button className="px-6 py-2 bg-[#00e6e6] text-[#1a1e23] text-sm font-bold rounded-lg hover:bg-opacity-80 transition-colors shadow-[0_0_15px_rgba(0,230,230,0.3)]">
                 {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Users;
