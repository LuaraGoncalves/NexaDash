import { apiRequest } from './apiClient';

export type ProductStatus = 'ativo' | 'inativo';
export type InventoryMovementType = 'entrada' | 'saida';

export type ProductCategoryRecord = {
  id: number;
  nome: string;
  descricao?: string | null;
};

export type SupplierRecord = {
  id: number;
  nome: string;
  cnpj_cpf?: string | null;
  contato?: string | null;
  status: ProductStatus;
};

export type UnitRecord = {
  id: number;
  sigla: string;
  nome: string;
};

export type ProductRecord = {
  id: number;
  sku: string;
  nome: string;
  descricao?: string | null;
  preco_custo: number;
  preco_venda: number;
  quantidade: number;
  estoque_minimo: number;
  status: ProductStatus;
  id_categoria: number;
  id_fornecedor: number | null;
  id_unidade: number;
  foto_url?: string | null;
  categoria?: ProductCategoryRecord | null;
  fornecedor?: SupplierRecord | null;
  unidade?: UnitRecord | null;
};

export type InventoryMovementRecord = {
  id: number;
  id_produto: number;
  id_usuario?: number | null;
  tipo: InventoryMovementType;
  quantidade: number;
  data_hora: string;
  motivo: string;
  responsavel: string;
  produto?: ProductRecord | null;
};

export type ProductPayload = {
  sku: string;
  nome: string;
  descricao?: string | null;
  preco_custo: number;
  preco_venda: number;
  quantidade: number;
  estoque_minimo: number;
  status?: ProductStatus;
  id_categoria: number;
  id_fornecedor?: number | null;
  id_unidade: number;
  foto_url?: string | null;
};

export type ProductCategoryPayload = {
  nome: string;
  descricao?: string | null;
};

export type SupplierPayload = {
  nome: string;
  cnpj_cpf?: string | null;
  contato?: string | null;
  status?: ProductStatus;
};

export type UnitPayload = {
  sigla: string;
  nome: string;
};

export type InventoryMovementPayload = {
  id_produto: number;
  tipo: InventoryMovementType;
  quantidade: number;
  data_hora?: string;
  motivo: string;
  responsavel?: string;
};

export type ProductUpdatePayload = Partial<{
  sku: string;
  nome: string;
  descricao: string | null;
  preco_custo: number;
  preco_venda: number;
  quantidade: number;
  estoque_minimo: number;
  status: ProductStatus;
  id_categoria: number;
  id_fornecedor: number | null;
  id_unidade: number;
  foto_url: string | null;
}>;

export type SupplierUpdatePayload = Partial<{
  nome: string;
  cnpj_cpf: string | null;
  contato: string | null;
  status: ProductStatus;
}>;

export async function listProducts(): Promise<ProductRecord[]> {
  return apiRequest<ProductRecord[]>('/crm/products', {
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function createProduct(payload: ProductPayload): Promise<ProductRecord> {
  return apiRequest<ProductRecord>('/crm/products', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function listProductCategories(): Promise<ProductCategoryRecord[]> {
  return apiRequest<ProductCategoryRecord[]>('/crm/product-categories', {
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function createProductCategory(payload: ProductCategoryPayload): Promise<ProductCategoryRecord> {
  return apiRequest<ProductCategoryRecord>('/crm/product-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function updateProductCategory(id: number, payload: Partial<ProductCategoryPayload>): Promise<ProductCategoryRecord> {
  return apiRequest<ProductCategoryRecord>(`/crm/product-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function listSuppliers(): Promise<SupplierRecord[]> {
  return apiRequest<SupplierRecord[]>('/crm/suppliers', {
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function createSupplier(payload: SupplierPayload): Promise<SupplierRecord> {
  return apiRequest<SupplierRecord>('/crm/suppliers', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function listUnits(): Promise<UnitRecord[]> {
  return apiRequest<UnitRecord[]>('/crm/units', {
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function createUnit(payload: UnitPayload): Promise<UnitRecord> {
  return apiRequest<UnitRecord>('/crm/units', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function updateUnit(id: number, payload: Partial<UnitPayload>): Promise<UnitRecord> {
  return apiRequest<UnitRecord>(`/crm/units/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function listInventoryMovements(): Promise<InventoryMovementRecord[]> {
  return apiRequest<InventoryMovementRecord[]>('/crm/inventory-movements', {
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function createInventoryMovement(payload: InventoryMovementPayload): Promise<InventoryMovementRecord> {
  return apiRequest<InventoryMovementRecord>('/crm/inventory-movements', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function updateInventoryMovement(id: number, payload: InventoryMovementPayload): Promise<InventoryMovementRecord> {
  return apiRequest<InventoryMovementRecord>(`/crm/inventory-movements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function deleteProduct(id: number): Promise<{ message: string; product: ProductRecord }> {
  return apiRequest<{ message: string; product: ProductRecord }>(`/crm/products/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function updateProduct(id: number, payload: ProductUpdatePayload): Promise<ProductRecord> {
  return apiRequest<ProductRecord>(`/crm/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function deleteProductCategory(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/crm/product-categories/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function deleteSupplier(id: number): Promise<{ message: string; supplier: SupplierRecord }> {
  return apiRequest<{ message: string; supplier: SupplierRecord }>(`/crm/suppliers/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function updateSupplier(id: number, payload: SupplierUpdatePayload): Promise<SupplierRecord> {
  return apiRequest<SupplierRecord>(`/crm/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function deleteUnit(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/crm/units/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}

export async function deleteInventoryMovement(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/crm/inventory-movements/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de produtos',
  });
}
