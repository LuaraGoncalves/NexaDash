import type {
  InventoryMovementRecord,
  InventoryMovementType,
  ProductCategoryRecord,
  ProductRecord,
  ProductStatus,
  SupplierRecord,
  UnitRecord,
} from '../../services/productsApi';
import { toDatetimeLocal } from '../../utils/formatters';

export type Categoria = ProductCategoryRecord;
export type Fornecedor = SupplierRecord;
export type Unidade = UnitRecord;
export type Produto = ProductRecord;
export type Movimentacao = InventoryMovementRecord;

export type PendingProductAction =
  | { kind: 'product'; id: number; label: string }
  | { kind: 'product-reactivate'; id: number; label: string }
  | { kind: 'movement'; id: number; label: string }
  | { kind: 'category'; id: number; label: string }
  | { kind: 'supplier'; id: number; label: string }
  | { kind: 'supplier-reactivate'; id: number; label: string }
  | { kind: 'unit'; id: number; label: string };

export type ProductFormState = {
  sku: string;
  nome: string;
  descricao: string;
  preco_custo: string;
  preco_venda: string;
  quantidade: string;
  estoque_minimo: string;
  status: ProductStatus;
  id_categoria: string;
  id_fornecedor: string;
  id_unidade: string;
  foto_url: string;
};

export type MovementFormState = {
  id_produto: string;
  tipo: InventoryMovementType;
  quantidade: string;
  data_hora: string;
  motivo: string;
  responsavel: string;
};

export type CategoryFormState = {
  nome: string;
  descricao: string;
};

export type SupplierFormState = {
  nome: string;
  cnpj_cpf: string;
  contato: string;
  status: ProductStatus;
};

export type UnitFormState = {
  sigla: string;
  nome: string;
};

export const emptyProductForm = (): ProductFormState => ({
  sku: '',
  nome: '',
  descricao: '',
  preco_custo: '',
  preco_venda: '',
  quantidade: '0',
  estoque_minimo: '0',
  status: 'ativo',
  id_categoria: '',
  id_fornecedor: '',
  id_unidade: '',
  foto_url: '',
});

export const emptyMovementForm = (): MovementFormState => ({
  id_produto: '',
  tipo: 'entrada',
  quantidade: '1',
  data_hora: toDatetimeLocal(new Date().toISOString()),
  motivo: '',
  responsavel: '',
});

export const emptyCategoryForm = (): CategoryFormState => ({
  nome: '',
  descricao: '',
});

export const emptySupplierForm = (): SupplierFormState => ({
  nome: '',
  cnpj_cpf: '',
  contato: '',
  status: 'ativo',
});

export const emptyUnitForm = (): UnitFormState => ({
  sigla: '',
  nome: '',
});

export function getCategoriaNome(categorias: Categoria[], id: number) {
  return categorias.find((categoria) => categoria.id === id)?.nome || 'Sem categoria';
}

export function getFornecedorNome(fornecedores: Fornecedor[], id: number | null) {
  return fornecedores.find((fornecedor) => fornecedor.id === id)?.nome || 'Sem fornecedor';
}

export function getUnidadeSigla(unidades: Unidade[], id: number) {
  return unidades.find((unidade) => unidade.id === id)?.sigla || 'UN';
}

export function getPendingActionTitle(action: PendingProductAction | null): string {
  if (!action) {
    return '';
  }

  if (action.kind === 'product' || action.kind === 'supplier') {
    return 'Confirmar inativacao?';
  }

  if (action.kind === 'product-reactivate' || action.kind === 'supplier-reactivate') {
    return 'Confirmar reativacao?';
  }

  return 'Confirmar exclusao?';
}

export function getPendingActionDescription(action: PendingProductAction | null): string {
  if (!action) {
    return '';
  }

  if (action.kind === 'product') {
    return `O produto ${action.label} vai ficar inativo. Ele nao some do historico, so deixa de ficar disponivel normalmente.`;
  }

  if (action.kind === 'product-reactivate') {
    return `O produto ${action.label} vai voltar a ficar ativo e disponivel no sistema.`;
  }

  if (action.kind === 'supplier') {
    return `O fornecedor ${action.label} vai ficar inativo. O historico continua guardado.`;
  }

  if (action.kind === 'supplier-reactivate') {
    return `O fornecedor ${action.label} vai voltar a ficar ativo no cadastro.`;
  }

  if (action.kind === 'movement') {
    return `A movimentacao ${action.label} sera apagada de verdade e o estoque sera recalculado.`;
  }

  return `${action.label} sera excluido de verdade do cadastro.`;
}

export function getPendingActionButtonLabel(action: PendingProductAction | null): string {
  if (!action) {
    return '';
  }

  if (action.kind === 'product' || action.kind === 'supplier') {
    return 'Inativar agora';
  }

  if (action.kind === 'product-reactivate' || action.kind === 'supplier-reactivate') {
    return 'Reativar agora';
  }

  return 'Excluir agora';
}
