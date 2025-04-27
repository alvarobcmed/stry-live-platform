import React, { useState, useEffect, useContext } from 'react';
import { NotificationsContext } from '../../contexts/NotificationsContext';
import { FaBell, FaTrash, FaCog, FaCheck, FaTimes, FaMobile, FaDesktop, FaGlobe } from 'react-icons/fa';
import './NotificationsManager.css';

const NotificationsManager = () => {
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    deleteNotification,
    registerDevice,
    updateSettings
  } = useContext(NotificationsContext);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    newStoryNotification: true,
    newLiveNotification: true,
    commentNotification: true,
    systemNotification: true
  });
  const [devices, setDevices] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  useEffect(() => {
    const loadNotificationsData = async () => {
      setLoading(true);
      try {
        await fetchNotifications();
        await fetchDevices();
        await fetchSettings();
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotificationsData();
  }, [fetchNotifications]);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/notifications/devices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações de notificação:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (notificationToDelete) {
      try {
        await deleteNotification(notificationToDelete.id);
        setShowDeleteModal(false);
        setNotificationToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir notificação:', error);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };

  const handleRemoveDevice = async (deviceId) => {
    try {
      const response = await fetch(`/api/notifications/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setDevices(devices.filter(device => device.id !== deviceId));
      }
    } catch (error) {
      console.error('Erro ao remover dispositivo:', error);
    }
  };

  const handleSettingsChange = async (setting, value) => {
    const updatedSettings = { ...settings, [setting]: value };
    setSettings(updatedSettings);
    
    try {
      await updateSettings(updatedSettings);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      // Reverter alteração em caso de erro
      setSettings(settings);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay} ${diffDay === 1 ? 'dia' : 'dias'} atrás`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hora' : 'horas'} atrás`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'} atrás`;
    } else {
      return 'Agora mesmo';
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <FaMobile />;
      case 'desktop':
        return <FaDesktop />;
      default:
        return <FaGlobe />;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'story':
        return <span className="notification-icon story">📖</span>;
      case 'live':
        return <span className="notification-icon live">🔴</span>;
      case 'comment':
        return <span className="notification-icon comment">💬</span>;
      case 'system':
        return <span className="notification-icon system">⚙️</span>;
      default:
        return <span className="notification-icon">📢</span>;
    }
  };

  const renderNotifications = () => {
    if (loading) {
      return (
        <div className="notifications-loading">
          <div className="spinner"></div>
          <p>Carregando notificações...</p>
        </div>
      );
    }
    
    const filteredNotifications = notifications.filter(notification => {
      if (activeTab === 'inbox') {
        return true;
      } else if (activeTab === 'unread') {
        return !notification.read;
      }
      return notification.type === activeTab;
    });
    
    if (filteredNotifications.length === 0) {
      return (
        <div className="no-notifications">
          <div className="empty-icon">
            <FaBell />
          </div>
          <p>Nenhuma notificação {activeTab === 'unread' ? 'não lida' : ''}</p>
        </div>
      );
    }
    
    return (
      <div className="notifications-list">
        {filteredNotifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
          >
            {getNotificationIcon(notification.type)}
            
            <div className="notification-content" onClick={() => handleMarkAsRead(notification.id)}>
              <div className="notification-header">
                <h4 className="notification-title">{notification.title}</h4>
                <span className="notification-time">{formatDate(notification.createdAt)}</span>
              </div>
              <p className="notification-message">{notification.message}</p>
              
              {notification.actionUrl && (
                <a href={notification.actionUrl} className="notification-action">
                  {notification.actionText || 'Ver detalhes'}
                </a>
              )}
            </div>
            
            <div className="notification-actions">
              {!notification.read && (
                <button 
                  className="mark-read-button"
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="Marcar como lida"
                >
                  <FaCheck />
                </button>
              )}
              <button 
                className="delete-button"
                onClick={() => handleDeleteClick(notification)}
                title="Excluir notificação"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDevices = () => {
    if (loading) {
      return (
        <div className="devices-loading">
          <div className="spinner"></div>
          <p>Carregando dispositivos...</p>
        </div>
      );
    }
    
    if (devices.length === 0) {
      return (
        <div className="no-devices">
          <p>Nenhum dispositivo registrado para notificações push.</p>
          <button className="register-device-button" onClick={registerCurrentDevice}>
            Registrar Este Dispositivo
          </button>
        </div>
      );
    }
    
    return (
      <div className="devices-list">
        {devices.map(device => (
          <div key={device.id} className="device-item">
            <div className="device-icon">
              {getDeviceIcon(device.type)}
            </div>
            
            <div className="device-info">
              <h4 className="device-name">{device.name}</h4>
              <p className="device-details">
                {device.browser} • {device.os} • 
                {device.current ? ' Este dispositivo' : ` Último acesso: ${formatDate(device.lastActive)}`}
              </p>
            </div>
            
            <div className="device-actions">
              <button 
                className="remove-device-button"
                onClick={() => handleRemoveDevice(device.id)}
                disabled={device.current}
                title={device.current ? 'Não é possível remover o dispositivo atual' : 'Remover dispositivo'}
              >
                <FaTimes />
              </button>
            </div>
          </div>
        ))}
        
        <button className="register-device-button" onClick={registerCurrentDevice}>
          Registrar Outro Dispositivo
        </button>
      </div>
    );
  };

  const registerCurrentDevice = async () => {
    try {
      const deviceInfo = {
        name: navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvel' : 'Computador',
        type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        browser: getBrowserName(),
        os: getOSName()
      };
      
      await registerDevice(deviceInfo);
      await fetchDevices();
    } catch (error) {
      console.error('Erro ao registrar dispositivo:', error);
    }
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    
    return 'Navegador desconhecido';
  };

  const getOSName = () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    
    return 'Sistema desconhecido';
  };

  const renderSettings = () => {
    return (
      <div className="notification-settings">
        <div className="settings-section">
          <h3>Canais de Notificação</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Notificações Push</h4>
              <p>Receba notificações no navegador e dispositivos móveis</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.pushEnabled} 
                onChange={(e) => handleSettingsChange('pushEnabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Notificações por Email</h4>
              <p>Receba notificações no seu endereço de email</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.emailEnabled} 
                onChange={(e) => handleSettingsChange('emailEnabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Tipos de Notificação</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Novos Stories</h4>
              <p>Quando novos stories forem publicados</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.newStoryNotification} 
                onChange={(e) => handleSettingsChange('newStoryNotification', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Novas Lives</h4>
              <p>Quando novas transmissões ao vivo começarem</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.newLiveNotification} 
                onChange={(e) => handleSettingsChange('newLiveNotification', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Comentários</h4>
              <p>Quando alguém comentar em seus stories ou lives</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.commentNotification} 
                onChange={(e) => handleSettingsChange('commentNotification', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Sistema</h4>
              <p>Atualizações importantes sobre sua conta e assinatura</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.systemNotification} 
                onChange={(e) => handleSettingsChange('systemNotification', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="notifications-manager-container">
      <div className="notifications-header">
        <h1>
          <FaBell /> Notificações
        </h1>
        <button 
          className="settings-button"
          onClick={() => setActiveTab('settings')}
        >
          <FaCog /> Configurações
        </button>
      </div>
      
      <div className="notifications-tabs">
        <button 
          className={`tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Todas
        </button>
        <button 
          className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Não Lidas
        </button>
        <button 
          className={`tab-button ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          Stories
        </button>
        <button 
          className={`tab-button ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Lives
        </button>
        <button 
          className={`tab-button ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          Dispositivos
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Configurações
        </button>
      </div>
      
      <div className="notifications-content">
        {activeTab === 'devices' ? renderDevices() : 
         activeTab === 'settings' ? renderSettings() : 
         renderNotifications()}
      </div>
      
      {showDeleteModal && (
        <div className="delete-confirmation-modal">
          <div className="delete-confirmation-content">
            <h3>Confirmar exclusão</h3>
            <p>Tem certeza que deseja excluir esta notificação?</p>
            <div className="delete-confirmation-actions">
              <button 
                className="cancel-button"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button"
                onClick={handleConfirmDelete}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsManager;
