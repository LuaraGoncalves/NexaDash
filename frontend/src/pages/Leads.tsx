import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ContextHelp from '../components/ContextHelp';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import {
  createLead,
  createLeadMessage,
  deleteLead,
  listLeadMessages,
  listLeads,
  updateLead,
  type LeadMessageRecord,
  type LeadRecord,
  type LeadStatus,
} from '../services/leadsApi';
import LeadsKanban from './LeadsKanban';
import type { Lead } from './LeadsKanban';

type LeadFormState = {
  name: string;
  phone: string;
  email: string;
  status: LeadStatus;
};

function Leads() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'kanban' | 'chat'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messagesByLeadId, setMessagesByLeadId] = useState<Record<number, LeadMessageRecord[]>>({});
  const [chatSearch, setChatSearch] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormState>({
    name: '',
    phone: '',
    email: '',
    status: 'novo',
  });

  useEffect(() => {
    const carregarLeads = async () => {
      try {
        const response = await listLeads();
        const mappedLeads = response.map(mapLeadFromApi);
        setLeads(mappedLeads);
        setSelectedLead((prev) => mappedLeads.find((lead) => lead.id === prev?.id) ?? mappedLeads[0] ?? null);
      } catch (error) {
        console.error('Erro ao carregar leads:', error);
        showToast({
          tone: 'error',
          title: 'Nao consegui carregar os leads',
          description: 'A lista de leads nao veio da API agora.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void carregarLeads();
  }, [showToast]);

  const carregarMensagens = useCallback(async (leadId: number) => {
    setIsLoadingMessages(true);

    try {
      const response = await listLeadMessages(leadId);
      setMessagesByLeadId((prev) => ({ ...prev, [leadId]: response }));
    } catch (error) {
      console.error('Erro ao carregar mensagens do lead:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui abrir a conversa',
        description: 'As mensagens desse lead nao vieram da API agora.',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab !== 'chat' || !selectedLead?.id) {
      return;
    }

    void carregarMensagens(selectedLead.id);
  }, [activeTab, carregarMensagens, selectedLead?.id]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setActiveTab('chat');
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setLeadForm({
      name: '',
      phone: '',
      email: '',
      status: 'novo',
    });
  };

  const handleCreateLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!leadForm.name.trim()) {
      showToast({
        tone: 'info',
        title: 'Nome obrigatorio',
        description: 'Preencha pelo menos o nome antes de salvar o lead.',
      });
      return;
    }

    setIsSavingLead(true);

    try {
      const savedLead = await createLead({
        name: leadForm.name,
        phone: leadForm.phone || null,
        email: leadForm.email || null,
        status: leadForm.status,
      });

      const mappedLead = mapLeadFromApi(savedLead);
      setLeads((prev) => [mappedLead, ...prev]);
      setSelectedLead(mappedLead);
      setActiveTab('chat');
      closeLeadModal();
      showToast({
        tone: 'success',
        title: 'Lead criado',
        description: `${mappedLead.nome} entrou no funil comercial.`,
      });
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui criar o lead',
        description: 'A API nao confirmou esse cadastro agora.',
      });
    } finally {
      setIsSavingLead(false);
    }
  };

  const handleStatusChange = async (leadId: number, newStatus: LeadStatus) => {
    const previousLead = leads.find((lead) => lead.id === leadId);

    if (!previousLead || previousLead.status === newStatus) {
      return;
    }

    setUpdatingLeadId(leadId);

    try {
      const updated = await updateLead(leadId, { status: newStatus });
      const mappedLead = mapLeadFromApi(updated);

      setLeads((prev) => prev.map((lead) => (lead.id === mappedLead.id ? mappedLead : lead)));
      setSelectedLead((prev) => (prev?.id === mappedLead.id ? mappedLead : prev));
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar o status',
        description: 'A troca de coluna desse lead nao foi confirmada pelo servidor.',
      });
      setLeads((prev) => prev.map((lead) => (lead.id === previousLead.id ? previousLead : lead)));
      setSelectedLead((prev) => (prev?.id === previousLead.id ? previousLead : prev));
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteLead(leadToDelete.id);
      const deletedLeadId = leadToDelete.id;
      const deletedLeadName = leadToDelete.nome;
      const remainingLeads = leads.filter((lead) => lead.id !== deletedLeadId);

      setLeads(remainingLeads);
      setSelectedLead((prev) => {
        if (prev?.id !== deletedLeadId) {
          return prev;
        }

        return remainingLeads[0] ?? null;
      });
      setMessagesByLeadId((prev) => {
        const next = { ...prev };
        delete next[deletedLeadId];
        return next;
      });
      setLeadToDelete(null);
      showToast({
        tone: 'success',
        title: 'Lead excluido',
        description: `${deletedLeadName} saiu do sistema de verdade.`,
      });
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui excluir o lead',
        description: 'O servidor nao confirmou essa exclusao agora.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedLead || !messageDraft.trim()) {
      return;
    }

    setIsSendingMessage(true);

    try {
      const savedMessage = await createLeadMessage(selectedLead.id, {
        sender_type: 'team',
        sender_name: user?.name,
        message: messageDraft.trim(),
      });

      setMessagesByLeadId((prev) => ({
        ...prev,
        [selectedLead.id]: [...(prev[selectedLead.id] ?? []), savedMessage],
      }));
      setMessageDraft('');
      showToast({
        tone: 'success',
        title: 'Mensagem enviada',
        description: `A conversa com ${selectedLead.nome} foi atualizada na API.`,
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui enviar a mensagem',
        description: 'A API nao confirmou essa conversa agora.',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const leadsOrdenados = useMemo(() => leads, [leads]);

  const leadsFiltrados = useMemo(() => {
    if (!chatSearch.trim()) {
      return leadsOrdenados;
    }

    return leadsOrdenados.filter((lead) => lead.nome.toLowerCase().includes(chatSearch.toLowerCase()));
  }, [chatSearch, leadsOrdenados]);

  const mensagensSelecionadas = selectedLead ? messagesByLeadId[selectedLead.id] ?? [] : [];
  const quickReplies = useMemo(() => {
    const leadName = selectedLead?.nome ?? 'cliente';

    return [
      `Oi, ${leadName}! Vi sua mensagem e vou te ajudar agora.`,
      'Posso te passar os detalhes e valores por aqui.',
      'Se preferir, eu separo as melhores opcoes para voce escolher.',
    ];
  }, [selectedLead?.nome]);

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'novo':
        return 'bg-sky-500';
      case 'negociacao':
        return 'bg-blue-500';
      case 'indeciso':
        return 'bg-yellow-500';
      case 'aguardando':
        return 'bg-orange-500';
      case 'concluido':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Gestao de Leads</h2>
          <p className="text-gray-400 text-sm">Kanban real e conversa ligada no backend de mensagens.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsLeadModalOpen(true)}
            className="rounded-full bg-[#00e6e6] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#1a1e23] transition hover:bg-opacity-85"
          >
            Novo lead
          </button>
          <ContextHelp title="Ajuda de leads">
            <p>Lead e uma pessoa que ainda esta em conversa comercial.</p>
            <p>Arrastar no kanban muda o status. Na aba de conversa, as mensagens agora vao para o backend real.</p>
          </ContextHelp>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'kanban' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
          >
            Gerenciar Leads
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'chat' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#00e6e6]' : 'text-gray-400 hover:text-white'}`}
          >
            Conversas
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'kanban' && (
          <div className="absolute inset-0 overflow-x-auto overflow-y-auto">
            {isLoading ? (
              <div className="rounded-2xl border border-gray-800 bg-[#23272d] p-6 text-gray-400">Carregando leads...</div>
            ) : (
              <LeadsKanban
                leads={leads}
                setLeads={setLeads}
                onLeadClick={handleLeadClick}
                onStatusChange={handleStatusChange}
                onDeleteLead={setLeadToDelete}
                isUpdatingLeadId={updatingLeadId}
              />
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="absolute inset-0 flex bg-[#23272d] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="w-80 border-r border-gray-700 flex flex-col bg-[#1a1e23]">
              <div className="p-4 border-b border-gray-700">
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(event) => setChatSearch(event.target.value)}
                  placeholder="Buscar conversa..."
                  className="w-full bg-[#2a3038] text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-[#00e6e6]"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {leadsFiltrados.map((lead) => {
                  const lastMessage = messagesByLeadId[lead.id]?.at(-1);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`flex items-center p-4 border-b border-gray-800 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-[#2a3038]' : 'hover:bg-[#23272d]'}`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                          {lead.nome.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1e23] ${getStatusColor(lead.status)}`}></div>
                      </div>

                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between items-center gap-3">
                          <h4 className="text-white text-sm font-semibold truncate">{lead.nome}</h4>
                          <span className="text-xs text-gray-500">{lastMessage ? formatChatTime(lastMessage.sent_at) : '--:--'}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {lastMessage ? lastMessage.message : 'Sem mensagens ainda'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#23272d]">
              {selectedLead ? (
                <>
                  <div className="h-16 border-b border-gray-700 flex items-center px-6 justify-between bg-[#1a1e23]">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold mr-3">
                        {selectedLead.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{selectedLead.nome}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedLead.status)}`}></span>
                          <span className="text-[10px] text-gray-400 capitalize">{selectedLead.status}</span>
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                            {mensagensSelecionadas.length} mensagens
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLeadToDelete(selectedLead)}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-500/20"
                    >
                      Excluir lead
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoadingMessages ? (
                      <div className="rounded-2xl border border-dashed border-gray-700 bg-[#1a1e23] px-5 py-10 text-center text-gray-500">
                        Carregando conversa...
                      </div>
                    ) : mensagensSelecionadas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-700 bg-[#1a1e23] px-5 py-10 text-center text-gray-500">
                        Ainda nao existe conversa salva para este lead.
                      </div>
                    ) : (
                      mensagensSelecionadas.map((mensagem) => {
                        const isTeam = mensagem.sender_type === 'team';

                        return (
                          <div key={mensagem.id} className={`flex ${isTeam ? 'justify-end' : 'justify-start'}`}>
                            <div className={`${isTeam ? 'bg-[#00e6e6] bg-opacity-20 text-[#00e6e6] rounded-tl-xl rounded-br-xl rounded-bl-xl border border-cyan-500/10' : 'bg-[#2a3038] text-gray-200 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-white/5'} p-3 max-w-[70%] shadow-md`}>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">{mensagem.sender_name}</p>
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] opacity-70">
                                  {isTeam ? 'Equipe' : 'Lead'}
                                </span>
                              </div>
                              <p className="text-sm">{mensagem.message}</p>
                              <span className="text-[10px] opacity-70 block text-right mt-1">{formatDateTimeLabel(mensagem.sent_at)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-4 bg-[#1a1e23] border-t border-gray-700">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => setMessageDraft(reply)}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-cyan-400/40 hover:text-white"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center bg-[#2a3038] rounded-full px-4 py-2">
                      <input
                        type="text"
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void handleSendMessage();
                          }
                        }}
                        placeholder="Digite uma mensagem..."
                        className="flex-1 bg-transparent text-white text-sm outline-none px-2"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSendMessage()}
                        disabled={isSendingMessage || !messageDraft.trim()}
                        className="bg-[#00e6e6] text-[#1a1e23] rounded-full px-4 py-2 ml-2 hover:bg-opacity-80 transition disabled:bg-gray-600 disabled:text-gray-400"
                      >
                        {isSendingMessage ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <p>Selecione um lead ao lado para abrir a conversa.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmActionModal
        isOpen={leadToDelete !== null}
        title="Excluir lead?"
        description={`O lead ${leadToDelete?.nome ?? ''} sera apagado de verdade do sistema. Use isso so quando tiver certeza.`}
        confirmLabel="Excluir de verdade"
        isSubmitting={isSubmitting}
        onCancel={() => setLeadToDelete(null)}
        onConfirm={handleDeleteLead}
      />

      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-700 bg-[#23272d] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 bg-[#1a1e23] px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">Novo lead</h3>
              <button type="button" onClick={closeLeadModal} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={leadForm.name}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={leadForm.phone}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Status inicial</label>
                <select
                  value={leadForm.status}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, status: event.target.value as LeadStatus }))}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                >
                  <option value="novo">Novo</option>
                  <option value="negociacao">Negociacao</option>
                  <option value="indeciso">Indeciso</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="concluido">Concluido</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeLeadModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#00e6e6] px-6 py-2 text-sm font-bold text-[#1a1e23] disabled:bg-gray-700 disabled:text-gray-500"
                  disabled={isSavingLead}
                >
                  {isSavingLead ? 'Salvando...' : 'Salvar lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leads;

function mapLeadFromApi(lead: LeadRecord): Lead {
  return {
    id: lead.id,
    nome: lead.name,
    status: lead.status,
  };
}

function formatChatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
