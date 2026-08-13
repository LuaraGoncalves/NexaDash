import { useEffect, useMemo, useState } from 'react';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ContextHelp from '../components/ContextHelp';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type CustomerRecord,
  type CustomerStatus,
} from '../services/customersApi';

type Cliente = CustomerRecord;

type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: CustomerStatus;
};

const emptyFormState = (): CustomerFormState => ({
  name: '',
  phone: '',
  email: '',
  notes: '',
  status: 'ativo',
});

export default function Customers() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | CustomerStatus>('ativo');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Cliente | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Cliente | null>(null);
  const [formState, setFormState] = useState<CustomerFormState>(emptyFormState);
  const normalizedEmail = formState.email.trim();
  const isEmailValid = !normalizedEmail || isValidEmail(normalizedEmail);
  const formattedPreviewPhone = formatPhone(formState.phone);

  const canInactivateCustomers = user?.role === 'admin';

  useEffect(() => {
    const carregarClientes = async () => {
      try {
        const response = await listCustomers();
        setClientes(response);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast({
          tone: 'error',
          title: 'Nao consegui carregar os clientes',
          description: 'A lista de clientes nao veio da API agora.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void carregarClientes();
  }, [showToast]);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((cliente) => {
      const matchSearch = `${cliente.name} ${cliente.phone ?? ''} ${cliente.email ?? ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || cliente.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clientes, searchTerm, statusFilter]);

  const openModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCustomer(cliente);
      setFormState({
        name: cliente.name,
        phone: cliente.phone ?? '',
        email: cliente.email ?? '',
        notes: cliente.notes ?? '',
        status: cliente.status,
      });
    } else {
      setEditingCustomer(null);
      setFormState(emptyFormState());
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormState(emptyFormState());
  };

  const handleSaveCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim()) {
      showToast({
        tone: 'info',
        title: 'Nome obrigatorio',
        description: 'Preencha pelo menos o nome do cliente antes de salvar.',
      });
      return;
    }

    if (!isEmailValid) {
      showToast({
        tone: 'info',
        title: 'Email com formato invalido',
        description: 'Corrija o email antes de salvar o cliente.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: formState.name,
        phone: formState.phone || null,
        email: normalizedEmail || null,
        notes: formState.notes || null,
        status: formState.status,
      };

      const savedCustomer = editingCustomer
        ? await updateCustomer(editingCustomer.id, payload)
        : await createCustomer(payload);

      setClientes((prev) => {
        if (editingCustomer) {
          return prev.map((cliente) => (cliente.id === savedCustomer.id ? savedCustomer : cliente));
        }

        return [savedCustomer, ...prev];
      });

      closeModal();
      showToast({
        tone: 'success',
        title: editingCustomer ? 'Cliente atualizado' : 'Cliente criado',
        description: editingCustomer
          ? 'Os dados do cliente foram atualizados.'
          : 'O cliente entrou no cadastro com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar o cliente',
        description: 'A API nao confirmou esse cadastro agora.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await deleteCustomer(customerToDelete.id);
      setClientes((prev) => prev.map((cliente) => (cliente.id === response.customer.id ? response.customer : cliente)));
      setCustomerToDelete(null);
      showToast({
        tone: 'success',
        title: 'Cliente inativado',
        description: `${response.customer.name} saiu da operacao normal, mas ficou guardado no historico.`,
      });
    } catch (error) {
      console.error('Erro ao inativar cliente:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui inativar o cliente',
        description: 'A API nao confirmou essa mudanca agora.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Clientes</h2>
          <p className="text-gray-400 text-sm">Cadastro proprio de clientes para vendas e PDV.</p>
        </div>
        <div className="flex items-center gap-3">
          <ContextHelp title="Sobre clientes">
            <p>Cliente e quem compra. Lead e quem ainda esta em conversa comercial.</p>
            <p>Inativar tira da operacao do dia a dia, mas preserva o historico.</p>
          </ContextHelp>
          <button
            onClick={() => openModal()}
            className="rounded-lg bg-[#00e6e6] px-4 py-2 text-sm font-bold text-[#1a1e23] transition hover:bg-opacity-80"
            title="Cadastrar novo cliente"
          >
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-gray-800 bg-[#23272d] p-6 shadow-2xl">
        <div className="mb-6 flex flex-col gap-4 border-b border-gray-700 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, telefone ou email..."
              className="w-full sm:w-80 rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00e6e6]"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'todos' | CustomerStatus)}
              className="rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00e6e6]"
            >
              <option value="todos">Status: Todos</option>
              <option value="ativo">Status: Ativos</option>
              <option value="inativo">Status: Inativos</option>
            </select>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#1a1e23] px-4 py-3">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Ativos</p>
              <p className="mt-1 text-lg font-black text-white">{clientes.filter((cliente) => cliente.status === 'ativo').length}</p>
            </div>
            <div className="h-8 w-px bg-gray-700"></div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Inativos</p>
              <p className="mt-1 text-lg font-black text-white">{clientes.filter((cliente) => cliente.status === 'inativo').length}</p>
            </div>
          </div>
        </div>

        <div className="h-[calc(100%-6rem)] overflow-auto rounded-xl border border-gray-700">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="sticky top-0 bg-[#1a1e23] text-xs uppercase text-gray-300">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Contato</th>
                <th className="px-6 py-4 font-medium">Observacoes</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Carregando clientes...
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="transition-colors hover:bg-[#2a3038]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white">{cliente.name}</p>
                        <p className="mt-1 text-xs text-gray-500">ID {cliente.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{cliente.phone || 'Sem telefone'}</p>
                      <p className="mt-1 text-xs text-gray-500">{cliente.email || 'Sem email'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate text-gray-300" title={cliente.notes ?? ''}>
                        {cliente.notes || 'Sem observacoes'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${cliente.status === 'ativo' ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
                        {cliente.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => openModal(cliente)} className="text-cyan-300 transition hover:text-white" title="Editar cliente">
                          Editar
                        </button>
                        {canInactivateCustomers && cliente.status === 'ativo' && (
                          <button
                            onClick={() => setCustomerToDelete(cliente)}
                            className="text-red-400 transition hover:text-red-300"
                            title="Inativar cliente"
                          >
                            Inativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-[#23272d] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 bg-[#1a1e23] px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">{editingCustomer ? 'Editar cliente' : 'Novo cliente'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-5 p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Nome *</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-400">Telefone</label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(event) => setFormState((prev) => ({ ...prev, phone: formatPhone(event.target.value) }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-400">Email</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                    className={`w-full rounded-lg border bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6] ${isEmailValid ? 'border-gray-700' : 'border-red-500/60'}`}
                    placeholder="cliente@email.com"
                  />
                  {!isEmailValid && <p className="mt-2 text-xs text-red-300">Use um email valido, como nome@empresa.com.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">Prévia do cadastro</p>
                <div className="mt-3 space-y-2">
                  <p className="text-lg font-black text-white">{formState.name.trim() || 'Nome do cliente'}</p>
                  <p className="text-sm text-slate-300">{formattedPreviewPhone || normalizedEmail || 'Sem contato informado ainda'}</p>
                  <p className="text-xs text-slate-400">{formState.notes.trim() || 'Observações e detalhes aparecem aqui para a equipe.'}</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Observacoes</label>
                <textarea
                  rows={4}
                  value={formState.notes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                />
              </div>

              {editingCustomer && canInactivateCustomers && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-400">Status</label>
                  <select
                    value={formState.status}
                    onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value as CustomerStatus }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1e23] px-4 py-3 text-white outline-none focus:border-[#00e6e6]"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
                  Cancelar
                </button>
                <button type="submit" className="rounded-lg bg-[#00e6e6] px-6 py-2 text-sm font-bold text-[#1a1e23] disabled:bg-gray-700 disabled:text-gray-500" disabled={isSaving || !isEmailValid}>
                  {isSaving ? 'Salvando...' : editingCustomer ? 'Salvar alteracoes' : 'Salvar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={customerToDelete !== null}
        title="Inativar cliente?"
        description={`O cliente ${customerToDelete?.name ?? ''} vai sair da operacao normal, mas o historico dele continua guardado.`}
        confirmLabel="Inativar cliente"
        tone="warning"
        isSubmitting={isDeleting}
        onCancel={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteCustomer}
      />
    </div>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
