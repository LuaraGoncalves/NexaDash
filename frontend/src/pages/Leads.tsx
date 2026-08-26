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
  const permissions = user?.permissions ?? {};
  const canEditLeads = user?.role === 'admin' || Boolean(permissions.editar_leads);
  const canDeleteLeads = user?.role === 'admin' || Boolean(permissions.excluir_leads);
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

    const leadId = selectedLead.id;
    const timeoutId = window.setTimeout(() => {
      void carregarMensagens(leadId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
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

    if (!canEditLeads) {
      showToast({
        tone: 'error',
        title: 'Sem permissao para criar lead',
        description: 'Seu cargo pode visualizar leads, mas nao pode criar ou editar.',
      });
      return;
    }

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
    if (!canEditLeads) {
      showToast({
        tone: 'error',
        title: 'Sem permissao para editar lead',
        description: 'A troca de status nao foi enviada porque seu usuario nao tem essa permissao.',
      });
      return;
    }

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

    if (!canDeleteLeads) {
      showToast({
        tone: 'error',
        title: 'Sem permissao para excluir lead',
        description: 'Seu cargo nao pode apagar leads do funil.',
      });
      setLeadToDelete(null);
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

    if (!canEditLeads) {
      showToast({
        tone: 'error',
        title: 'Sem permissao para responder lead',
        description: 'Seu usuario pode visualizar a conversa, mas nao pode enviar mensagens.',
      });
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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] px-5 py-4 shadow-[0_18px_45px_rgba(56,50,43,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-[#20242c]">Gestao de Leads</h2>
          <p className="text-sm text-[#766f66]">Kanban real e conversa ligada no backend de mensagens.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEditLeads && (
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(true)}
              className="rounded-full bg-[#f6d957] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#20242c] transition hover:bg-[#ffe982]"
            >
              Novo lead
            </button>
          )}
          <ContextHelp title="Ajuda de leads">
            <p>Lead e uma pessoa que ainda esta em conversa comercial.</p>
            <p>Arrastar no kanban muda o status. Na aba de conversa, as mensagens agora vao para o backend real.</p>
          </ContextHelp>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'kanban' ? 'bg-[#20242c] text-[#fffdfa]' : 'border border-[#ded6c9] bg-[#f6f1e8] text-[#766f66] hover:text-[#20242c]'}`}
          >
            Gerenciar Leads
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'bg-[#20242c] text-[#fffdfa]' : 'border border-[#ded6c9] bg-[#f6f1e8] text-[#766f66] hover:text-[#20242c]'}`}
          >
            Conversas
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'kanban' && (
          <div className="absolute inset-0 overflow-x-auto overflow-y-auto">
            {isLoading ? (
              <div className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] p-6 text-[#766f66]">Carregando leads...</div>
            ) : (
              <LeadsKanban
                leads={leads}
                setLeads={setLeads}
                onLeadClick={handleLeadClick}
                onStatusChange={handleStatusChange}
                onDeleteLead={canDeleteLeads ? setLeadToDelete : undefined}
                isUpdatingLeadId={updatingLeadId}
                canMoveLeads={canEditLeads}
              />
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="absolute inset-0 flex overflow-hidden rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] shadow-[0_24px_70px_rgba(56,50,43,0.12)]">
            <div className="flex w-80 flex-col border-r border-[#ded6c9] bg-[#f6f1e8]">
              <div className="border-b border-[#ded6c9] p-4">
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(event) => setChatSearch(event.target.value)}
                  placeholder="Buscar conversa..."
                  className="w-full rounded-full border border-[#ded6c9] bg-[#fffdfa] px-4 py-2 text-sm text-[#20242c] outline-none focus:ring-2 focus:ring-[#f6d957]"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {leadsFiltrados.map((lead) => {
                  const lastMessage = messagesByLeadId[lead.id]?.at(-1);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`flex cursor-pointer items-center border-b border-[#eee6da] p-4 transition-colors ${selectedLead?.id === lead.id ? 'bg-[#f6d957]/30' : 'hover:bg-[#fffdfa]'}`}
                    >
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#20242c] font-bold text-[#f6d957]">
                          {lead.nome.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#f6f1e8] ${getStatusColor(lead.status)}`}></div>
                      </div>

                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between items-center gap-3">
                          <h4 className="truncate text-sm font-semibold text-[#20242c]">{lead.nome}</h4>
                          <span className="text-xs text-[#766f66]">{lastMessage ? formatChatTime(lastMessage.sent_at) : '--:--'}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#766f66]">
                          {lastMessage ? lastMessage.message : 'Sem mensagens ainda'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-1 flex-col bg-[#fffdfa]">
              {selectedLead ? (
                <>
                  <div className="flex h-16 items-center justify-between border-b border-[#ded6c9] bg-[#f6f1e8] px-6">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#20242c] font-bold text-[#f6d957]">
                        {selectedLead.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#20242c]">{selectedLead.nome}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedLead.status)}`}></span>
                          <span className="text-[10px] capitalize text-[#766f66]">{selectedLead.status}</span>
                          <span className="rounded-full border border-[#ded6c9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#766f66]">
                            {mensagensSelecionadas.length} mensagens
                          </span>
                        </div>
                      </div>
                    </div>
                    {canDeleteLeads && (
                      <button
                        type="button"
                        onClick={() => setLeadToDelete(selectedLead)}
                        className="rounded-full border border-[#e5c6c6] bg-[#fbefef] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#9f2d2d] transition hover:bg-[#f8dddd]"
                      >
                        Excluir lead
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoadingMessages ? (
                      <div className="rounded-2xl border border-dashed border-[#ded6c9] bg-[#f6f1e8] px-5 py-10 text-center text-[#766f66]">
                        Carregando conversa...
                      </div>
                    ) : mensagensSelecionadas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#ded6c9] bg-[#f6f1e8] px-5 py-10 text-center text-[#766f66]">
                        Ainda nao existe conversa salva para este lead.
                      </div>
                    ) : (
                      mensagensSelecionadas.map((mensagem) => {
                        const isTeam = mensagem.sender_type === 'team';

                        return (
                          <div key={mensagem.id} className={`flex ${isTeam ? 'justify-end' : 'justify-start'}`}>
                            <div className={`${isTeam ? 'rounded-tl-xl rounded-bl-xl rounded-br-xl border border-[#ded6c9] bg-[#f6d957]/30 text-[#20242c]' : 'rounded-tr-xl rounded-bl-xl rounded-br-xl border border-[#ded6c9] bg-[#f6f1e8] text-[#20242c]'} max-w-[70%] p-3 shadow-sm`}>
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

                  <div className="border-t border-[#ded6c9] bg-[#f6f1e8] p-4">
                    {canEditLeads ? (
                      <>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {quickReplies.map((reply) => (
                            <button
                              key={reply}
                              type="button"
                              onClick={() => setMessageDraft(reply)}
                              className="rounded-full border border-[#ded6c9] bg-[#fffdfa] px-3 py-1.5 text-xs font-bold text-[#766f66] hover:border-[#e7ca45] hover:text-[#20242c]"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center rounded-full border border-[#ded6c9] bg-[#fffdfa] px-4 py-2">
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
                            className="flex-1 bg-transparent px-2 text-sm text-[#20242c] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSendMessage()}
                            disabled={isSendingMessage || !messageDraft.trim()}
                            className="ml-2 rounded-full bg-[#20242c] px-4 py-2 text-[#fffdfa] transition hover:bg-[#171a20] disabled:bg-[#ded6c9] disabled:text-[#766f66]"
                          >
                            {isSendingMessage ? 'Enviando...' : 'Enviar'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-4 py-3 text-sm text-[#766f66]">
                        Voce pode acompanhar a conversa, mas nao tem permissao para responder ou mudar status.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-[#766f66]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20242c]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] shadow-[0_24px_70px_rgba(56,50,43,0.22)]">
            <div className="flex items-center justify-between rounded-t-[2rem] border-b border-[#ded6c9] bg-[#f6f1e8] px-6 py-4">
              <h3 className="text-lg font-bold text-[#20242c]">Novo lead</h3>
              <button type="button" onClick={closeLeadModal} className="text-[#766f66] hover:text-[#20242c]">
                x
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#766f66]">Nome *</label>
                <input
                  type="text"
                  value={leadForm.name}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 text-[#20242c] outline-none focus:border-[#f6d957]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#766f66]">Telefone</label>
                  <input
                    type="text"
                    value={leadForm.phone}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 text-[#20242c] outline-none focus:border-[#f6d957]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#766f66]">Email</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 text-[#20242c] outline-none focus:border-[#f6d957]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#766f66]">Status inicial</label>
                <select
                  value={leadForm.status}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, status: event.target.value as LeadStatus }))}
                  className="w-full rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 text-[#20242c] outline-none focus:border-[#f6d957]"
                >
                  <option value="novo">Novo</option>
                  <option value="negociacao">Negociacao</option>
                  <option value="indeciso">Indeciso</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="concluido">Concluido</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeLeadModal} className="px-4 py-2 text-sm font-bold text-[#766f66] hover:text-[#20242c]">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#f6d957] px-6 py-2 text-sm font-bold text-[#20242c] disabled:bg-[#ded6c9] disabled:text-[#766f66]"
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
