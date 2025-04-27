import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { NotificationsContext } from '../../contexts/NotificationsContext';
import NotificationsManager from './NotificationsManager';

describe('NotificationsManager Component', () => {
  const mockNotifications = [
    {
      id: 'notif_1',
      title: 'Novo Story',
      message: 'Um novo story foi publicado',
      type: 'story',
      read: false,
      actionUrl: '/stories/123',
      actionText: 'Ver Story',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutos atrás
    },
    {
      id: 'notif_2',
      title: 'Nova Live',
      message: 'Uma nova live começou',
      type: 'live',
      read: true,
      actionUrl: '/lives/456',
      actionText: 'Assistir Live',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hora atrás
    },
    {
      id: 'notif_3',
      title: 'Comentário',
      message: 'Alguém comentou no seu story',
      type: 'comment',
      read: false,
      actionUrl: '/stories/123/comments',
      actionText: 'Ver Comentário',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 horas atrás
    }
  ];

  const mockDevices = [
    {
      id: 'device_1',
      name: 'Chrome no Windows',
      type: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      current: true,
      lastActive: new Date().toISOString()
    },
    {
      id: 'device_2',
      name: 'Safari no iPhone',
      type: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      current: false,
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 dia atrás
    }
  ];

  const mockSettings = {
    pushEnabled: true,
    emailEnabled: true,
    newStoryNotification: true,
    newLiveNotification: true,
    commentNotification: true,
    systemNotification: true
  };

  const mockNotificationsContext = {
    notifications: mockNotifications,
    fetchNotifications: vi.fn().mockResolvedValue(mockNotifications),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    deleteNotification: vi.fn().mockResolvedValue({ success: true }),
    registerDevice: vi.fn().mockResolvedValue({ success: true }),
    updateSettings: vi.fn().mockResolvedValue({ success: true })
  };

  const mockAuthContext = {
    user: {
      id: '123',
      name: 'Test User'
    }
  };

  // Mock para fetch API
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/notifications/devices')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDevices)
      });
    }
    if (url.includes('/api/notifications/settings')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSettings)
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('renders notifications list', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationsContext.Provider value={mockNotificationsContext}>
            <NotificationsManager />
          </NotificationsContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se está carregando inicialmente
    expect(screen.getByText(/Carregando notificações/i)).toBeInTheDocument();

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(mockNotificationsContext.fetchNotifications).toHaveBeenCalled();
    });

    // Verificar se as notificações são exibidas
    await waitFor(() => {
      expect(screen.getByText(/Novo Story/i)).toBeInTheDocument();
      expect(screen.getByText(/Nova Live/i)).toBeInTheDocument();
      expect(screen.getByText(/Comentário/i)).toBeInTheDocument();
    });

    // Verificar se o status de leitura é exibido corretamente
    const unreadNotifications = screen.getAllByClassName('notification-item unread');
    const readNotifications = screen.getAllByClassName('notification-item read');
    expect(unreadNotifications.length).toBe(2);
    expect(readNotifications.length).toBe(1);
  });

  it('filters notifications by tab', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationsContext.Provider value={mockNotificationsContext}>
            <NotificationsManager />
          </NotificationsContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando notificações/i)).not.toBeInTheDocument();
    });

    // Clicar na tab "Não Lidas"
    fireEvent.click(screen.getByText(/Não Lidas/i));

    // Verificar se apenas as notificações não lidas são exibidas
    expect(screen.getByText(/Novo Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Comentário/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nova Live/i)).not.toBeInTheDocument();

    // Clicar na tab "Stories"
    fireEvent.click(screen.getByText(/Stories/i));

    // Verificar se apenas as notificações de stories são exibidas
    expect(screen.getByText(/Novo Story/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nova Live/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Comentário/i)).not.toBeInTheDocument();
  });

  it('marks notification as read', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationsContext.Provider value={mockNotificationsContext}>
            <NotificationsManager />
          </NotificationsContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando notificações/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de marcar como lida
    const markReadButtons = screen.getAllByTitle('Marcar como lida');
    fireEvent.click(markReadButtons[0]);

    // Verificar se a função de marcar como lida foi chamada
    await waitFor(() => {
      expect(mockNotificationsContext.markAsRead).toHaveBeenCalledWith('notif_1');
    });
  });

  it('deletes notification', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationsContext.Provider value={mockNotificationsContext}>
            <NotificationsManager />
          </NotificationsContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando notificações/i)).not.toBeInTheDocument();
    });

    // Clicar no botão de excluir
    const deleteButtons = screen.getAllByTitle('Excluir notificação');
    fireEvent.click(deleteButtons[0]);

    // Verificar se o modal de confirmação aparece
    expect(screen.getByText(/Confirmar exclusão/i)).toBeInTheDocument();

    // Confirmar a exclusão
    fireEvent.click(screen.getByText(/Confirmar Exclusão/i));

    // Verificar se a função de exclusão foi chamada
    await waitFor(() => {
      expect(mockNotificationsContext.deleteNotification).toHaveBeenCalledWith('notif_1');
    });
  });

  it('displays devices list', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationsContext.Provider value={mockNotificationsContext}>
            <NotificationsManager />
          </NotificationsContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando notificações/i)).not.toBeInTheDocument();
    });

    // Clicar na tab "Dispositivos"
    fireEvent.click(screen.getByText(/Dispositivos/i));

    // Verificar se os dispositivos são exibidos
    await waitFor(() => {
      expect(screen.getByText(/Chrome no Windows/i)).toBeInTheDocument();
      expect(screen.getByText(/Safari no iPhone/i)).toBeInTheDocument();
    });

    // Verificar se o dispositivo atual é identificado
    expect(screen.getByText(/Este dispositivo/i)).toBeInTheDocument();
  });

  it('manages notification settings', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationsContext.Provider value={mockNotificationsContext}>
            <NotificationsManager />
          </NotificationsContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando notificações/i)).not.toBeInTheDocument();
    });

    // Clicar na tab "Configurações"
    fireEvent.click(screen.getByText(/Configurações/i));

    // Verificar se as configurações são exibidas
    await waitFor(() => {
      expect(screen.getByText(/Canais de Notificação/i)).toBeInTheDocument();
      expect(screen.getByText(/Tipos de Notificação/i)).toBeInTheDocument();
    });

    // Alterar uma configuração
    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[0]); // Desativar notificações push

    // Verificar se a função de atualização foi chamada
    await waitFor(() => {
      expect(mockNotificationsContext.updateSettings).toHaveBeenCalledWith({
        ...mockSettings,
        pushEnabled: false
      });
    });
  });

  it('removes device', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationsContext.Provider value={mockNotificationsContext}>
            <NotificationsManager />
          </NotificationsContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando notificações/i)).not.toBeInTheDocument();
    });

    // Clicar na tab "Dispositivos"
    fireEvent.click(screen.getByText(/Dispositivos/i));

    // Esperar pelo carregamento dos dispositivos
    await waitFor(() => {
      expect(screen.getByText(/Safari no iPhone/i)).toBeInTheDocument();
    });

    // Clicar no botão de remover dispositivo
    const removeButtons = screen.getAllByTitle('Remover dispositivo');
    fireEvent.click(removeButtons[0]);

    // Verificar se a requisição de remoção foi feita
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/devices/device_2',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  it('registers current device', async () => {
    // Mock para navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationsContext.Provider value={mockNotificationsContext}>
            <NotificationsManager />
          </NotificationsContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando notificações/i)).not.toBeInTheDocument();
    });

    // Clicar na tab "Dispositivos"
    fireEvent.click(screen.getByText(/Dispositivos/i));

    // Esperar pelo carregamento dos dispositivos
    await waitFor(() => {
      expect(screen.getByText(/Registrar Outro Dispositivo/i)).toBeInTheDocument();
    });

    // Clicar no botão de registrar dispositivo
    fireEvent.click(screen.getByText(/Registrar Outro Dispositivo/i));

    // Verificar se a função de registro foi chamada
    await waitFor(() => {
      expect(mockNotificationsContext.registerDevice).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'desktop',
          browser: 'Chrome'
        })
      );
    });
  });
});
