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
    <div className="h-full overflow-auto bg-[#f3f4f6] text-slate-900">
      <div className="mx-auto flex min-h-full max-w-[1800px] flex-col gap-5 p-4 md:p-6">
        <div className="flex justify-end">
          <ContextHelp title="Ajuda da fila rapida">
            <p>Essa tela foi pensada para responder sem se perder: fila, status e conversa no mesmo lugar.</p>
            <p>As mensagens agora sao reais e ficam salvas no backend.</p>
          </ContextHelp>
        </div>

        <div className="grid flex-1 gap-5 xl:grid-cols-[0.95fr_1.3fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Fila</p>
                <h2 className="text-2xl font-black">Leads para atender</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['todos', 'novo', 'negociacao'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`rounded-full px-4 py-2 text-sm font-black ${filter === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {item === 'todos' ? 'Todos' : item === 'novo' ? 'Novos' : 'Negociacao'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <div className="rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-500">
                  Carregando leads reais...
                </div>
              ) : leadsFiltrados.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full rounded-[1.75rem] border-2 px-4 py-4 text-left transition ${selectedLeadId === lead.id ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black">{lead.nome}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {messagesByLeadId[lead.id]?.at(-1)?.message ?? 'Toque para abrir a conversa'}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-2 text-xs font-black ${statusClasses[lead.status]}`}>
                      {statusLabel[lead.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-[#0f172a] p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.15)] md:p-6">
            {selectedLead ? (
              <div className="flex h-full flex-col">
                <div className="rounded-[1.75rem] bg-white/5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Conversa aberta</p>
                      <h2 className="mt-2 text-3xl font-black">{selectedLead.nome}</h2>
                      <p className="mt-2 text-sm text-slate-300">Fila simples para responder rapido, mas agora gravando mensagens reais.</p>
                    </div>

                    <span className={`rounded-full px-4 py-2 text-sm font-black ${statusClasses[selectedLead.status]}`}>
                      {statusLabel[selectedLead.status]}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <button onClick={() => atualizarStatus('negociacao')} className="rounded-[1.5rem] bg-[#1d4ed8] px-4 py-5 text-lg font-black text-white">
                    Em negociacao
                  </button>
                  <button onClick={() => atualizarStatus('aguardando')} className="rounded-[1.5rem] bg-[#ea580c] px-4 py-5 text-lg font-black text-white">
                    Aguardando
                  </button>
                  <button onClick={() => atualizarStatus('concluido')} className="rounded-[1.5rem] bg-[#16a34a] px-4 py-5 text-lg font-black text-white">
                    Concluido
                  </button>
                </div>

                <div className="mt-5 flex-1 rounded-[1.75rem] bg-white/5 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Mensagens</p>

                  {isLoadingMessages ? (
                    <div className="mt-4 rounded-[1.5rem] bg-white/5 px-4 py-8 text-center text-slate-400">
                      Carregando conversa...
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="mt-4 rounded-[1.5rem] bg-white/5 px-4 py-8 text-center text-slate-400">
                      Nenhuma mensagem registrada ainda para esse lead.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {mensagens.map((mensagem) => {
                        const isTeam = mensagem.sender_type === 'team';

                        return (
                          <div key={mensagem.id} className={isTeam ? 'flex justify-end' : 'flex justify-start'}>
                            <div className={`${isTeam ? 'bg-cyan-400 text-slate-950 rounded-[1.5rem] rounded-tr-sm' : 'bg-white/10 text-slate-100 rounded-[1.5rem] rounded-tl-sm'} max-w-[75%] px-4 py-3 text-sm`}>
                              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] opacity-70">{mensagem.sender_name}</p>
                              <p>{mensagem.message}</p>
                              <p className="mt-2 text-[10px] opacity-70">{formatDateTime(mensagem.sent_at)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {quickReplies.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => setMessage(reply)}
                        className="rounded-[1.25rem] bg-white/10 px-4 py-3 text-left text-sm font-bold text-slate-100 hover:bg-white/15"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-[1.75rem] bg-white p-4 text-slate-900">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Resposta</p>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Digite a resposta para a cliente"
                    className="mt-3 min-h-[140px] w-full resize-none rounded-[1.5rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 text-base outline-none focus:border-[#06b6d4]"
                  />
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void enviarMensagem()}
                      disabled={isSendingMessage || !message.trim()}
                      className="flex-1 rounded-[1.5rem] bg-slate-900 px-5 py-4 text-lg font-black text-white disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      {isSendingMessage ? 'Enviando...' : 'Enviar resposta'}
                    </button>
                    <button onClick={() => atualizarStatus('novo')} className="rounded-[1.5rem] bg-slate-100 px-5 py-4 text-base font-black text-slate-700">
                      Voltar para novo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.75rem] bg-white/5 text-center text-slate-300">
                Selecione um lead para conversar.
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
