import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { TagManagerContext } from '../../contexts/TagManagerContext';
import TagManagerIntegration from './TagManagerIntegration';

describe('TagManagerIntegration Component', () => {
  const mockIntegration = {
    id: 'integration_123',
    name: 'Meu Site',
    url: 'https://meusite.com.br',
    tagManagerId: 'GTM-ABC123',
    status: 'active',
    settings: {
      position: 'bottom-right',
      autoplay: true,
      showControls: true,
      theme: 'light',
      maxStories: 5,
      showLikes: true,
      showComments: true,
      showShare: true
    },
    createdAt: new Date().toISOString()
  };

  const mockTagManagerContext = {
    integrations: [mockIntegration],
    fetchIntegration: vi.fn().mockResolvedValue(mockIntegration),
    createIntegration: vi.fn().mockResolvedValue({ id: 'new-integration-id' }),
    updateIntegration: vi.fn().mockResolvedValue(mockIntegration),
    deleteIntegration: vi.fn().mockResolvedValue(true),
    testIntegration: vi.fn().mockResolvedValue({ success: true, message: 'Integração testada com sucesso' })
  };

  const mockAuthContext = {
    user: {
      id: '123',
      name: 'Test User'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders integration form when creating new integration', async () => {
    // Sobrescrever o mock para simular uma nova integração
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'new' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se o formulário de configuração está presente
    await waitFor(() => {
      expect(screen.getByText(/Nova Integração/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nome do Site/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/URL do Site/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ID do Google Tag Manager/i)).toBeInTheDocument();
    });
  });

  it('loads existing integration data when editing', async () => {
    // Sobrescrever o mock para simular edição de integração existente
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'integration_123' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se está carregando inicialmente
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(mockTagManagerContext.fetchIntegration).toHaveBeenCalledWith('integration_123');
    });

    // Verificar se os dados da integração foram carregados
    await waitFor(() => {
      expect(screen.getByDisplayValue('Meu Site')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://meusite.com.br')).toBeInTheDocument();
      expect(screen.getByDisplayValue('GTM-ABC123')).toBeInTheDocument();
    });
  });

  it('handles form submission for new integration', async () => {
    // Sobrescrever o mock para simular uma nova integração
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'new' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento do formulário
    await waitFor(() => {
      expect(screen.getByText(/Nova Integração/i)).toBeInTheDocument();
    });

    // Preencher o formulário
    fireEvent.change(screen.getByLabelText(/Nome do Site/i), {
      target: { value: 'Novo Site' }
    });
    
    fireEvent.change(screen.getByLabelText(/URL do Site/i), {
      target: { value: 'https://novosite.com.br' }
    });
    
    fireEvent.change(screen.getByLabelText(/ID do Google Tag Manager/i), {
      target: { value: 'GTM-XYZ789' }
    });

    // Enviar o formulário
    fireEvent.click(screen.getByText(/Salvar Integração/i));

    // Verificar se a função de criação foi chamada com os dados corretos
    await waitFor(() => {
      expect(mockTagManagerContext.createIntegration).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Site',
          url: 'https://novosite.com.br',
          tagManagerId: 'GTM-XYZ789'
        })
      );
    });
  });

  it('handles form submission for updating integration', async () => {
    // Sobrescrever o mock para simular edição de integração existente
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'integration_123' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Modificar o formulário
    fireEvent.change(screen.getByDisplayValue('Meu Site'), {
      target: { value: 'Site Atualizado' }
    });

    // Enviar o formulário
    fireEvent.click(screen.getByText(/Salvar Alterações/i));

    // Verificar se a função de atualização foi chamada com os dados corretos
    await waitFor(() => {
      expect(mockTagManagerContext.updateIntegration).toHaveBeenCalledWith(
        'integration_123',
        expect.objectContaining({
          name: 'Site Atualizado'
        })
      );
    });
  });

  it('shows integration code snippet', async () => {
    // Sobrescrever o mock para simular edição de integração existente
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'integration_123' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Clicar na tab de código de integração
    fireEvent.click(screen.getByText(/Código de Integração/i));

    // Verificar se o código de integração é exibido
    expect(screen.getByText(/Copiar Código/i)).toBeInTheDocument();
    
    // Verificar se o snippet contém o ID do GTM
    const codeSnippet = screen.getByText(/GTM-ABC123/i);
    expect(codeSnippet).toBeInTheDocument();
  });

  it('allows customization of player appearance', async () => {
    // Sobrescrever o mock para simular edição de integração existente
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'integration_123' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Clicar na tab de aparência
    fireEvent.click(screen.getByText(/Aparência/i));

    // Verificar se as opções de aparência são exibidas
    expect(screen.getByText(/Posição do Player/i)).toBeInTheDocument();
    expect(screen.getByText(/Tema/i)).toBeInTheDocument();
    
    // Alterar a posição do player
    const positionSelect = screen.getByLabelText(/Posição do Player/i);
    fireEvent.change(positionSelect, { target: { value: 'top-left' } });
    
    // Alterar o tema
    const themeSelect = screen.getByLabelText(/Tema/i);
    fireEvent.change(themeSelect, { target: { value: 'dark' } });
    
    // Desativar autoplay
    const autoplayToggle = screen.getByLabelText(/Reprodução Automática/i);
    fireEvent.click(autoplayToggle);
    
    // Salvar as alterações
    fireEvent.click(screen.getByText(/Salvar Alterações/i));
    
    // Verificar se a função de atualização foi chamada com os dados corretos
    await waitFor(() => {
      expect(mockTagManagerContext.updateIntegration).toHaveBeenCalledWith(
        'integration_123',
        expect.objectContaining({
          settings: expect.objectContaining({
            position: 'top-left',
            theme: 'dark',
            autoplay: false
          })
        })
      );
    });
  });

  it('tests integration connection', async () => {
    // Sobrescrever o mock para simular edição de integração existente
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'integration_123' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de testar integração
    fireEvent.click(screen.getByText(/Testar Integração/i));
    
    // Verificar se a função de teste foi chamada
    await waitFor(() => {
      expect(mockTagManagerContext.testIntegration).toHaveBeenCalledWith('integration_123');
    });
    
    // Verificar se a mensagem de sucesso é exibida
    expect(screen.getByText(/Integração testada com sucesso/i)).toBeInTheDocument();
  });

  it('handles integration deletion', async () => {
    // Sobrescrever o mock para simular edição de integração existente
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'integration_123' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de excluir integração
    fireEvent.click(screen.getByText(/Excluir Integração/i));
    
    // Verificar se o modal de confirmação aparece
    expect(screen.getByText(/Confirmar Exclusão/i)).toBeInTheDocument();
    
    // Confirmar a exclusão
    fireEvent.click(screen.getByText(/Confirmar/i));
    
    // Verificar se a função de exclusão foi chamada
    await waitFor(() => {
      expect(mockTagManagerContext.deleteIntegration).toHaveBeenCalledWith('integration_123');
    });
  });

  it('shows preview of player appearance', async () => {
    // Sobrescrever o mock para simular edição de integração existente
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ id: 'integration_123' }),
        useNavigate: () => vi.fn()
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TagManagerContext.Provider value={mockTagManagerContext}>
            <TagManagerIntegration />
          </TagManagerContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Clicar na tab de aparência
    fireEvent.click(screen.getByText(/Aparência/i));
    
    // Verificar se a prévia é exibida
    expect(screen.getByText(/Prévia do Player/i)).toBeInTheDocument();
    
    // Verificar se o player de prévia está presente
    const previewContainer = screen.getByTestId('player-preview');
    expect(previewContainer).toBeInTheDocument();
    
    // Verificar se a posição atual está refletida na prévia
    expect(previewContainer).toHaveClass('bottom-right');
  });
});
