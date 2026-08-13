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

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
const TOKEN_KEY = 'nexadash_token';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);

  return token
    ? {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro ao comunicar com a API de produtos');
  }

  return response.json() as Promise<T>;
}

export async function listProducts(): Promise<ProductRecord[]> {
  const response = await fetch(`${API_BASE}/crm/products`, {
    headers: authHeaders(),
  });

  return handleResponse<ProductRecord[]>(response);
}

export async function createProduct(payload: ProductPayload): Promise<ProductRecord> {
  const response = await fetch(`${API_BASE}/crm/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ProductRecord>(response);
}

export async function listProductCategories(): Promise<ProductCategoryRecord[]> {
  const response = await fetch(`${API_BASE}/crm/product-categories`, {
    headers: authHeaders(),
  });

  return handleResponse<ProductCategoryRecord[]>(response);
}

export async function createProductCategory(payload: ProductCategoryPayload): Promise<ProductCategoryRecord> {
  const response = await fetch(`${API_BASE}/crm/product-categories`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ProductCategoryRecord>(response);
}

export async function updateProductCategory(id: number, payload: Partial<ProductCategoryPayload>): Promise<ProductCategoryRecord> {
  const response = await fetch(`${API_BASE}/crm/product-categories/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ProductCategoryRecord>(response);
}

export async function listSuppliers(): Promise<SupplierRecord[]> {
  const response = await fetch(`${API_BASE}/crm/suppliers`, {
    headers: authHeaders(),
  });

  return handleResponse<SupplierRecord[]>(response);
}

export async function createSupplier(payload: SupplierPayload): Promise<SupplierRecord> {
  const response = await fetch(`${API_BASE}/crm/suppliers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<SupplierRecord>(response);
}

export async function listUnits(): Promise<UnitRecord[]> {
  const response = await fetch(`${API_BASE}/crm/units`, {
    headers: authHeaders(),
  });

  return handleResponse<UnitRecord[]>(response);
}

export async function createUnit(payload: UnitPayload): Promise<UnitRecord> {
  const response = await fetch(`${API_BASE}/crm/units`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<UnitRecord>(response);
}

export async function updateUnit(id: number, payload: Partial<UnitPayload>): Promise<UnitRecord> {
  const response = await fetch(`${API_BASE}/crm/units/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<UnitRecord>(response);
}

export async function listInventoryMovements(): Promise<InventoryMovementRecord[]> {
  const response = await fetch(`${API_BASE}/crm/inventory-movements`, {
    headers: authHeaders(),
  });

  return handleResponse<InventoryMovementRecord[]>(response);
}

export async function createInventoryMovement(payload: InventoryMovementPayload): Promise<InventoryMovementRecord> {
  const response = await fetch(`${API_BASE}/crm/inventory-movements`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<InventoryMovementRecord>(response);
}

export async function updateInventoryMovement(id: number, payload: InventoryMovementPayload): Promise<InventoryMovementRecord> {
  const response = await fetch(`${API_BASE}/crm/inventory-movements/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<InventoryMovementRecord>(response);
}

export async function deleteProduct(id: number): Promise<{ message: string; product: ProductRecord }> {
  const response = await fetch(`${API_BASE}/crm/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string; product: ProductRecord }>(response);
}

export async function updateProduct(id: number, payload: ProductUpdatePayload): Promise<ProductRecord> {
  const response = await fetch(`${API_BASE}/crm/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ProductRecord>(response);
}

export async function deleteProductCategory(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/crm/product-categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}

export async function deleteSupplier(id: number): Promise<{ message: string; supplier: SupplierRecord }> {
  const response = await fetch(`${API_BASE}/crm/suppliers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string; supplier: SupplierRecord }>(response);
}

export async function updateSupplier(id: number, payload: SupplierUpdatePayload): Promise<SupplierRecord> {
  const response = await fetch(`${API_BASE}/crm/suppliers/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<SupplierRecord>(response);
}

export async function deleteUnit(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/crm/units/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}

export async function deleteInventoryMovement(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/crm/inventory-movements/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}
