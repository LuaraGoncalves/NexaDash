import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import type { Dispatch, SetStateAction } from 'react';

export type Lead = {
  id: number;
  nome: string;
  status: "novo" | "negociacao" | "indeciso" | "aguardando" | "concluido";
};

type LeadsKanbanProps = {
  leads: Lead[];
  setLeads: Dispatch<SetStateAction<Lead[]>>;
  onLeadClick?: (lead: Lead) => void;
  onStatusChange?: (leadId: number, newStatus: Lead['status']) => Promise<void> | void;
  onDeleteLead?: (lead: Lead) => void;
  isUpdatingLeadId?: number | null;
};

export default function LeadsKanban({
  leads,
  setLeads,
  onLeadClick,
  onStatusChange,
  onDeleteLead,
  isUpdatingLeadId = null,
}: LeadsKanbanProps) {
  const currentLeads = leads;
  const updateLeads = setLeads;
  const handleLeadClick = onLeadClick ?? (() => undefined);

  const colunas: { key: Lead["status"]; titulo: string }[] = [
    { key: "novo", titulo: "Novo" },
    { key: "negociacao", titulo: "Negociação" },
    { key: "indeciso", titulo: "Indeciso" },
    { key: "aguardando", titulo: "Aguardando" },
    { key: "concluido", titulo: "Concluído" },
  ];

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Lead["status"];

    updateLeads((prev) =>
      prev.map((lead) =>
        lead.id.toString() === draggableId
          ? { ...lead, status: newStatus }
          : lead
      )
    );

    if (onStatusChange) {
      void onStatusChange(Number(draggableId), newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 p-6">
        {colunas.map((coluna) => (
          <Droppable key={coluna.key} droppableId={coluna.key}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-[#23272d] rounded-xl p-4 w-64 min-h-[500px]"
              >
                <h2 className="text-white font-bold mb-4">{coluna.titulo}</h2>

                <div className="space-y-3 h-full">
                  {currentLeads
                    .filter((lead) => lead.status === coluna.key)
                    .map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleLeadClick(lead)}
                            className="bg-[#1a1e23] p-3 rounded-lg text-sm text-white shadow cursor-grab active:cursor-grabbing hover:bg-[#2a3038] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span>{lead.nome}</span>
                                {isUpdatingLeadId === lead.id && (
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                                    Salvando...
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
                                {onDeleteLead && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onDeleteLead(lead);
                                    }}
                                    className="text-red-400 transition hover:text-red-300"
                                    title="Excluir lead"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      <line x1="10" y1="11" x2="10" y2="17" />
                                      <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
