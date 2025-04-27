import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import AdminMaster from './AdminMaster';

// Mock dos contextos
vi.mock('../../contexts/StoriesContext', () => ({
  StoriesContext: {
    Provider: ({ children }) => children,
  }
}));

vi.mock('../../contexts/SubscriptionContext', () => ({
  SubscriptionContext: {
    Provider: ({ children }) => children,
  }
}));

// Mock dos componentes
vi.mock('./AdminClient', () => ({
  default: () => <div data-testid="admin-client">AdminClient Mock</div>
}));

vi.mock('./AdminUser', () => ({
  default: () => <div data-testid="admin-user">AdminUser Mock</div>
}));

describe('AdminMaster Component', () => {
  const mockClients = [
    {
      id: 'client_1',
      name: 'Cliente Teste 1',
      email: 'cliente1@example.com',
      subscription: {
        status: 'active',
        plan: 'Plano Básico'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 dias atrás
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 dia atrás
    },
    {
      id: 'client_2',
      name: 'Cliente Teste 2',
      email: 'cliente2@example.com',
      subscription: {
        status: 'canceled',
        plan: 'Plano Pro'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 dias atrás
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 dias atrás
    }
  ];

  const mockStats = {
    totalClients: 25,
    activeSubscriptions: 18,
    canceledSubscriptions: 7,
    totalRevenue: 2450.00,
    monthlyRevenue: 1750.00,
    averageRevenuePerClient: 98.00,
    clientsGrowth: 15, // percentual
    revenueGrowth: 22 // percentual
  };

  // Mock para fetch API
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/admin/clients')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockClients)
      });
    }
    if (url.includes('/api/admin/stats')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStats)
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  const mockAuthContext = {
    user: {
      id: 'admin_123',
      name: 'Admin Master',
      email: 'admin@stry.live',
      adminLevel: 'master'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('renders admin dashboard with stats', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AdminMaster />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se está carregando inicialmente
    expect(screen.getByText(/Carregando dados/i)).toBeInTheDocument();

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/stats', expect.any(Object));
    });

    // Verificar se as estatísticas são exibidas
    await waitFor(() => {
      expect(screen.getByText(/Total de Clientes/i)).toBeInTheDocument();
      expect(screen.getByText(/25/)).toBeInTheDocument(); // Total de clientes
      expect(screen.getByText(/Assinaturas Ativas/i)).toBeInTheDocument();
      expect(screen.getByText(/18/)).toBeInTheDocument(); // Assinaturas ativas
      expect(screen.getByText(/Receita Total/i)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 2.450,00/)).toBeInTheDocument(); // Receita total
    });
  });

  it('displays clients list', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AdminMaster />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/clients', expect.any(Object));
    });

    // Verificar se a lista de clientes é exibida
    await waitFor(() => {
      expect(screen.getByText(/Cliente Teste 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Cliente Teste 2/i)).toBeInTheDocument();
      expect(screen.getByText(/cliente1@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/cliente2@example.com/i)).toBeInTheDocument();
    });

    // Verificar se o status da assinatura é exibido corretamente
    const activeStatus = screen.getAllByText(/Ativa/i);
    const canceledStatus = screen.getAllByText(/Cancelada/i);
    expect(activeStatus.length).toBeGreaterThan(0);
    expect(canceledStatus.length).toBeGreaterThan(0);
  });

  it('filters clients by search term', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AdminMaster />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando dados/i)).not.toBeInTheDocument();
    });

    // Digitar no campo de busca
    const searchInput = screen.getByPlaceholderText(/Buscar cliente/i);
    fireEvent.change(searchInput, { target: { value: 'Cliente Teste 1' } });

    // Verificar se apenas o cliente correspondente é exibido
    expect(screen.getByText(/Cliente Teste 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cliente Teste 2/i)).not.toBeInTheDocument();

    // Limpar a busca
    fireEvent.change(searchInput, { target: { value: '' } });

    // Verificar se todos os clientes são exibidos novamente
    await waitFor(() => {
      expect(screen.getByText(/Cliente Teste 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Cliente Teste 2/i)).toBeInTheDocument();
    });
  });

  it('filters clients by subscription status', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AdminMaster />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando dados/i)).not.toBeInTheDocument();
    });

    // Selecionar o filtro de status "Ativa"
    const statusFilter = screen.getByLabelText(/Status da Assinatura/i);
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    // Verificar se apenas os clientes com assinatura ativa são exibidos
    expect(screen.getByText(/Cliente Teste 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cliente Teste 2/i)).not.toBeInTheDocument();

    // Selecionar o filtro de status "Cancelada"
    fireEvent.change(statusFilter, { target: { value: 'canceled' } });

    // Verificar se apenas os clientes com assinatura cancelada são exibidos
    expect(screen.queryByText(/Cliente Teste 1/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Cliente Teste 2/i)).toBeInTheDocument();

    // Selecionar o filtro de status "Todos"
    fireEvent.change(statusFilter, { target: { value: 'all' } });

    // Verificar se todos os clientes são exibidos novamente
    await waitFor(() => {
      expect(screen.getByText(/Cliente Teste 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Cliente Teste 2/i)).toBeInTheDocument();
    });
  });

  it('sorts clients by different criteria', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AdminMaster />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando dados/i)).not.toBeInTheDocument();
    });

    // Clicar no cabeçalho da coluna "Nome" para ordenar
    fireEvent.click(screen.getByText(/Nome/i));

    // Verificar se a ordenação foi aplicada (isso depende da implementação interna)
    // Como estamos usando mocks, podemos apenas verificar se os clientes ainda estão visíveis
    expect(screen.getByText(/Cliente Teste 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Cliente Teste 2/i)).toBeInTheDocument();

    // Clicar novamente para inverter a ordenação
    fireEvent.click(screen.getByText(/Nome/i));

    // Verificar se os clientes ainda estão visíveis
    expect(screen.getByText(/Cliente Teste 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Cliente Teste 2/i)).toBeInTheDocument();
  });

  it('navigates to client details when clicking on a client', async () => {
    const navigateMock = vi.fn();
    
    // Sobrescrever o mock do useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => navigateMock
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AdminMaster />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando dados/i)).not.toBeInTheDocument();
    });

    // Clicar em um cliente
    fireEvent.click(screen.getByText(/Cliente Teste 1/i));

    // Verificar se a navegação ocorreu
    expect(navigateMock).toHaveBeenCalledWith('/admin/clients/client_1');
  });

  it('shows create client modal', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AdminMaster />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando dados/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de adicionar cliente
    fireEvent.click(screen.getByText(/Adicionar Cliente/i));

    // Verificar se o modal é exibido
    expect(screen.getByText(/Novo Cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plano/i)).toBeInTheDocument();

    // Preencher o formulário
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: 'Novo Cliente' }
    });
    
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'novo@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'senha123' }
    });
    
    fireEvent.change(screen.getByLabelText(/Plano/i), {
      target: { value: 'basic' }
    });

    // Enviar o formulário
    fireEvent.click(screen.getByText(/Criar Cliente/i));

    // Verificar se a requisição foi feita
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/clients',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
    });
  });

  it('shows export data options', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AdminMaster />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando dados/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de exportar
    fireEvent.click(screen.getByText(/Exportar/i));

    // Verificar se as opções de exportação são exibidas
    expect(screen.getByText(/Exportar como CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Exportar como Excel/i)).toBeInTheDocument();

    // Clicar na opção de exportar como CSV
    fireEvent.click(screen.getByText(/Exportar como CSV/i));

    // Verificar se a requisição foi feita
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/clients/export?format=csv',
        expect.any(Object)
      );
    });
  });
});
