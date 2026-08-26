import type {
  FinancialCategoryRecord,
  FinancialCategoryType,
  FinancialTransactionRecord,
  FinancialTransactionStatus,
  FinancialTransactionType,
} from '../../services/financeApi';
import { todayDate } from '../../utils/formatters';

export type TipoTransacao = FinancialTransactionType;
export type StatusTransacao = FinancialTransactionStatus;
export type TipoCategoria = FinancialCategoryType;
export type FormaPagamento =
  | 'PIX'
  | 'Dinheiro'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Boleto'
  | 'Transferência';

export type CategoriaFinanceira = FinancialCategoryRecord;
export type Transacao = FinancialTransactionRecord & {
  forma_pagamento: FormaPagamento;
  tipo: TipoTransacao;
  status: StatusTransacao;
  data_pagamento?: string;
};

export type PendingFinanceAction =
  | { kind: 'transaction'; id: number; label: string }
  | { kind: 'category'; id: number; label: string };

export type TransactionFormState = {
  tipo: TipoTransacao;
  descricao: string;
  valor: string;
  data_vencimento: string;
  data_pagamento: string;
  id_categoria: string;
  forma_pagamento: FormaPagamento;
  status: Exclude<StatusTransacao, 'Cancelado'>;
  protocolo_venda: string;
  observacoes: string;
};

export type CategoryFormState = {
  nome: string;
  tipo: TipoCategoria;
  cor: string;
};

export const paymentOptions: FormaPagamento[] = [
  'PIX',
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Transferência',
];

export const colorOptions = [
  { value: 'bg-green-500', label: 'Verde' },
  { value: 'bg-red-500', label: 'Vermelho' },
  { value: 'bg-yellow-500', label: 'Amarelo' },
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-violet-500', label: 'Violeta' },
  { value: 'bg-cyan-500', label: 'Ciano' },
  { value: 'bg-pink-500', label: 'Rosa' },
  { value: 'bg-orange-500', label: 'Laranja' },
  { value: 'bg-gray-500', label: 'Cinza' },
];

export const emptyTransactionForm = (tipo: TipoTransacao): TransactionFormState => ({
  tipo,
  descricao: '',
  valor: '',
  data_vencimento: todayDate(),
  data_pagamento: '',
  id_categoria: '',
  forma_pagamento: 'PIX',
  status: 'Pendente',
  protocolo_venda: '',
  observacoes: '',
});

export const emptyCategoryForm = (): CategoryFormState => ({
  nome: '',
  tipo: 'receita',
  cor: 'bg-green-500',
});

export function mapTransaction(transaction: FinancialTransactionRecord): Transacao {
  return {
    ...transaction,
    tipo: transaction.tipo as TipoTransacao,
    status: transaction.status as StatusTransacao,
    forma_pagamento: transaction.forma_pagamento as FormaPagamento,
    data_pagamento: transaction.data_pagamento ?? undefined,
  };
}
