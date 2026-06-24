import { useState } from 'react';
import LeadsKanban from './LeadsKanban';
import type { Lead } from './LeadsKanban';

function Leads() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'chat'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [leads, setLeads] = useState<Lead[]>([
    { id: 1, nome: "Maria", status: "indecisa" },
    { id: 2, nome: "João", status: "negociacao" },
    { id: 3, nome: "Pedro", status: "espera" },
    { id: 4, nome: "Ana", status: "concluida" },
  ]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setActiveTab('chat');
  };

  const getStatusColor = (status: Lead['status']) => {
    switch(status) {
      case 'indecisa': return 'bg-yellow-500';
      case 'negociacao': return 'bg-blue-500';
      case 'espera': return 'bg-orange-500';
      case 'concluida': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Top Header & Tabs */}
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Gestão de Leads</h2>
          <p className="text-gray-400 text-sm">Acompanhe e converse com seus potenciais clientes.</p>
        </div>
        <div className="flex space-x-2">
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
             Chat Geral
           </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Kanban View */}
        {activeTab === 'kanban' && (
          <div className="absolute inset-0 overflow-x-auto overflow-y-auto">
            <LeadsKanban leads={leads} setLeads={setLeads} onLeadClick={handleLeadClick} />
          </div>
        )}

        {/* Chat Geral View */}
        {activeTab === 'chat' && (
          <div className="absolute inset-0 flex bg-[#23272d] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            
            {/* Sidebar Chat List */}
            <div className="w-80 border-r border-gray-700 flex flex-col bg-[#1a1e23]">
               <div className="p-4 border-b border-gray-700">
                  <input type="text" placeholder="Buscar conversa..." className="w-full bg-[#2a3038] text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-[#00e6e6]" />
               </div>
               <div className="flex-1 overflow-y-auto">
                 {leads.map(lead => (
                   <div 
                     key={lead.id} 
                     onClick={() => setSelectedLead(lead)}
                     className={`flex items-center p-4 border-b border-gray-800 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-[#2a3038]' : 'hover:bg-[#23272d]'}`}
                   >
                     {/* Avatar placeholder with Status Dot */}
                     <div className="relative">
                       <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                         {lead.nome.charAt(0)}
                       </div>
                       <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1e23] ${getStatusColor(lead.status)}`}></div>
                     </div>
                     
                     <div className="ml-3 flex-1 overflow-hidden">
                       <div className="flex justify-between items-center">
                         <h4 className="text-white text-sm font-semibold truncate">{lead.nome}</h4>
                         <span className="text-xs text-gray-500">10:42</span>
                       </div>
                       <p className="text-xs text-gray-400 truncate mt-0.5">Clique para ver as mensagens...</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 flex flex-col bg-[#23272d]">
              {selectedLead ? (
                <>
                  {/* Chat Header */}
                  <div className="h-16 border-b border-gray-700 flex items-center px-6 justify-between bg-[#1a1e23]">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold mr-3">
                        {selectedLead.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{selectedLead.nome}</h3>
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedLead.status)}`}></span>
                          <span className="text-[10px] text-gray-400 capitalize">{selectedLead.status}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex justify-center mb-6">
                       <span className="text-xs text-gray-500 bg-[#1a1e23] px-3 py-1 rounded-full">Hoje</span>
                    </div>
                    
                    {/* Fake Msg Received */}
                    <div className="flex">
                      <div className="bg-[#2a3038] text-gray-200 rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 max-w-[70%] shadow-md">
                        <p className="text-sm">Olá, gostaria de saber mais informações sobre os produtos de vocês.</p>
                        <span className="text-[10px] text-gray-500 block text-right mt-1">10:40</span>
                      </div>
                    </div>

                    {/* Fake Msg Sent */}
                    <div className="flex justify-end">
                      <div className="bg-[#00e6e6] bg-opacity-20 text-[#00e6e6] rounded-tl-xl rounded-br-xl rounded-bl-xl p-3 max-w-[70%] shadow-md">
                        <p className="text-sm">Claro, {selectedLead.nome}! Como posso ajudar hoje?</p>
                        <span className="text-[10px] opacity-70 block text-right mt-1">10:42</span>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-[#1a1e23] border-t border-gray-700">
                    <div className="flex items-center bg-[#2a3038] rounded-full px-4 py-2">
                      <button className="text-gray-400 hover:text-white mr-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      </button>
                      <input type="text" placeholder="Digite uma mensagem..." className="flex-1 bg-transparent text-white text-sm outline-none px-2" />
                      <button className="bg-[#00e6e6] text-[#1a1e23] rounded-full p-2 ml-2 hover:bg-opacity-80 transition">
                         <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 mb-4 opacity-20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p>Selecione um lead ao lado para iniciar a conversa</p>
                </div>
              )}
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}

export default Leads;
