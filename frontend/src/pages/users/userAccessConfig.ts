import type { PermissionKey, UserPermissions, UserRole, UserStatus } from '../../services/usersApi';

export type RoleOption = {
  value: UserRole;
  label: string;
  defaultSetor: string;
};

export type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  setor: string;
  permissions: UserPermissions;
};

export const roleOptions: RoleOption[] = [
  { value: 'admin', label: 'Administrador', defaultSetor: 'Geral' },
  { value: 'manager', label: 'Gerente de Vendas', defaultSetor: 'Vendas' },
  { value: 'employee', label: 'Atendente', defaultSetor: 'Vendas' },
  { value: 'finance', label: 'Financeiro', defaultSetor: 'Financeiro' },
];

export const permissionLabels: Record<PermissionKey, string> = {
  ver_leads: 'Ver Leads',
  editar_leads: 'Editar Leads',
  excluir_leads: 'Excluir Leads',
  ver_financeiro: 'Ver Financeiro',
  criar_usuario: 'Criar Usuários',
};

export const defaultPermissionsByRole: Record<UserRole, UserPermissions> = {
  admin: {
    ver_leads: true,
    editar_leads: true,
    excluir_leads: true,
    ver_financeiro: true,
    criar_usuario: true,
  },
  manager: {
    ver_leads: true,
    editar_leads: true,
    excluir_leads: false,
    ver_financeiro: false,
    criar_usuario: false,
  },
  employee: {
    ver_leads: true,
    editar_leads: true,
    excluir_leads: false,
    ver_financeiro: false,
    criar_usuario: false,
  },
  finance: {
    ver_leads: false,
    editar_leads: false,
    excluir_leads: false,
    ver_financeiro: true,
    criar_usuario: false,
  },
};

export const emptyFormState = (): UserFormState => ({
  name: '',
  email: '',
  password: '',
  role: 'employee',
  status: 'ativo',
  setor: 'Vendas',
  permissions: { ...defaultPermissionsByRole.employee },
});
