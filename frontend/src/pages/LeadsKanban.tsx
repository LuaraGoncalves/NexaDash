import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import type { Dispatch, SetStateAction } from 'react';

export type Lead = {
  id: number;
  nome: string;
  status: "novo" | "negociacao" | "indeciso" | "aguardando" | "concluido";
};

type LeadsKanbanProps = {
  leads?: Lead[];
  setLeads?: Dispatch<SetStateAction<Lead[]>>;
  onLeadClick?: (lead: Lead) => void;
};

export default function LeadsKanban({ leads, setLeads, onLeadClick }: LeadsKanbanProps) {
  const [internalLeads, setInternalLeads] = useState<Lead[]>([
    { id: 1, nome: "Maria", status: "novo" },
    { id: 2, nome: "João", status: "negociacao" },
    { id: 3, nome: "Pedro", status: "indeciso" },
    { id: 4, nome: "Ana", status: "aguardando" },
  ]);

  const currentLeads = leads ?? internalLeads;
  const updateLeads = setLeads ?? setInternalLeads;
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
                              <span>{lead.nome}</span>
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
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
