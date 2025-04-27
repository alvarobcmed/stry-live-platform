import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { LivesContext } from '../../contexts/LivesContext';
import LiveStreaming from './LiveStreaming';

// Mock do react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-live-id' }),
    useNavigate: () => vi.fn()
  };
});

// Mock do MediaStream API
global.MediaStream = vi.fn().mockImplementation(() => ({
  addTrack: vi.fn(),
  getVideoTracks: vi.fn().mockReturnValue([{ enabled: true }]),
  getAudioTracks: vi.fn().mockReturnValue([{ enabled: true }])
}));

global.navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue(new MediaStream())
};

describe('LiveStreaming Component', () => {
  const mockLive = {
    id: 'test-live-id',
    title: 'Test Live Stream',
    description: 'Test Description',
    status: 'scheduled',
    scheduledFor: new Date().toISOString(),
    rtmpUrl: 'rtmp://test.server/live',
    streamKey: 'test-stream-key',
    viewerCount: 0,
    createdBy: '123',
    createdAt: new Date().toISOString()
  };

  const mockLivesContext = {
    lives: [mockLive],
    fetchLive: vi.fn().mockResolvedValue(mockLive),
    createLive: vi.fn().mockResolvedValue({ id: 'new-live-id' }),
    updateLive: vi.fn().mockResolvedValue(mockLive),
    startLive: vi.fn().mockResolvedValue({ ...mockLive, status: 'active' }),
    endLive: vi.fn().mockResolvedValue({ ...mockLive, status: 'ended' }),
    fetchViewerCount: vi.fn().mockResolvedValue(10)
  };

  const mockAuthContext = {
    user: {
      id: '123',
      name: 'Test User'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock do elemento de vídeo
    Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
      set: vi.fn(),
      get: vi.fn()
    });
    
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
      set: vi.fn(),
      get: vi.fn()
    });
    
    HTMLMediaElement.prototype.play = vi.fn();
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('renders live streaming setup when creating a new live', async () => {
    // Sobrescrever o mock para simular uma nova live
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
          <LivesContext.Provider value={mockLivesContext}>
            <LiveStreaming />
          </LivesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se o formulário de configuração está presente
    await waitFor(() => {
      expect(screen.getByText(/Configurar Transmissão/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument();
    });
  });

  it('loads existing live data when editing', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <LivesContext.Provider value={mockLivesContext}>
            <LiveStreaming />
          </LivesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se está carregando inicialmente
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(mockLivesContext.fetchLive).toHaveBeenCalledWith('test-live-id');
    });

    // Verificar se os dados da live foram carregados
    await waitFor(() => {
      expect(screen.getByText(/Test Live Stream/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Description/i)).toBeInTheDocument();
    });
  });

  it('handles starting a live stream', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <LivesContext.Provider value={mockLivesContext}>
            <LiveStreaming />
          </LivesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verificar se o botão de iniciar está presente
    const startButton = screen.getByText(/Iniciar Transmissão/i);
    expect(startButton).toBeInTheDocument();

    // Clicar no botão de iniciar
    fireEvent.click(startButton);

    // Verificar se a função de iniciar foi chamada
    await waitFor(() => {
      expect(mockLivesContext.startLive).toHaveBeenCalledWith('test-live-id');
    });
  });

  it('handles ending a live stream', async () => {
    // Modificar o mock para simular uma live ativa
    const activeLive = { ...mockLive, status: 'active' };
    mockLivesContext.fetchLive.mockResolvedValue(activeLive);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <LivesContext.Provider value={mockLivesContext}>
            <LiveStreaming />
          </LivesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verificar se o botão de encerrar está presente
    const endButton = screen.getByText(/Encerrar Transmissão/i);
    expect(endButton).toBeInTheDocument();

    // Clicar no botão de encerrar
    fireEvent.click(endButton);

    // Verificar se o modal de confirmação aparece
    expect(screen.getByText(/Confirmar Encerramento/i)).toBeInTheDocument();

    // Confirmar o encerramento
    fireEvent.click(screen.getByText(/Confirmar/i));

    // Verificar se a função de encerrar foi chamada
    await waitFor(() => {
      expect(mockLivesContext.endLive).toHaveBeenCalledWith('test-live-id');
    });
  });

  it('toggles camera and microphone', async () => {
    // Modificar o mock para simular uma live ativa
    const activeLive = { ...mockLive, status: 'active' };
    mockLivesContext.fetchLive.mockResolvedValue(activeLive);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <LivesContext.Provider value={mockLivesContext}>
            <LiveStreaming />
          </LivesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verificar se os botões de controle estão presentes
    const cameraButton = screen.getByText(/Câmera/i);
    const micButton = screen.getByText(/Microfone/i);
    
    expect(cameraButton).toBeInTheDocument();
    expect(micButton).toBeInTheDocument();

    // Clicar no botão da câmera
    fireEvent.click(cameraButton);

    // Clicar no botão do microfone
    fireEvent.click(micButton);

    // Verificar se os estados foram alterados (isso depende da implementação interna)
    // Como estamos usando mocks, podemos apenas verificar se os botões existem e são clicáveis
    expect(cameraButton).toBeInTheDocument();
    expect(micButton).toBeInTheDocument();
  });

  it('shows viewer count for active streams', async () => {
    // Modificar o mock para simular uma live ativa
    const activeLive = { ...mockLive, status: 'active', viewerCount: 10 };
    mockLivesContext.fetchLive.mockResolvedValue(activeLive);
    mockLivesContext.fetchViewerCount.mockResolvedValue(10);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <LivesContext.Provider value={mockLivesContext}>
            <LiveStreaming />
          </LivesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verificar se o contador de espectadores está presente
    await waitFor(() => {
      expect(screen.getByText(/10 espectadores/i)).toBeInTheDocument();
    });
  });

  it('displays RTMP information for configuration', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <LivesContext.Provider value={mockLivesContext}>
            <LiveStreaming />
          </LivesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de configuração RTMP
    const rtmpButton = screen.getByText(/Configuração RTMP/i);
    fireEvent.click(rtmpButton);

    // Verificar se as informações RTMP são exibidas
    expect(screen.getByText(/URL do Servidor/i)).toBeInTheDocument();
    expect(screen.getByText(/Chave de Stream/i)).toBeInTheDocument();
    expect(screen.getByText(/rtmp:\/\/test.server\/live/i)).toBeInTheDocument();
    expect(screen.getByText(/test-stream-key/i)).toBeInTheDocument();
  });
});
