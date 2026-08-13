import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import Login from './Login';
import { renderWithProviders } from '../test/renderWithProviders';

describe('Login', () => {
  it('redireciona para o painel correto depois do login', async () => {
    const loginMock = vi.fn().mockResolvedValue({
      id: 7,
      name: 'Financeiro',
      email: 'financeiro@nexadash.local',
      role: 'finance',
      permissions: { ver_financeiro: true },
    });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/crm/financeiro" element={<div>Painel financeiro carregado</div>} />
      </Routes>,
      {
        route: '/login',
        auth: {
          login: loginMock,
        },
      },
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'financeiro@nexadash.local' },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('financeiro@nexadash.local', 'password');
    });

    expect(await screen.findByText('Painel financeiro carregado')).toBeInTheDocument();
  });

  it('mostra erro quando o login falha', async () => {
    const loginMock = vi.fn().mockRejectedValue(new Error('Email ou senha invalidos.'));

    renderWithProviders(<Login />, {
      route: '/login',
      auth: {
        login: loginMock,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Email ou senha invalidos.')).toBeInTheDocument();
  });
});
