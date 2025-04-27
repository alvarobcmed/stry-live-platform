import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { SubscriptionContext } from '../../contexts/SubscriptionContext';
import SubscriptionManager from './SubscriptionManager';

describe('SubscriptionManager Component', () => {
  const mockSubscription = {
    id: 'sub_123456',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 dias no futuro
    cancel_at_period_end: false,
    plan: {
      id: 'plan_basic',
      name: 'Plano Básico',
      amount: 9900, // R$ 99,00
      interval: 'month'
    }
  };

  const mockPlans = [
    {
      id: 'plan_basic',
      name: 'Plano Básico',
      amount: 9900,
      interval: 'month',
      features: ['5 stories por mês', 'Suporte por email', 'Analytics básico']
    },
    {
      id: 'plan_pro',
      name: 'Plano Profissional',
      amount: 19900,
      interval: 'month',
      features: ['Stories ilimitados', 'Lives', 'Suporte prioritário', 'Analytics avançado']
    },
    {
      id: 'plan_enterprise',
      name: 'Plano Empresarial',
      amount: 39900,
      interval: 'month',
      features: ['Stories ilimitados', 'Lives ilimitadas', 'Suporte 24/7', 'Analytics avançado', 'API de integração']
    }
  ];

  const mockSubscriptionContext = {
    subscription: mockSubscription,
    plans: mockPlans,
    fetchSubscription: vi.fn().mockResolvedValue(mockSubscription),
    fetchPlans: vi.fn().mockResolvedValue(mockPlans),
    createCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
    createCustomerPortalSession: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' }),
    cancelSubscription: vi.fn().mockResolvedValue({ success: true }),
    updateSubscription: vi.fn().mockResolvedValue({ success: true })
  };

  const mockAuthContext = {
    user: {
      id: '123',
      name: 'Test User'
    }
  };

  // Mock para window.location
  const originalLocation = window.location;
  beforeEach(() => {
    delete window.location;
    window.location = { href: '' };
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('renders subscription details when user has an active subscription', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <SubscriptionContext.Provider value={mockSubscriptionContext}>
            <SubscriptionManager />
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se está carregando inicialmente
    expect(screen.getByText(/Carregando informações da assinatura/i)).toBeInTheDocument();

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(mockSubscriptionContext.fetchSubscription).toHaveBeenCalled();
      expect(mockSubscriptionContext.fetchPlans).toHaveBeenCalled();
    });

    // Verificar se os detalhes da assinatura são exibidos
    await waitFor(() => {
      expect(screen.getByText(/Sua Assinatura Atual/i)).toBeInTheDocument();
      expect(screen.getByText(/Plano Básico/i)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 99,00/i)).toBeInTheDocument();
      expect(screen.getByText(/Ativa/i)).toBeInTheDocument();
    });
  });

  it('displays available plans', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <SubscriptionContext.Provider value={mockSubscriptionContext}>
            <SubscriptionManager />
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando informações da assinatura/i)).not.toBeInTheDocument();
    });

    // Verificar se os planos disponíveis são exibidos
    expect(screen.getByText(/Planos Disponíveis/i)).toBeInTheDocument();
    expect(screen.getByText(/Plano Básico/i)).toBeInTheDocument();
    expect(screen.getByText(/Plano Profissional/i)).toBeInTheDocument();
    expect(screen.getByText(/Plano Empresarial/i)).toBeInTheDocument();

    // Verificar se as características dos planos são exibidas
    expect(screen.getByText(/5 stories por mês/i)).toBeInTheDocument();
    expect(screen.getByText(/Stories ilimitados/i)).toBeInTheDocument();
    expect(screen.getByText(/Suporte 24\/7/i)).toBeInTheDocument();
  });

  it('handles subscription cancellation', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <SubscriptionContext.Provider value={mockSubscriptionContext}>
            <SubscriptionManager />
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando informações da assinatura/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de cancelar assinatura
    fireEvent.click(screen.getByText(/Cancelar Assinatura/i));

    // Verificar se o modal de confirmação aparece
    expect(screen.getByText(/Tem certeza que deseja cancelar sua assinatura?/i)).toBeInTheDocument();

    // Preencher o motivo do cancelamento
    const reasonInput = screen.getByLabelText(/Motivo do cancelamento/i);
    fireEvent.change(reasonInput, { target: { value: 'Muito caro' } });

    // Confirmar o cancelamento
    fireEvent.click(screen.getByText(/Confirmar Cancelamento/i));

    // Verificar se a função de cancelamento foi chamada
    await waitFor(() => {
      expect(mockSubscriptionContext.cancelSubscription).toHaveBeenCalledWith('Muito caro');
    });
  });

  it('redirects to Stripe Customer Portal', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <SubscriptionContext.Provider value={mockSubscriptionContext}>
            <SubscriptionManager />
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando informações da assinatura/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de gerenciar pagamento
    fireEvent.click(screen.getByText(/Gerenciar Pagamento/i));

    // Verificar se a função de criar sessão do portal foi chamada
    await waitFor(() => {
      expect(mockSubscriptionContext.createCustomerPortalSession).toHaveBeenCalled();
    });

    // Verificar se o redirecionamento ocorreu
    expect(window.location.href).toBe('https://billing.stripe.com/test');
  });

  it('handles plan upgrade', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <SubscriptionContext.Provider value={mockSubscriptionContext}>
            <SubscriptionManager />
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando informações da assinatura/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de upgrade para o plano Pro
    const upgradeButtons = screen.getAllByText(/Fazer Upgrade/i);
    fireEvent.click(upgradeButtons[0]);

    // Verificar se o modal de confirmação aparece
    expect(screen.getByText(/Fazer Upgrade de Plano/i)).toBeInTheDocument();

    // Confirmar o upgrade
    fireEvent.click(screen.getByText(/Confirmar Upgrade/i));

    // Verificar se a função de atualização foi chamada
    await waitFor(() => {
      expect(mockSubscriptionContext.updateSubscription).toHaveBeenCalledWith('plan_pro');
    });
  });

  it('handles plan downgrade', async () => {
    // Modificar o mock para simular um plano superior
    const proSubscription = {
      ...mockSubscription,
      plan: {
        id: 'plan_pro',
        name: 'Plano Profissional',
        amount: 19900,
        interval: 'month'
      }
    };
    
    const proSubscriptionContext = {
      ...mockSubscriptionContext,
      subscription: proSubscription,
      fetchSubscription: vi.fn().mockResolvedValue(proSubscription)
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <SubscriptionContext.Provider value={proSubscriptionContext}>
            <SubscriptionManager />
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando informações da assinatura/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de downgrade para o plano Básico
    const downgradeButtons = screen.getAllByText(/Fazer Downgrade/i);
    fireEvent.click(downgradeButtons[0]);

    // Verificar se o modal de confirmação aparece
    expect(screen.getByText(/Fazer Downgrade de Plano/i)).toBeInTheDocument();

    // Confirmar o downgrade
    fireEvent.click(screen.getByText(/Confirmar Downgrade/i));

    // Verificar se a função de atualização foi chamada
    await waitFor(() => {
      expect(proSubscriptionContext.updateSubscription).toHaveBeenCalledWith('plan_basic');
    });
  });

  it('shows subscription signup for new users', async () => {
    // Modificar o mock para simular um usuário sem assinatura
    const noSubscriptionContext = {
      ...mockSubscriptionContext,
      subscription: null,
      fetchSubscription: vi.fn().mockResolvedValue(null)
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <SubscriptionContext.Provider value={noSubscriptionContext}>
            <SubscriptionManager />
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando informações da assinatura/i)).not.toBeInTheDocument();
    });

    // Verificar se a mensagem para novos usuários é exibida
    expect(screen.getByText(/Você não possui uma assinatura ativa/i)).toBeInTheDocument();
    
    // Verificar se os botões de assinatura estão presentes
    const subscribeButtons = screen.getAllByText(/Assinar/i);
    expect(subscribeButtons.length).toBeGreaterThan(0);

    // Selecionar um plano e clicar em assinar
    fireEvent.click(screen.getByText(/Plano Básico/i));
    fireEvent.click(subscribeButtons[0]);

    // Verificar se a função de checkout foi chamada
    await waitFor(() => {
      expect(noSubscriptionContext.createCheckoutSession).toHaveBeenCalled();
    });

    // Verificar se o redirecionamento ocorreu
    expect(window.location.href).toBe('https://checkout.stripe.com/test');
  });
});
