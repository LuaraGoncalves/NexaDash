import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ContextHelp from '../components/ContextHelp';
import { useToast } from '../context/useToast';
import {
  createInventoryMovement,
  createProduct,
  createProductCategory,
  createSupplier,
  createUnit,
  deleteInventoryMovement,
  deleteProduct,
  deleteProductCategory,
  deleteSupplier,
  deleteUnit,
  listInventoryMovements,
  listProductCategories,
  listProducts,
  listSuppliers,
  listUnits,
  updateInventoryMovement,
  updateProduct,
  updateProductCategory,
  updateSupplier,
  updateUnit,
  type InventoryMovementPayload,
  type InventoryMovementRecord,
  type InventoryMovementType,
  type ProductCategoryPayload,
  type ProductCategoryRecord,
  type ProductPayload,
  type ProductRecord,
  type ProductStatus,
  type SupplierPayload,
  type SupplierRecord,
  type UnitPayload,
  type UnitRecord,
} from '../services/productsApi';

type Categoria = ProductCategoryRecord;
type Fornecedor = SupplierRecord;
type Unidade = UnitRecord;
type Produto = ProductRecord;
type Movimentacao = InventoryMovementRecord;

type PendingProductAction =
  | { kind: 'product'; id: number; label: string }
  | { kind: 'product-reactivate'; id: number; label: string }
  | { kind: 'movement'; id: number; label: string }
  | { kind: 'category'; id: number; label: string }
  | { kind: 'supplier'; id: number; label: string }
  | { kind: 'supplier-reactivate'; id: number; label: string }
  | { kind: 'unit'; id: number; label: string };

type ProductFormState = {
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

type MovementFormState = {
  id_produto: string;
  tipo: InventoryMovementType;
  quantidade: string;
  data_hora: string;
  motivo: string;
  responsavel: string;
};

type CategoryFormState = {
  nome: string;
  descricao: string;
};

type SupplierFormState = {
  nome: string;
  cnpj_cpf: string;
  contato: string;
  status: ProductStatus;
};

type UnitFormState = {
  sigla: string;
  nome: string;
};

const emptyProductForm = (): ProductFormState => ({
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

const emptyMovementForm = (): MovementFormState => ({
  id_produto: '',
  tipo: 'entrada',
  quantidade: '1',
  data_hora: toDatetimeLocal(new Date().toISOString()),
  motivo: '',
  responsavel: '',
});

const emptyCategoryForm = (): CategoryFormState => ({
  nome: '',
  descricao: '',
});

const emptySupplierForm = (): SupplierFormState => ({
  nome: '',
  cnpj_cpf: '',
  contato: '',
  status: 'ativo',
});

const emptyUnitForm = (): UnitFormState => ({
  sigla: '',
  nome: '',
});

export default function Products() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'catalogo' | 'movimentacoes' | 'cadastros'>('catalogo');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDeletingAction, setIsDeletingAction] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingProductAction | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<number | 'todas'>('todas');
  const [filterStatus, setFilterStatus] = useState<'todos' | ProductStatus>('ativo');

  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isFornecedorModalOpen, setIsFornecedorModalOpen] = useState(false);
  const [isUnidadeModalOpen, setIsUnidadeModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [editingMovement, setEditingMovement] = useState<Movimentacao | null>(null);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Fornecedor | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unidade | null>(null);

  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [movementForm, setMovementForm] = useState<MovementFormState>(emptyMovementForm);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [unitForm, setUnitForm] = useState<UnitFormState>(emptyUnitForm);

  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingMovement, setIsSavingMovement] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isSavingUnit, setIsSavingUnit] = useState(false);
  const productCostPreview = Number(productForm.preco_custo || 0);
  const productSalePreview = Number(productForm.preco_venda || 0);
  const productQuantityPreview = Number(productForm.quantidade || 0);
  const productStockMinPreview = Number(productForm.estoque_minimo || 0);
  const productMarginPreview = productCostPreview > 0 ? ((productSalePreview - productCostPreview) / productCostPreview) * 100 : 0;
  const productEstimatedStockValue = productQuantityPreview * productCostPreview;

  const carregarDados = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoadingData(true);
    }

    try {
      const [productsResponse, categoriesResponse, suppliersResponse, unitsResponse, movementsResponse] =
        await Promise.all([
          listProducts(),
          listProductCategories(),
          listSuppliers(),
          listUnits(),
          listInventoryMovements(),
        ]);

      setProdutos(productsResponse);
      setCategorias(categoriesResponse);
      setFornecedores(suppliersResponse);
      setUnidades(unitsResponse);
      setMovimentacoes(movementsResponse);
    } catch (error) {
      console.error('Erro ao carregar dados de produtos:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui carregar produtos',
        description: 'Produtos, estoque e cadastros nao vieram da API agora.',
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarDados(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregarDados]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const matchesSearch =
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = filterCat === 'todas' || produto.id_categoria === filterCat;
      const matchesStatus = filterStatus === 'todos' || produto.status === filterStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [filterCat, filterStatus, produtos, searchTerm]);

  const movimentacoesOrdenadas = useMemo(
    () => [...movimentacoes].sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()),
    [movimentacoes],
  );

  const totalEstoqueAtivo = produtos
    .filter((produto) => produto.status === 'ativo')
    .reduce((acc, produto) => acc + produto.quantidade, 0);

  const valorEstoqueAtivo = produtos
    .filter((produto) => produto.status === 'ativo')
    .reduce((acc, produto) => acc + produto.quantidade * produto.preco_custo, 0);

  const openProductModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduct(produto);
      setProductForm({
        sku: produto.sku,
        nome: produto.nome,
        descricao: produto.descricao ?? '',
        preco_custo: String(produto.preco_custo),
        preco_venda: String(produto.preco_venda),
        quantidade: String(produto.quantidade),
        estoque_minimo: String(produto.estoque_minimo),
        status: produto.status,
        id_categoria: String(produto.id_categoria),
        id_fornecedor: produto.id_fornecedor ? String(produto.id_fornecedor) : '',
        id_unidade: String(produto.id_unidade),
        foto_url: produto.foto_url ?? '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        ...emptyProductForm(),
        id_categoria: categorias[0] ? String(categorias[0].id) : '',
        id_unidade: unidades[0] ? String(unidades[0].id) : '',
      });
    }

    setIsProdutoModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProdutoModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm());
  };

  const openMovementModal = (movement?: Movimentacao) => {
    if (movement) {
      setEditingMovement(movement);
      setMovementForm({
        id_produto: String(movement.id_produto),
        tipo: movement.tipo,
        quantidade: String(movement.quantidade),
        data_hora: toDatetimeLocal(movement.data_hora),
        motivo: movement.motivo,
        responsavel: movement.responsavel,
      });
    } else {
      setEditingMovement(null);
      setMovementForm({
        ...emptyMovementForm(),
        id_produto: produtos.find((produto) => produto.status === 'ativo') ? String(produtos.find((produto) => produto.status === 'ativo')!.id) : '',
      });
    }

    setIsMovimentacaoModalOpen(true);
  };

  const closeMovementModal = () => {
    setIsMovimentacaoModalOpen(false);
    setEditingMovement(null);
    setMovementForm(emptyMovementForm());
  };

  const openCategoryModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategory(categoria);
      setCategoryForm({
        nome: categoria.nome,
        descricao: categoria.descricao ?? '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm(emptyCategoryForm());
    }

    setIsCategoriaModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoriaModalOpen(false);
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm());
  };

  const openSupplierModal = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingSupplier(fornecedor);
      setSupplierForm({
        nome: fornecedor.nome,
        cnpj_cpf: fornecedor.cnpj_cpf ?? '',
        contato: fornecedor.contato ?? '',
        status: fornecedor.status,
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm(emptySupplierForm());
    }

    setIsFornecedorModalOpen(true);
  };

  const closeSupplierModal = () => {
    setIsFornecedorModalOpen(false);
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm());
  };

  const openUnitModal = (unidade?: Unidade) => {
    if (unidade) {
      setEditingUnit(unidade);
      setUnitForm({
        sigla: unidade.sigla,
        nome: unidade.nome,
      });
    } else {
      setEditingUnit(null);
      setUnitForm(emptyUnitForm());
    }

    setIsUnidadeModalOpen(true);
  };

  const closeUnitModal = () => {
    setIsUnidadeModalOpen(false);
    setEditingUnit(null);
    setUnitForm(emptyUnitForm());
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productForm.sku || !productForm.nome || !productForm.id_categoria || !productForm.id_unidade) {
      showToast({
        tone: 'info',
        title: 'Faltam campos obrigatorios',
        description: 'Preencha SKU, nome, categoria e unidade antes de salvar.',
      });
      return;
    }

    setIsSavingProduct(true);

    const payload: ProductPayload = {
      sku: productForm.sku,
      nome: productForm.nome,
      descricao: productForm.descricao || null,
      preco_custo: Number(productForm.preco_custo || 0),
      preco_venda: Number(productForm.preco_venda || 0),
      quantidade: Number(productForm.quantidade || 0),
      estoque_minimo: Number(productForm.estoque_minimo || 0),
      status: productForm.status,
      id_categoria: Number(productForm.id_categoria),
      id_fornecedor: productForm.id_fornecedor ? Number(productForm.id_fornecedor) : null,
      id_unidade: Number(productForm.id_unidade),
      foto_url: productForm.foto_url || null,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      await carregarDados();
      closeProductModal();
      showToast({
        tone: 'success',
        title: editingProduct ? 'Produto atualizado' : 'Produto criado',
        description: editingProduct
          ? 'O produto foi salvo com os dados novos.'
          : 'O produto entrou no catalogo e ja foi salvo no banco.',
      });
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar o produto',
        description: 'A API nao confirmou esse cadastro agora.',
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveMovement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!movementForm.id_produto || !movementForm.quantidade || !movementForm.motivo.trim()) {
      showToast({
        tone: 'info',
        title: 'Faltam dados da movimentacao',
        description: 'Escolha produto, quantidade e motivo antes de confirmar.',
      });
      return;
    }

    setIsSavingMovement(true);

    const payload: InventoryMovementPayload = {
      id_produto: Number(movementForm.id_produto),
      tipo: movementForm.tipo,
      quantidade: Number(movementForm.quantidade),
      data_hora: movementForm.data_hora ? new Date(movementForm.data_hora).toISOString() : undefined,
      motivo: movementForm.motivo,
      responsavel: movementForm.responsavel || undefined,
    };

    try {
      if (editingMovement) {
        await updateInventoryMovement(editingMovement.id, payload);
      } else {
        await createInventoryMovement(payload);
      }

      await carregarDados();
      closeMovementModal();
      showToast({
        tone: 'success',
        title: editingMovement ? 'Movimentacao atualizada' : 'Movimentacao registrada',
        description: 'O estoque foi sincronizado com essa alteracao.',
      });
    } catch (error) {
      console.error('Erro ao salvar movimentacao:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar a movimentacao',
        description: 'O servidor nao confirmou essa movimentacao agora.',
      });
    } finally {
      setIsSavingMovement(false);
    }
  };

  const handleSaveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryForm.nome.trim()) {
      showToast({
        tone: 'info',
        title: 'Nome da categoria obrigatorio',
        description: 'Preencha o nome antes de salvar.',
      });
      return;
    }

    setIsSavingCategory(true);

    const payload: ProductCategoryPayload = {
      nome: categoryForm.nome,
      descricao: categoryForm.descricao || null,
    };

    try {
      if (editingCategory) {
        await updateProductCategory(editingCategory.id, payload);
      } else {
        await createProductCategory(payload);
      }

      await carregarDados();
      closeCategoryModal();
      showToast({
        tone: 'success',
        title: editingCategory ? 'Categoria atualizada' : 'Categoria criada',
        description: 'O cadastro da categoria ficou salvo na API.',
      });
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar a categoria',
        description: 'A API nao confirmou essa mudanca agora.',
      });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSaveSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supplierForm.nome.trim()) {
      showToast({
        tone: 'info',
        title: 'Nome do fornecedor obrigatorio',
        description: 'Preencha pelo menos o nome antes de salvar.',
      });
      return;
    }

    setIsSavingSupplier(true);

    const payload: SupplierPayload = {
      nome: supplierForm.nome,
      cnpj_cpf: supplierForm.cnpj_cpf || null,
      contato: supplierForm.contato || null,
      status: supplierForm.status,
    };

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
      } else {
        await createSupplier(payload);
      }

      await carregarDados();
      closeSupplierModal();
      showToast({
        tone: 'success',
        title: editingSupplier ? 'Fornecedor atualizado' : 'Fornecedor criado',
        description: 'O fornecedor foi salvo e ja pode ser usado nos produtos.',
      });
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar o fornecedor',
        description: 'A API nao confirmou esse cadastro agora.',
      });
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleSaveUnit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!unitForm.sigla.trim() || !unitForm.nome.trim()) {
      showToast({
        tone: 'info',
        title: 'Dados obrigatorios da unidade',
        description: 'Preencha sigla e nome antes de salvar.',
      });
      return;
    }

    setIsSavingUnit(true);

    const payload: UnitPayload = {
      sigla: unitForm.sigla.trim(),
      nome: unitForm.nome.trim(),
    };

    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, payload);
      } else {
        await createUnit(payload);
      }

      await carregarDados();
      closeUnitModal();
      showToast({
        tone: 'success',
        title: editingUnit ? 'Unidade atualizada' : 'Unidade criada',
        description: 'A unidade de medida foi salva na API.',
      });
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui salvar a unidade',
        description: 'A API nao confirmou esse cadastro agora.',
      });
    } finally {
      setIsSavingUnit(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    setIsDeletingAction(true);

    try {
      if (pendingAction.kind === 'product') {
        await deleteProduct(pendingAction.id);
        showToast({
          tone: 'success',
          title: 'Produto inativado',
          description: `${pendingAction.label} saiu da operacao, mas continua no historico.`,
        });
      }

      if (pendingAction.kind === 'product-reactivate') {
        await updateProduct(pendingAction.id, { status: 'ativo' });
        showToast({
          tone: 'success',
          title: 'Produto reativado',
          description: `${pendingAction.label} voltou a ficar disponivel no sistema.`,
        });
      }

      if (pendingAction.kind === 'movement') {
        await deleteInventoryMovement(pendingAction.id);
        showToast({
          tone: 'success',
          title: 'Movimentacao excluida',
          description: `${pendingAction.label} foi removida e o estoque foi recalculado.`,
        });
      }

      if (pendingAction.kind === 'category') {
        await deleteProductCategory(pendingAction.id);
        showToast({
          tone: 'success',
          title: 'Categoria excluida',
          description: `${pendingAction.label} foi removida do cadastro.`,
        });
      }

      if (pendingAction.kind === 'supplier') {
        await deleteSupplier(pendingAction.id);
        showToast({
          tone: 'success',
          title: 'Fornecedor inativado',
          description: `${pendingAction.label} saiu da operacao, mas o historico foi mantido.`,
        });
      }

      if (pendingAction.kind === 'supplier-reactivate') {
        await updateSupplier(pendingAction.id, { status: 'ativo' });
        showToast({
          tone: 'success',
          title: 'Fornecedor reativado',
          description: `${pendingAction.label} voltou a ficar ativo no sistema.`,
        });
      }

      if (pendingAction.kind === 'unit') {
        await deleteUnit(pendingAction.id);
        showToast({
          tone: 'success',
          title: 'Unidade excluida',
          description: `${pendingAction.label} foi removida do cadastro.`,
        });
      }

      setPendingAction(null);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao executar acao em produtos:', error);
      showToast({
        tone: 'error',
        title: 'Nao consegui concluir essa acao',
        description: 'O servidor nao confirmou essa operacao agora.',
      });
    } finally {
      setIsDeletingAction(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-end justify-between border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Gestao de Produtos & Estoque</h2>
          <p className="text-gray-400 text-sm">Catalogo, estoque, fornecedores e movimentacoes gravando na API real.</p>
        </div>
        <div className="flex items-center space-x-2">
          <ContextHelp title="Ajuda de produtos">
            <p>Produto e fornecedor podem ser inativados para preservar historico.</p>
            <p>Categoria, unidade e movimentacao podem ser excluidas conforme a regra de cada cadastro.</p>
          </ContextHelp>
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'catalogo' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#ff8c00]' : 'text-gray-400 hover:text-white'}`}
          >
            Catalogo & Estoque
          </button>
          <button
            onClick={() => setActiveTab('movimentacoes')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'movimentacoes' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#ff8c00]' : 'text-gray-400 hover:text-white'}`}
          >
            Movimentacoes
          </button>
          <button
            onClick={() => setActiveTab('cadastros')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'cadastros' ? 'bg-[#23272d] text-white border-t border-l border-r border-[#ff8c00]' : 'text-gray-400 hover:text-white'}`}
          >
            Cadastros
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'catalogo' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  type="text"
                  placeholder="Buscar produto ou SKU..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-64 bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                />
                <select
                  value={filterCat}
                  onChange={(event) => setFilterCat(event.target.value === 'todas' ? 'todas' : Number(event.target.value))}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                >
                  <option value="todas">Todas as categorias</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value as 'todos' | ProductStatus)}
                  className="bg-[#1a1e23] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                >
                  <option value="todos">Status: Todos</option>
                  <option value="ativo">Status: Ativos</option>
                  <option value="inativo">Status: Inativos</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => openMovementModal()}
                  className="bg-[#2a3038] text-white hover:bg-gray-700 border border-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition"
                >
                  Movimentar
                </button>
                <button
                  onClick={() => openProductModal()}
                  className="bg-[#ff8c00] text-[#1a1e23] hover:bg-opacity-80 px-4 py-2 rounded-lg text-sm font-bold transition shadow-[0_0_10px_rgba(255,140,0,0.3)]"
                >
                  Novo Produto
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-gray-700">
              {isLoadingData ? (
                <div className="flex h-full items-center justify-center bg-[#1a1e23] text-gray-500">
                  Carregando produtos...
                </div>
              ) : (
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#1a1e23] text-gray-300 uppercase text-xs sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 font-medium w-16">Item</th>
                      <th className="px-6 py-4 font-medium">Produto / SKU</th>
                      <th className="px-6 py-4 font-medium text-center">Estoque</th>
                      <th className="px-6 py-4 font-medium">Preco (Custo / Venda)</th>
                      <th className="px-6 py-4 font-medium">Categoria / Fornecedor</th>
                      <th className="px-6 py-4 font-medium text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {produtosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-500">
                          Nenhum produto encontrado.
                        </td>
                      </tr>
                    ) : (
                      produtosFiltrados.map((produto) => {
                        const lucro = produto.preco_venda - produto.preco_custo;
                        const margem = produto.preco_custo > 0 ? ((lucro / produto.preco_custo) * 100).toFixed(1) : '100';
                        const isLowStock = produto.quantidade <= produto.estoque_minimo && produto.status === 'ativo';

                        return (
                          <tr key={produto.id} className={`transition-colors ${produto.status === 'inativo' ? 'opacity-50 bg-[#1a1e23]' : 'hover:bg-[#2a3038]'}`}>
                            <td className="px-6 py-4">
                              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden">
                                {produto.foto_url ? (
                                  <img src={produto.foto_url} alt={produto.nome} className="w-full h-full object-cover" />
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold">{produto.nome}</span>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded font-mono">{produto.sku}</span>
                                  {produto.status === 'inativo' && (
                                    <span className="text-[10px] text-red-500 font-bold border border-red-500 px-1 rounded uppercase">
                                      Inativo
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-xl font-bold ${isLowStock ? 'text-red-500' : 'text-white'}`}>
                                  {produto.quantidade} <span className="text-xs font-normal text-gray-500">{getUnidadeSigla(unidades, produto.id_unidade)}</span>
                                </span>
                                {isLowStock && (
                                  <span className="text-[10px] text-red-500 font-semibold bg-red-500 bg-opacity-10 px-2 py-0.5 rounded-full mt-1">
                                    Baixo estoque (Min: {produto.estoque_minimo})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col space-y-1">
                                <div className="flex justify-between w-32">
                                  <span className="text-xs text-gray-500">Custo:</span>
                                  <span className="text-gray-300">{formatCurrency(produto.preco_custo)}</span>
                                </div>
                                <div className="flex justify-between w-32">
                                  <span className="text-xs text-gray-500">Venda:</span>
                                  <span className="text-[#00e6e6] font-bold">{formatCurrency(produto.preco_venda)}</span>
                                </div>
                                <div className="flex justify-between w-32 border-t border-gray-700 pt-1 mt-1">
                                  <span className="text-[10px] text-gray-500">Lucro:</span>
                                  <span className="text-[10px] text-green-500 font-bold">
                                    +{formatCurrency(lucro)} ({margem}%)
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-white text-sm">{getCategoriaNome(categorias, produto.id_categoria)}</p>
                              <p className="text-xs text-gray-500 mt-1 truncate w-40" title={getFornecedorNome(fornecedores, produto.id_fornecedor)}>
                                {getFornecedorNome(fornecedores, produto.id_fornecedor)}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => openProductModal(produto)}
                                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                                  title="Editar"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                {produto.status === 'ativo' ? (
                                  <button
                                    type="button"
                                    onClick={() => setPendingAction({ kind: 'product', id: produto.id, label: produto.nome })}
                                    className="p-2 bg-red-500 bg-opacity-10 hover:bg-opacity-20 text-red-500 border border-transparent hover:border-red-500 rounded transition-colors"
                                    title="Inativar"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      <line x1="10" y1="11" x2="10" y2="17" />
                                      <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPendingAction({ kind: 'product-reactivate', id: produto.id, label: produto.nome })}
                                    className="p-2 bg-green-500 bg-opacity-10 hover:bg-opacity-20 text-green-500 border border-transparent hover:border-green-500 rounded transition-colors"
                                    title="Reativar"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                      <path d="M2.5 2v6h6M21.5 22v-6h-6" />
                                      <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-xs text-gray-400">
              <span>
                Total de produtos cadastrados: <strong className="text-white">{produtos.length}</strong>
              </span>
              <span>
                Total de itens em estoque (ativos): <strong className="text-[#00e6e6] text-sm">{totalEstoqueAtivo} UN</strong>
              </span>
              <span>
                Valor de estoque (custo): <strong className="text-white">{formatCurrency(valorEstoqueAtivo)}</strong>
              </span>
            </div>
          </div>
        )}

        {activeTab === 'movimentacoes' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
              <h3 className="text-lg font-bold text-white">Historico de entrada e saida</h3>
              <button
                onClick={() => openMovementModal()}
                className="bg-[#2a3038] text-white hover:bg-gray-700 border border-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition"
              >
                Registrar nova movimentacao
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="space-y-4">
                {isLoadingData ? (
                  <div className="rounded-xl bg-[#1a1e23] px-4 py-10 text-center text-gray-500">
                    Carregando movimentacoes...
                  </div>
                ) : movimentacoesOrdenadas.length === 0 ? (
                  <div className="rounded-xl bg-[#1a1e23] px-4 py-10 text-center text-gray-500">
                    Nenhuma movimentacao cadastrada ainda.
                  </div>
                ) : (
                  movimentacoesOrdenadas.map((movimentacao) => {
                    const produtoRelacionado = movimentacao.produto ?? produtos.find((produto) => produto.id === movimentacao.id_produto);
                    const isEntrada = movimentacao.tipo === 'entrada';

                    return (
                      <div key={movimentacao.id} className="bg-[#1a1e23] p-4 rounded-xl border border-gray-800 flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 ${isEntrada ? 'bg-green-500 bg-opacity-10 border-green-500 text-green-500' : 'bg-red-500 bg-opacity-10 border-red-500 text-red-500'}`}>
                            {isEntrada ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isEntrada ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {movimentacao.tipo}
                              </span>
                              <span className="text-gray-400 text-xs">{formatDateTime(movimentacao.data_hora)}</span>
                            </div>
                            <h4 className="text-white font-bold text-md mt-1">
                              {produtoRelacionado?.nome || 'Produto nao encontrado'}{' '}
                              <span className="text-gray-500 font-mono text-xs">({produtoRelacionado?.sku || 'sem sku'})</span>
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {movimentacao.motivo} • Responsavel: {movimentacao.responsavel}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openMovementModal(movimentacao)}
                              className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300 transition hover:bg-sky-500/20"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingAction({ kind: 'movement', id: movimentacao.id, label: `${movimentacao.tipo} ${movimentacao.quantidade}` })}
                              className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-500/20"
                            >
                              Excluir
                            </button>
                          </div>
                          <span className={`text-2xl font-bold ${isEntrada ? 'text-green-500' : 'text-red-500'}`}>
                            {isEntrada ? '+' : '-'}
                            {movimentacao.quantidade} <span className="text-sm font-normal">UN</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cadastros' && (
          <div className="absolute inset-0 flex flex-col bg-[#23272d] rounded-2xl shadow-2xl border border-gray-800 p-6 overflow-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
              <div className="bg-[#1a1e23] border border-gray-700 rounded-xl p-6 flex flex-col">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                  <h3 className="text-white font-bold text-lg">Categorias</h3>
                  <button onClick={() => openCategoryModal()} className="text-[#00e6e6] hover:text-white text-sm font-semibold">
                    + Nova Categoria
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {categorias.map((categoria) => (
                    <div key={categoria.id} className="bg-[#23272d] p-3 rounded-lg flex justify-between items-start gap-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{categoria.nome}</p>
                        <p className="text-gray-500 text-xs">{categoria.descricao || 'Sem descricao'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openCategoryModal(categoria)} className="text-sky-300 hover:text-sky-200 text-xs font-bold">
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction({ kind: 'category', id: categoria.id, label: categoria.nome })}
                          className="text-red-400 hover:text-red-300 text-xs font-bold"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1e23] border border-gray-700 rounded-xl p-6 flex flex-col">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                  <h3 className="text-white font-bold text-lg">Fornecedores</h3>
                  <button onClick={() => openSupplierModal()} className="text-[#00e6e6] hover:text-white text-sm font-semibold">
                    + Novo Fornecedor
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {fornecedores.map((fornecedor) => (
                    <div key={fornecedor.id} className="bg-[#23272d] p-3 rounded-lg flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-sm">{fornecedor.nome}</p>
                          {fornecedor.status === 'inativo' && (
                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs">CNPJ/CPF: {fornecedor.cnpj_cpf || 'Nao informado'}</p>
                        <p className="text-gray-500 text-xs">Contato: {fornecedor.contato || 'Nao informado'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openSupplierModal(fornecedor)} className="text-sky-300 hover:text-sky-200 text-xs font-bold">
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingAction({
                              kind: fornecedor.status === 'ativo' ? 'supplier' : 'supplier-reactivate',
                              id: fornecedor.id,
                              label: fornecedor.nome,
                            })
                          }
                          className={`${fornecedor.status === 'ativo' ? 'text-amber-300 hover:text-amber-200' : 'text-green-300 hover:text-green-200'} text-xs font-bold`}
                        >
                          {fornecedor.status === 'ativo' ? 'Inativar' : 'Reativar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1e23] border border-gray-700 rounded-xl p-6 flex flex-col">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                  <h3 className="text-white font-bold text-lg">Unidades</h3>
                  <button
                    type="button"
                    onClick={() => openUnitModal()}
                    className="rounded-full bg-[#00e6e6] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1e23]"
                  >
                    Nova unidade
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {unidades.map((unidade) => (
                    <div key={unidade.id} className="bg-[#23272d] p-3 rounded-lg flex justify-between items-center gap-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{unidade.sigla}</p>
                        <p className="text-gray-500 text-xs">{unidade.nome}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openUnitModal(unidade)} className="text-sky-300 hover:text-sky-200 text-xs font-bold">
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction({ kind: 'unit', id: unidade.id, label: unidade.sigla })}
                          className="text-red-400 hover:text-red-300 text-xs font-bold"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isProdutoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">{editingProduct ? 'Editar produto' : 'Cadastrar novo produto'}</h3>
              <button onClick={closeProductModal} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form id="product-form" onSubmit={handleSaveProduct} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2 mb-4">Identificacao</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Nome do produto *</label>
                    <input
                      type="text"
                      value={productForm.nome}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, nome: event.target.value }))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Codigo / SKU *</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00] font-mono"
                    />
                  </div>
                  <div className="md:col-span-12">
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Descricao</label>
                    <textarea
                      rows={3}
                      value={productForm.descricao}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, descricao: event.target.value }))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                    />
                  </div>
                  <div className="md:col-span-12">
                    <label className="block text-xs font-semibold text-gray-400 mb-1">URL da foto</label>
                    <input
                      type="text"
                      value={productForm.foto_url}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, foto_url: event.target.value }))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2 mb-4">Classificacao e origem</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria *</label>
                    <select
                      value={productForm.id_categoria}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, id_categoria: event.target.value }))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                    >
                      <option value="">Selecione...</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Fornecedor padrao</label>
                    <select
                      value={productForm.id_fornecedor}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, id_fornecedor: event.target.value }))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                    >
                      <option value="">Sem fornecedor</option>
                      {fornecedores.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Unidade *</label>
                    <select
                      value={productForm.id_unidade}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, id_unidade: event.target.value }))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                    >
                      <option value="">Selecione...</option>
                      {unidades.map((unidade) => (
                        <option key={unidade.id} value={unidade.id}>
                          {unidade.sigla} - {unidade.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Status</label>
                    <select
                      value={productForm.status}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))}
                      className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm uppercase tracking-widest font-bold text-gray-500 border-b border-gray-700 pb-2 mb-4">Valores e estoque</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FieldNumber label="Preco de custo" value={productForm.preco_custo} onChange={(value) => setProductForm((prev) => ({ ...prev, preco_custo: value }))} />
                  <FieldNumber label="Preco de venda" value={productForm.preco_venda} onChange={(value) => setProductForm((prev) => ({ ...prev, preco_venda: value }))} />
                  <FieldNumber label="Quantidade" value={productForm.quantidade} onChange={(value) => setProductForm((prev) => ({ ...prev, quantidade: value }))} />
                  <FieldNumber label="Estoque minimo" value={productForm.estoque_minimo} onChange={(value) => setProductForm((prev) => ({ ...prev, estoque_minimo: value }))} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">Resumo comercial</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-400">Margem estimada</p>
                      <p className="mt-1 text-2xl font-black text-white">{Number.isFinite(productMarginPreview) ? `${productMarginPreview.toFixed(1)}%` : '0.0%'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Valor em estoque</p>
                      <p className="mt-1 text-2xl font-black text-white">{formatCurrency(productEstimatedStockValue)}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-[#1a1e23] p-3 text-sm text-slate-300">
                    {productQuantityPreview <= productStockMinPreview
                      ? 'Esse produto vai nascer com alerta de baixo estoque. Isso ajuda a mostrar o monitoramento logo na vitrine.'
                      : 'O estoque inicial esta acima do minimo e o produto entra no catalogo sem alerta.'}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#1a1e23] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Prévia visual</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-[#23272d]">
                      {productForm.foto_url ? (
                        <img src={productForm.foto_url} alt={productForm.nome || 'Prévia do produto'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          sem foto
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{productForm.nome || 'Nome do produto'}</p>
                      <p className="mt-1 text-xs font-mono text-gray-500">{productForm.sku || 'SKU-000'}</p>
                      <p className="mt-2 text-sm text-[#00e6e6]">{formatCurrency(productSalePreview)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-end space-x-3 rounded-b-2xl">
              <button onClick={closeProductModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                form="product-form"
                className="px-6 py-2 bg-[#ff8c00] text-[#1a1e23] text-sm font-bold rounded-lg hover:bg-opacity-80 transition-colors shadow-[0_0_15px_rgba(255,140,0,0.3)] disabled:bg-gray-700 disabled:text-gray-500"
                disabled={isSavingProduct}
              >
                {isSavingProduct ? 'Salvando...' : editingProduct ? 'Salvar alteracoes' : 'Salvar produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isMovimentacaoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">{editingMovement ? 'Editar movimentacao' : 'Registrar movimentacao'}</h3>
              <button onClick={closeMovementModal} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form id="movement-form" onSubmit={handleSaveMovement} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => setMovementForm((prev) => ({ ...prev, tipo: 'entrada' }))}
                  className={`py-3 border-2 font-bold rounded-xl flex items-center justify-center ${movementForm.tipo === 'entrada' ? 'border-green-500 bg-green-500 bg-opacity-10 text-green-500' : 'border-transparent bg-[#1a1e23] text-gray-400 hover:text-white'}`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setMovementForm((prev) => ({ ...prev, tipo: 'saida' }))}
                  className={`py-3 border-2 font-bold rounded-xl flex items-center justify-center ${movementForm.tipo === 'saida' ? 'border-red-500 bg-red-500 bg-opacity-10 text-red-400' : 'border-transparent bg-[#1a1e23] text-gray-400 hover:text-white'}`}
                >
                  Saida
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Produto *</label>
                <select
                  value={movementForm.id_produto}
                  onChange={(event) => setMovementForm((prev) => ({ ...prev, id_produto: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-[#00e6e6]"
                >
                  <option value="">Selecione...</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.sku} - {produto.nome} (Estoque: {produto.quantidade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldNumber label="Quantidade *" value={movementForm.quantidade} onChange={(value) => setMovementForm((prev) => ({ ...prev, quantidade: value }))} />
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Data / Hora</label>
                  <input
                    type="datetime-local"
                    value={movementForm.data_hora}
                    onChange={(event) => setMovementForm((prev) => ({ ...prev, data_hora: event.target.value }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-[#00e6e6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Motivo *</label>
                <input
                  type="text"
                  value={movementForm.motivo}
                  onChange={(event) => setMovementForm((prev) => ({ ...prev, motivo: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Responsavel</label>
                <input
                  type="text"
                  value={movementForm.responsavel}
                  onChange={(event) => setMovementForm((prev) => ({ ...prev, responsavel: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1e23] flex justify-end space-x-3 rounded-b-2xl">
              <button onClick={closeMovementModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                form="movement-form"
                className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors shadow-lg ${movementForm.tipo === 'entrada' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'} disabled:bg-gray-700 disabled:text-gray-500`}
                disabled={isSavingMovement}
              >
                {isSavingMovement ? 'Salvando...' : editingMovement ? 'Salvar movimentacao' : movementForm.tipo === 'entrada' ? 'Confirmar entrada' : 'Confirmar saida'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCategoriaModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">{editingCategory ? 'Editar categoria' : 'Nova categoria'}</h3>
              <button onClick={closeCategoryModal} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={categoryForm.nome}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, nome: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Descricao</label>
                <textarea
                  rows={4}
                  value={categoryForm.descricao}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, descricao: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeCategoryModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-[#00e6e6] text-[#1a1e23] text-sm font-bold rounded-lg disabled:bg-gray-700 disabled:text-gray-500" disabled={isSavingCategory}>
                  {isSavingCategory ? 'Salvando...' : editingCategory ? 'Salvar categoria' : 'Criar categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFornecedorModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">{editingSupplier ? 'Editar fornecedor' : 'Novo fornecedor'}</h3>
              <button onClick={closeSupplierModal} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={supplierForm.nome}
                  onChange={(event) => setSupplierForm((prev) => ({ ...prev, nome: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={supplierForm.cnpj_cpf}
                    onChange={(event) => setSupplierForm((prev) => ({ ...prev, cnpj_cpf: event.target.value }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Status</label>
                  <select
                    value={supplierForm.status}
                    onChange={(event) => setSupplierForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))}
                    className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Contato</label>
                <input
                  type="text"
                  value={supplierForm.contato}
                  onChange={(event) => setSupplierForm((prev) => ({ ...prev, contato: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeSupplierModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-[#00e6e6] text-[#1a1e23] text-sm font-bold rounded-lg disabled:bg-gray-700 disabled:text-gray-500" disabled={isSavingSupplier}>
                  {isSavingSupplier ? 'Salvando...' : editingSupplier ? 'Salvar fornecedor' : 'Criar fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUnidadeModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#23272d] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1e23] rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">{editingUnit ? 'Editar unidade' : 'Nova unidade'}</h3>
              <button onClick={closeUnitModal} className="text-gray-400 hover:text-white">
                x
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Sigla *</label>
                <input
                  type="text"
                  value={unitForm.sigla}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, sigla: event.target.value.toUpperCase() }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={unitForm.nome}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, nome: event.target.value }))}
                  className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeUnitModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-[#00e6e6] text-[#1a1e23] text-sm font-bold rounded-lg disabled:bg-gray-700 disabled:text-gray-500" disabled={isSavingUnit}>
                  {isSavingUnit ? 'Salvando...' : editingUnit ? 'Salvar unidade' : 'Criar unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={pendingAction !== null}
        title={getPendingActionTitle(pendingAction)}
        description={getPendingActionDescription(pendingAction)}
        confirmLabel={getPendingActionButtonLabel(pendingAction)}
        tone={pendingAction?.kind === 'product' || pendingAction?.kind === 'supplier' ? 'warning' : pendingAction?.kind === 'product-reactivate' || pendingAction?.kind === 'supplier-reactivate' ? 'info' : 'danger'}
        isSubmitting={isDeletingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
      />
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getCategoriaNome(categorias: Categoria[], id: number) {
  return categorias.find((categoria) => categoria.id === id)?.nome || 'Sem categoria';
}

function getFornecedorNome(fornecedores: Fornecedor[], id: number | null) {
  return fornecedores.find((fornecedor) => fornecedor.id === id)?.nome || 'Sem fornecedor';
}

function getUnidadeSigla(unidades: Unidade[], id: number) {
  return unidades.find((unidade) => unidade.id === id)?.sigla || 'UN';
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getPendingActionTitle(action: PendingProductAction | null): string {
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

function getPendingActionDescription(action: PendingProductAction | null): string {
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

function getPendingActionButtonLabel(action: PendingProductAction | null): string {
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
