import { screen, waitFor } from '@testing-library/react';
import AppRouter from './AppRouter';
import { renderWithProviders } from './test/renderWithProviders';

vi.mock('./App', () => ({
  default: () => <div>Admin shell</div>,
}));

vi.mock('./layouts/EmployeeShell', () => ({
  default: () => <div>Employee shell</div>,
}));

vi.mock('./layouts/ManagerShell', () => ({
  default: () => <div>Manager shell</div>,
}));

vi.mock('./layouts/FinanceShell', () => ({
  default: () => <div>Finance shell</div>,
}));

vi.mock('./pages/Login', () => ({
  default: () => <div>Login screen</div>,
}));

describe('AppRouter', () => {
  it('manda usuario sem login para a tela de login', async () => {
    renderWithProviders(<AppRouter />, {
      route: '/crm',
      auth: { user: null, token: null, loading: false },
    });

    expect(await screen.findByText('Login screen')).toBeInTheDocument();
  });

  it('abre o shell do funcionario quando o cargo e employee', async () => {
    renderWithProviders(<AppRouter />, {
      route: '/crm/vendas',
      auth: {
        user: {
          id: 1,
          name: 'Caixa',
          email: 'caixa@nexadash.local',
          role: 'employee',
          permissions: { ver_leads: true, editar_leads: true },
        },
        token: 'token',
        loading: false,
      },
    });

    expect(await screen.findByText('Employee shell')).toBeInTheDocument();
  });

  it('abre o shell do financeiro quando o cargo e finance', async () => {
    renderWithProviders(<AppRouter />, {
      route: '/crm/financeiro',
      auth: {
        user: {
          id: 2,
          name: 'Financeiro',
          email: 'financeiro@nexadash.local',
          role: 'finance',
          permissions: { ver_financeiro: true },
        },
        token: 'token',
        loading: false,
      },
    });

    expect(await screen.findByText('Finance shell')).toBeInTheDocument();
  });

  it('mostra carregamento enquanto a sessao esta subindo', async () => {
    renderWithProviders(<AppRouter />, {
      auth: { loading: true },
    });

    await waitFor(() => {
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
  });
});
