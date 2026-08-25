import { useCallback, useEffect, useMemo, useState } from 'react';
import ContextHelp from '../components/ContextHelp';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import {
  createLeadMessage,
  listLeadMessages,
  listLeads,
  updateLead,
  type LeadMessageRecord,
  type LeadRecord,
} from '../services/leadsApi';
import type { Lead } from './LeadsKanban';

const quickReplies = [
  'Oi! Ja vou te responder.',
  'Posso te passar os valores agora.',
  'Se quiser, separo o produto para voce.',
  'Consigo te atender hoje ainda.',
];

const statusLabel: Record<Lead['status'], string> = {
  novo: 'Novo',
  negociacao: 'Negociacao',
  indeciso: 'Indeciso',
  aguardando: 'Aguardando',
  concluido: 'Concluido',
};

const statusClasses: Record<Lead['status'], string> = {
  novo: 'bg-sky-100 text-sky-700',
  negociacao: 'bg-blue-100 text-blue-700',
  indeciso: 'bg-yellow-100 text-yellow-700',
  aguardando: 'bg-orange-100 text-orange-700',
  concluido: 'bg-green-100 text-green-700',
};

export default function EmployeeLeads() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const permissions = user?.permissions ?? {};
  const canEditLeads = user?.role === 'admin' || Boolean(permissions.editar_leads);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messagesByLeadId, setMessagesByLeadId] = useState<Record<number, LeadMessageRecord[]>>({});
  const [selectedLeadId, setSelectedLeadId] = useState<number>(0);
  const [filter, setFilter] = useState<'todos' | Lead['status']>('todos');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const carregarLeads = async () => {
      try {
        const response = await listLeads();
        const mapped = response.map(mapLeadFromApi);
        setLeads(mapped);
        setSelectedLeadId(mapped[0]?.id ?? 0);
      } catch (error) {
        console.error('Erro ao carregar fila de leads:', error);
        showToast({
          tone: 'error',
          title: 'Nao consegui carregar a fila',
          description: 'Os leads reais nao vieram da API agora.',
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
      console.error('Erro ao carregar mensagens da fila rapida:', error);
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
    if (!selectedLeadId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void carregarMensagens(selectedLeadId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregarMensagens, selectedLeadId]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const mensagens = selectedLead ? messagesByLeadId[selectedLead.id] ?? [] : [];

  const leadsFiltrados = useMemo(() => {
    if (filter === 'todos') {
      return leads;
    }

    return leads.filter((lead) => lead.status === filter);
  }, [filter, leads]);

  const atualizarStatus = async (status: Lead['status']) => {
    if (!selectedLead) {
      return;
    }

    if (!canEditLeads) {
      showToast({
        tone: 'error',
        title: 'Sem permissao para editar lead',
        description: 'Seu cargo pode visualizar leads, mas nao pode mudar status.',
      });
      return;
    }

    const previousLead = selectedLead;
    setLeads((prev) => prev.map((lead) => (lead.id === selectedLead.id ? { ...lead, status } : lead)));

    try {
      const response = await updateLead(selectedLead.id, { status });
      const mapped = mapLeadFromApi(response);
      setLeads((prev) => prev.map((lead) => (lead.id === mapped.id ? mapped : lead)));
      showToast({
        tone: 'success',
        title: 'Status atualizado',
        description: `${mapped.nome} agora esta em ${statusLabel[mapped.status]}.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status do lead:', error);
      setLeads((prev) => prev.map((lead) => (lead.id === previousLead.id ? previousLead : lead)));
      showToast({
        tone: 'error',
        title: 'Nao consegui atualizar o status',
        description: 'A API nao confirmou essa mudanca agora.',
      });
    }
  };

  const enviarMensagem = async () => {
    if (!selectedLead || !message.trim()) {
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
        message: message.trim(),
      });

      setMessagesByLeadId((prev) => ({
        ...prev,
        [selectedLead.id]: [...(prev[selectedLead.id] ?? []), savedMessage],
      }));
      setMessage('');
      showToast({
        tone: 'success',
        title: 'Resposta enviada',
        description: `A conversa com ${selectedLead.nome} foi salva no sistema.`,
      });
    } catch (error) {
      console.error('Erro ao enviar resposta rapida:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui enviar a resposta',
        description: 'A API nao confirmou essa mensagem agora.',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-[#f6f1e8] text-[#20242c]">
      <div className="mx-auto flex min-h-full max-w-[1680px] flex-col gap-4 p-4 md:p-5">
        <section className="rounded-[2rem] bg-[#fffdfa] px-5 py-4 shadow-[0_18px_45px_rgba(56,50,43,0.10)] ring-1 ring-[#ded6c9]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Leads do caixa</h2>
              <p className="mt-1 text-sm text-[#766f66]">Escolha uma pessoa, responda e atualize o status.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-[#f6d957]/35 px-3 py-2 text-sm font-medium text-[#9a5b17]">
                {leads.length} leads
              </span>
              <ContextHelp title="Ajuda rápida">
                <p>A fila mostra quem precisa de resposta. Ao escolher um lead, a conversa abre ao lado.</p>
                <p>As mensagens e mudanças de status são salvas na API.</p>
              </ContextHelp>
            </div>
          </div>
        </section>

        <div className="grid flex-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[2rem] bg-[#fffdfa] p-5 shadow-[0_18px_45px_rgba(56,50,43,0.10)] ring-1 ring-[#ded6c9]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">Fila</h3>
                <p className="mt-1 text-sm text-[#766f66]">{leadsFiltrados.length} para mostrar</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(['todos', 'novo', 'negociacao', 'aguardando'] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    filter === item
                      ? 'bg-[#20242c] text-[#fffdfa]'
                      : 'border border-[#ded6c9] bg-[#f6f1e8] text-[#766f66] hover:bg-[#fffdfa] hover:text-[#20242c]'
                  }`}
                >
                  {item === 'todos' ? 'Todos' : statusLabel[item]}
                </button>
              ))}
            </div>

            <div className="mt-5 max-h-[calc(100vh-310px)] min-h-[260px] space-y-3 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] bg-[#f6f1e8] px-5 text-center text-sm text-[#766f66]">
                  Carregando leads...
                </div>
              ) : leadsFiltrados.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] bg-[#f6f1e8] px-5 text-center text-sm text-[#766f66]">
                  Nenhum lead neste filtro.
                </div>
              ) : (
                leadsFiltrados.map((lead) => (
                  <button
                    type="button"
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`w-full rounded-xl p-4 text-left ring-1 transition ${
                      selectedLeadId === lead.id
                        ? 'bg-[#f6d957]/30 ring-[#e7ca45]'
                        : 'bg-[#f6f1e8] ring-[#eee6da] hover:bg-[#fffdfa] hover:ring-[#c9beaf]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#20242c]">{lead.nome}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-[#766f66]">
                          {messagesByLeadId[lead.id]?.at(-1)?.message ?? 'Abrir conversa'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${statusClasses[lead.status]}`}>
                        {statusLabel[lead.status]}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-[#fffdfa] p-5 shadow-[0_18px_45px_rgba(56,50,43,0.10)] ring-1 ring-[#ded6c9]">
            {selectedLead ? (
              <div className="flex min-h-[620px] flex-col">
                <div className="flex flex-col gap-4 border-b border-[#eee6da] pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">{selectedLead.nome}</h3>
                    <p className="mt-1 text-sm text-[#766f66]">{mensagens.length} mensagens salvas</p>
                  </div>
                  <span className={`w-fit rounded-lg px-3 py-2 text-sm font-semibold ${statusClasses[selectedLead.status]}`}>
                    {statusLabel[selectedLead.status]}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-[#20242c]">Status do atendimento</p>
                  {canEditLeads ? (
                    <>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => atualizarStatus('negociacao')}
                          className="min-h-12 rounded-xl bg-[#20242c] px-3 text-sm font-semibold text-[#fffdfa] transition hover:bg-[#171a20]"
                        >
                          Em conversa
                        </button>
                        <button
                          type="button"
                          onClick={() => atualizarStatus('aguardando')}
                          className="min-h-12 rounded-xl border border-[#dcc27b] bg-[#fff6dc] px-3 text-sm font-semibold text-[#5b4211] transition hover:bg-[#ffefbd]"
                        >
                          Aguardando
                        </button>
                        <button
                          type="button"
                          onClick={() => atualizarStatus('concluido')}
                          className="min-h-12 rounded-xl bg-[#f97316] px-3 text-sm font-semibold text-white transition hover:bg-[#ea6a0a]"
                        >
                          Concluído
                        </button>
                      </div>
                      <details className="mt-2 rounded-[1.25rem] bg-[#f6f1e8] px-4 py-3">
                        <summary className="cursor-pointer text-sm font-medium text-[#766f66]">
                          Outros status
                        </summary>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => atualizarStatus('novo')}
                            className="rounded-xl border border-[#ded6c9] bg-[#fffdfa] px-3 py-2 text-sm font-medium text-[#20242c]"
                          >
                            Novo
                          </button>
                          <button
                            type="button"
                            onClick={() => atualizarStatus('indeciso')}
                            className="rounded-xl border border-[#dcc27b] bg-[#fffdfa] px-3 py-2 text-sm font-medium text-[#5b4211]"
                          >
                            Indeciso
                          </button>
                        </div>
                      </details>
                    </>
                  ) : (
                    <div className="mt-2 rounded-[1.25rem] border border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 text-sm text-[#766f66]">
                      Voce pode acompanhar o lead, mas nao tem permissao para mudar status.
                    </div>
                  )}
                </div>

                <div className="mt-5 flex-1 rounded-[1.5rem] bg-[#f6f1e8] p-4">
                  {isLoadingMessages ? (
                    <div className="flex min-h-[260px] items-center justify-center rounded-xl bg-[#fffdfa] text-center text-sm text-[#766f66]">
                      Carregando conversa...
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center rounded-xl bg-[#fffdfa] px-5 text-center text-sm text-[#766f66]">
                      Nenhuma mensagem registrada ainda.
                    </div>
                  ) : (
                    <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
                      {mensagens.map((mensagem) => {
                        const isTeam = mensagem.sender_type === 'team';

                        return (
                          <div key={mensagem.id} className={isTeam ? 'flex justify-end' : 'flex justify-start'}>
                            <div
                              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                                isTeam
                                  ? 'bg-[#20242c] text-[#fffdfa]'
                                  : 'bg-[#fffdfa] text-[#20242c] ring-1 ring-[#eee6da]'
                              }`}
                            >
                              <p className={isTeam ? 'text-xs font-medium text-[#e9e3d9]' : 'text-xs font-medium text-[#766f66]'}>
                                {mensagem.sender_name}
                              </p>
                              <p className="mt-1 leading-relaxed">{mensagem.message}</p>
                              <p className={isTeam ? 'mt-2 text-xs text-[#e9e3d9]' : 'mt-2 text-xs text-[#766f66]'}>
                                {formatDateTime(mensagem.sent_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {canEditLeads ? (
                  <div className="mt-5 rounded-[1.5rem] bg-[#20242c] p-4 text-[#fffdfa]">
                    <p className="text-sm font-medium text-[#e9e3d9]">Resposta</p>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Digite a resposta para a cliente"
                      className="mt-3 min-h-[108px] w-full resize-none rounded-xl border border-[#565045] bg-[#fffdfa] px-4 py-3 text-base text-[#20242c] outline-none transition focus:border-[#f6d957]"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickReplies.map((reply) => (
                        <button
                          type="button"
                          key={reply}
                          onClick={() => setMessage(reply)}
                          className="rounded-xl bg-[#343944] px-3 py-2 text-left text-sm font-medium text-[#e9e3d9] transition hover:bg-[#454b58]"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => void enviarMensagem()}
                        disabled={isSendingMessage || !message.trim()}
                        className="flex-1 rounded-xl bg-[#f6d957] px-5 py-4 text-lg font-semibold text-[#20242c] transition hover:bg-[#ffe982] disabled:cursor-not-allowed disabled:bg-[#565045] disabled:text-[#c9beaf]"
                      >
                        {isSendingMessage ? 'Enviando...' : 'Enviar resposta'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.5rem] border border-[#ded6c9] bg-[#f6f1e8] p-4 text-sm text-[#766f66]">
                    Voce pode ler a conversa, mas seu cargo nao pode enviar respostas.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[620px] items-center justify-center rounded-[1.5rem] bg-[#f6f1e8] px-5 text-center text-[#766f66]">
                Selecione um lead na fila para abrir a conversa.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function mapLeadFromApi(lead: LeadRecord): Lead {
  return {
    id: lead.id,
    nome: lead.name,
    status: lead.status,
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
