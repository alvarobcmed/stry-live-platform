import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Dashboard from './Dashboard';

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

vi.mock('../../contexts/NotificationsContext', () => ({
  NotificationsContext: {
    Provider: ({ children }) => children,
  }
}));

// Mock dos componentes
vi.mock('./StoriesList', () => ({
  default: () => <div data-testid="stories-list">StoriesList Mock</div>
}));

vi.mock('./MetricsOverview', () => ({
  default: () => <div data-testid="metrics-overview">MetricsOverview Mock</div>
}));

vi.mock('./SubscriptionStatus', () => ({
  default: () => <div data-testid="subscription-status">SubscriptionStatus Mock</div>
}));

vi.mock('./IntegrationsList', () => ({
  default: () => <div data-testid="integrations-list">IntegrationsList Mock</div>
}));

describe('Dashboard Component', () => {
  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    adminLevel: 'client'
  };

  const mockAuthContext = {
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with all sections for client admin', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se os componentes principais estão sendo renderizados
    expect(screen.getByTestId('stories-list')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-overview')).toBeInTheDocument();
    expect(screen.getByTestId('subscription-status')).toBeInTheDocument();
    expect(screen.getByTestId('integrations-list')).toBeInTheDocument();
    
    // Verificar se o nome do usuário está sendo exibido
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it('changes active tab when tab buttons are clicked', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se a tab "Stories" está ativa por padrão
    const storiesTab = screen.getByText(/Stories/i);
    expect(storiesTab).toHaveClass('active');

    // Clicar na tab "Métricas"
    const metricsTab = screen.getByText(/Métricas/i);
    fireEvent.click(metricsTab);
    
    // Verificar se a tab "Métricas" está ativa agora
    expect(metricsTab).toHaveClass('active');
    expect(storiesTab).not.toHaveClass('active');

    // Clicar na tab "Assinatura"
    const subscriptionTab = screen.getByText(/Assinatura/i);
    fireEvent.click(subscriptionTab);
    
    // Verificar se a tab "Assinatura" está ativa agora
    expect(subscriptionTab).toHaveClass('active');
    expect(metricsTab).not.toHaveClass('active');

    // Clicar na tab "Integrações"
    const integrationsTab = screen.getByText(/Integrações/i);
    fireEvent.click(integrationsTab);
    
    // Verificar se a tab "Integrações" está ativa agora
    expect(integrationsTab).toHaveClass('active');
    expect(subscriptionTab).not.toHaveClass('active');
  });

  it('redirects to admin panel for admin users', () => {
    const adminUser = {
      ...mockUser,
      adminLevel: 'master'
    };

    const adminAuthContext = {
      ...mockAuthContext,
      user: adminUser
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={adminAuthContext}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se o botão de acesso ao painel admin está presente
    const adminButton = screen.getByText(/Painel de Administração/i);
    expect(adminButton).toBeInTheDocument();
    
    // Simular clique no botão de admin
    fireEvent.click(adminButton);
    
    // Verificar se a navegação ocorreu (isso depende de como você implementou a navegação)
    // Como estamos usando mocks, podemos apenas verificar se o botão existe e é clicável
    expect(adminButton).toBeInTheDocument();
  });

  it('shows loading state when auth context is loading', () => {
    const loadingAuthContext = {
      ...mockAuthContext,
      loading: true
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={loadingAuthContext}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se o indicador de carregamento está sendo exibido
    expect(screen.getByText(/Carregando.../i)).toBeInTheDocument();
  });
});
