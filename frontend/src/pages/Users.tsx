import { useEffect, useMemo, useState } from 'react';
import {
  createManagedUser,
  deleteManagedUser,
  listAuditLogs,
  listUsers,
  updateManagedUser,
  type AuditLogFilters,
  type AuditLogRecord,
  type ManagedUser,
  type PermissionKey,
  type UserRole,
} from '../services/usersApi';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ContextHelp from '../components/ContextHelp';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { actionBadgeClass, actionBadgeLabel } from './users/auditBadge';
import {
  defaultPermissionsByRole,
  emptyFormState,
  permissionLabels,
  roleOptions,
  type UserFormState,
} from './users/userAccessConfig';

const moduleLabels: Record<string, string> = {
  auth: 'Autenticação',
  seguranca: 'Segurança',
  usuarios: 'Usuários',
  produtos: 'Produtos',
  estoque: 'Estoque',
  financeiro: 'Financeiro',
  leads: 'Leads',
  vendas: 'Vendas',
};

const moduleBadgeClasses: Record<string, string> = {
  auth: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  seguranca: 'bg-red-500/10 text-red-300 border-red-500/30',
  usuarios: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  produtos: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  estoque: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  financeiro: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  leads: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
  vendas: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
};

function Users() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'lista' | 'auditoria'>('lista');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [formState, setFormState] = useState<UserFormState>(emptyFormState);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [auditFilters, setAuditFilters] = useState<AuditLogFilters>({
    modulo: '',
    usuario: '',
    data_inicio: '',
    data_fim: '',
  });
  const [auditActionSearch, setAuditActionSearch] = useState('');

  useEffect(() => {
    const carregarUsuarios = async () => {
    try {
      const usersResponse = await listUsers();
      setUsers(usersResponse);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showToast({
          tone: 'error',
          title: 'Nao consegui carregar os usuarios',
          description: 'A lista de usuarios nao veio da API agora.',
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    carregarUsuarios();
  }, [showToast]);

  useEffect(() => {
    const carregarLogs = async () => {
      setIsLoadingLogs(true);

    try {
      const logsResponse = await listAuditLogs(auditFilters);
      setLogs(logsResponse);
      } catch (error) {
        console.error('Erro ao carregar auditoria:', error);
        showToast({
          tone: 'error',
          title: 'Nao consegui carregar a auditoria',
          description: 'Os logs nao vieram da API agora.',
        });
      } finally {
        setIsLoadingLogs(false);
      }
    };

    carregarLogs();
  }, [auditFilters, showToast]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const target = `${user.nome} ${user.email} ${user.perfil} ${user.setor}`.toLowerCase();
      return target.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, users]);

  const visibleLogs = useMemo(() => {
    return logs.filter((log) => log.acao.toLowerCase().includes(auditActionSearch.toLowerCase()));
  }, [auditActionSearch, logs]);

  const formatLogDate = (date: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));

  const canInactivateUsers = authUser?.role === 'admin';

  const handleOpenModal = (user?: ManagedUser) => {
    if (user) {
      setEditingUser(user);
      setFormState({
        name: user.nome,
        email: user.email,
        password: '',
        role: user.role,
        status: user.status,
        setor: user.setor,
        permissions: { ...user.permissoes },
      });
    } else {
      setEditingUser(null);
      setFormState(emptyFormState());
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormState(emptyFormState());
  };

  const handleRoleChange = (role: UserRole) => {
    const roleOption = roleOptions.find((option) => option.value === role);

    setFormState((prev) => ({
      ...prev,
      role,
      setor: roleOption?.defaultSetor ?? prev.setor,
      permissions: { ...defaultPermissionsByRole[role] },
    }));
  };

  const handlePermissionToggle = (permission: PermissionKey) => {
    setFormState((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingUser(true);

    const payload = {
      name: formState.name,
      email: formState.email,
      password: formState.password || null,
      role: formState.role,
      status: formState.status,
      setor: formState.setor,
      permissions: formState.permissions,
    };

    try {
      const savedUser = editingUser
        ? await updateManagedUser(editingUser.id, payload)
        : await createManagedUser(payload);

      setUsers((prev) => {
        if (editingUser) {
          return prev.map((user) => (user.id === savedUser.id ? savedUser : user));
        }

        return [savedUser, ...prev];
      });

      handleCloseModal();
      showToast({
        tone: 'success',
        title: editingUser ? 'Usuario atualizado' : 'Usuario criado',
        description: editingUser ? 'As alteracoes foram salvas com sucesso.' : 'O novo usuario foi cadastrado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar o usuario',
        description: 'A API nao confirmou essa alteracao agora.',
      });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    setIsDeletingUser(true);

    try {
      const response = await deleteManagedUser(userToDelete.id);
      setUsers((prev) => prev.map((user) => (user.id === response.user.id ? response.user : user)));
      setUserToDelete(null);
      showToast({
        tone: 'success',
        title: 'Usuario inativado',
        description: `${response.user.nome} perdeu o acesso normal, mas o historico foi mantido.`,
      });
    } catch (error) {
      console.error('Erro ao inativar usuário:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui inativar o usuario',
        description: 'A API nao confirmou essa mudanca agora.',
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Top Header & Tabs */}
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Usuários & Acessos</h2>
          <p className="text-gray-400 text-sm">Gerencie sua equipe, permissões e monitore as atividades.</p>
        </div>
        <div className="flex items-center space-x-2">
           <ContextHelp title="Ajuda de usuarios">
             <p>Usuario nao e apagado da historia. Inativar so corta o uso normal da conta.</p>
             <p>Os logs de auditoria mostram quem fez o que e em qual modulo.</p>
           </ContextHelp>
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
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar usuário por nome ou email..."
                className="w-1/3 bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
              />
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
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Carregando usuários...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum usuário encontrado.</td>
                    </tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#2a3038] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold shrink-0">
                            {user.nome.charAt(0)}
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
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleOpenModal(user)} className="text-[#00e6e6] hover:text-white transition-colors">
                            Editar
                          </button>
                          {canInactivateUsers && user.status === 'ativo' && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Inativar
                            </button>
                          )}
                        </div>
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
            <div className="mb-6 flex flex-col gap-4 border-b border-gray-700 pb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Logs Recentes do Sistema</h3>
                <p className="mt-1 text-sm text-gray-400">Filtre por módulo, nome da pessoa e período para achar mais rápido o que aconteceu.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                <select
                  value={auditFilters.modulo}
                  onChange={(event) => setAuditFilters((prev) => ({ ...prev, modulo: event.target.value }))}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                >
                  <option value="">Todos os módulos</option>
                  {Object.entries(moduleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={auditFilters.usuario}
                  onChange={(event) => setAuditFilters((prev) => ({ ...prev, usuario: event.target.value }))}
                  placeholder="Filtrar por usuário"
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                />

                <input
                  type="text"
                  value={auditActionSearch}
                  onChange={(event) => setAuditActionSearch(event.target.value)}
                  placeholder="Buscar por ação"
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                />

                <input
                  type="date"
                  value={auditFilters.data_inicio}
                  onChange={(event) => setAuditFilters((prev) => ({ ...prev, data_inicio: event.target.value }))}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                />

                <input
                  type="date"
                  value={auditFilters.data_fim}
                  onChange={(event) => setAuditFilters((prev) => ({ ...prev, data_fim: event.target.value }))}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
                  {visibleLogs.length} logs visíveis
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuditFilters({
                      modulo: '',
                      usuario: '',
                      data_inicio: '',
                      data_fim: '',
                    });
                    setAuditActionSearch('');
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-slate-300 hover:border-white/20"
                >
                  Limpar filtros
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto relative">
              <div className="space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
                 
                 {isLoadingLogs ? (
                   <div className="rounded-xl bg-[#1a1e23] px-4 py-8 text-center text-gray-500">
                     Carregando logs...
                   </div>
                 ) : visibleLogs.length === 0 ? (
                   <div className="rounded-xl bg-[#1a1e23] px-4 py-8 text-center text-gray-500">
                     Nenhum log encontrado.
                   </div>
                 ) : visibleLogs.map((log) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#23272d] bg-[#1a1e23] text-gray-500 group-[.is-active]:text-[#ff8c00] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#1a1e23] p-4 rounded-xl border border-gray-800 shadow">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1">
                          <h4 className="font-bold text-white text-sm">{log.usuario_nome}</h4>
                          <span className="text-xs text-gray-500 font-mono">{formatLogDate(log.data_hora)}</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{log.acao}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${moduleBadgeClasses[log.modulo] ?? 'bg-gray-500/10 text-gray-300 border-gray-500/30'}`}>
                            {moduleLabels[log.modulo] ?? log.modulo}
                          </span>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${actionBadgeClass(log.acao)}`}>
                            {actionBadgeLabel(log.acao)}
                          </span>
                        </div>
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
              <form id="user-form" className="space-y-6" onSubmit={handleSubmit}>
                
                {/* Status Switch (if editing) */}
                {editingUser && canInactivateUsers && (
                  <div className="flex items-center space-x-3 mb-4 p-4 bg-[#1a1e23] rounded-lg border border-gray-800">
                    <span className="text-sm font-semibold text-white">Status do Usuário:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          status: prev.status === 'ativo' ? 'inativo' : 'ativo',
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formState.status === 'ativo' ? 'bg-green-500' : 'bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formState.status === 'ativo' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{formState.status}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Data */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2">Dados Básicos</h4>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">E-mail (Login)</label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">{editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}</label>
                      <input
                        type="password"
                        value={formState.password}
                        onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="******"
                        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                      />
                    </div>
                  </div>

                  {/* Role and Sector */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2">Acesso & Setor</h4>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Perfil de Usuário</label>
                      <select
                        value={formState.role}
                        onChange={(event) => handleRoleChange(event.target.value as UserRole)}
                        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6] appearance-none"
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Setor / Área</label>
                      <select
                        value={formState.setor}
                        onChange={(event) => setFormState((prev) => ({ ...prev, setor: event.target.value }))}
                        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6] appearance-none"
                      >
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
                  <p className="mb-4 text-xs text-gray-400">
                    Quando você troca o cargo, a tela já monta as permissões base daquele perfil.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    
                    {(Object.keys(permissionLabels) as PermissionKey[]).map((permission) => (
                      <div key={permission} className="flex items-center space-x-3 p-3 bg-[#1a1e23] rounded-lg border border-gray-800">
                        <button
                          type="button"
                          onClick={() => handlePermissionToggle(permission)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${formState.permissions[permission] ? 'bg-[#00e6e6]' : 'bg-gray-700'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formState.permissions[permission] ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm font-medium text-gray-300">{permissionLabels[permission]}</span>
                      </div>
                    ))}

                  </div>
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-end space-x-3 rounded-b-2xl">
               <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
               <button
                 type="submit"
                 form="user-form"
                 className="px-6 py-2 bg-[#00e6e6] text-[#1a1e23] text-sm font-bold rounded-lg hover:bg-opacity-80 transition-colors shadow-[0_0_15px_rgba(0,230,230,0.3)] disabled:bg-gray-700 disabled:text-gray-500"
                 disabled={isSavingUser}
               >
                 {isSavingUser ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
               </button>
             </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={userToDelete !== null}
        title="Inativar usuário?"
        description={`A pessoa ${userToDelete?.nome ?? ''} vai perder o uso normal da conta, mas o histórico dela continua guardado para auditoria.`}
        confirmLabel="Inativar usuário"
        tone="warning"
        isSubmitting={isDeletingUser}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}

export default Users;
