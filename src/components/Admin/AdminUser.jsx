import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { FaUser, FaChartLine, FaEdit, FaEye } from 'react-icons/fa';
import './AdminUser.css';

const AdminUser = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stories, setStories] = useState([]);
  const [lives, setLives] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Verificar se o usuário é Admin Usuário
    if (user && user.adminLevel !== 'user') {
      // Redirecionar para página de acesso negado ou dashboard normal
      window.location.href = '/dashboard';
    }
  }, [user]);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case 'dashboard':
            await fetchUserData();
            break;
          case 'stories':
            await fetchStories();
            break;
          case 'lives':
            await fetchLives();
            break;
          default:
            await fetchUserData();
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [activeTab, currentPage]);

  const fetchUserData = async () => {
    try {
      // Buscar dados do usuário
      const userResponse = await fetch(`/api/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserData(userData);
        setPermissions(userData.permissions);
      }
      
      // Buscar contagem de stories e lives
      await Promise.all([
        fetchStoriesCount(),
        fetchLivesCount()
      ]);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  };

  const fetchStoriesCount = async () => {
    try {
      const response = await fetch(`/api/stories/count?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStories({ count: data.count });
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de stories:', error);
    }
  };

  const fetchLivesCount = async () => {
    try {
      const response = await fetch(`/api/lives/count?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLives({ count: data.count });
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de lives:', error);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await fetch(`/api/stories?userId=${user.id}&page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStories(data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao buscar stories:', error);
    }
  };

  const fetchLives = async () => {
    try {
      const response = await fetch(`/api/lives?userId=${user.id}&page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLives(data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao buscar lives:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDashboard = () => {
    if (!userData) return <div className="loading-indicator">Carregando dados...</div>;
    
    return (
      <div className="user-dashboard">
        <div className="user-profile">
          <div className="profile-header">
            <div className="profile-avatar">
              <FaUser />
            </div>
            <div className="profile-info">
              <h2>{userData.name}</h2>
              <p>{userData.email}</p>
              <span className={`role-badge ${userData.role}`}>{userData.role}</span>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status-${userData.status}`}>
                {userData.status}
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Cliente:</span>
              <span className="detail-value">{userData.clientId}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Criado em:</span>
              <span className="detail-value">{formatDate(userData.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-icon stories">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <h3>Stories</h3>
              <p className="stat-value">{stories.count || 0}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon lives">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <h3>Lives</h3>
              <p className="stat-value">{lives.count || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="user-permissions">
          <h3>Suas Permissões</h3>
          
          {permissions ? (
            <div className="permissions-list">
              <div className="permission-group">
                <h4>Stories</h4>
                <ul>
                  <li className={permissions.stories?.create ? 'allowed' : 'denied'}>
                    {permissions.stories?.create ? 'Pode criar stories' : 'Não pode criar stories'}
                  </li>
                  <li className={permissions.stories?.read ? 'allowed' : 'denied'}>
                    {permissions.stories?.read ? 'Pode visualizar stories' : 'Não pode visualizar stories'}
                  </li>
                  <li className={permissions.stories?.update ? 'allowed' : 'denied'}>
                    {permissions.stories?.update ? 'Pode editar stories' : 'Não pode editar stories'}
                  </li>
                  <li className={permissions.stories?.delete ? 'allowed' : 'denied'}>
                    {permissions.stories?.delete ? 'Pode excluir stories' : 'Não pode excluir stories'}
                  </li>
                </ul>
              </div>
              
              <div className="permission-group">
                <h4>Lives</h4>
                <ul>
                  <li className={permissions.lives?.create ? 'allowed' : 'denied'}>
                    {permissions.lives?.create ? 'Pode criar lives' : 'Não pode criar lives'}
                  </li>
                  <li className={permissions.lives?.read ? 'allowed' : 'denied'}>
                    {permissions.lives?.read ? 'Pode visualizar lives' : 'Não pode visualizar lives'}
                  </li>
                  <li className={permissions.lives?.update ? 'allowed' : 'denied'}>
                    {permissions.lives?.update ? 'Pode editar lives' : 'Não pode editar lives'}
                  </li>
                  <li className={permissions.lives?.delete ? 'allowed' : 'denied'}>
                    {permissions.lives?.delete ? 'Pode excluir lives' : 'Não pode excluir lives'}
                  </li>
                </ul>
              </div>
              
              <div className="permission-group">
                <h4>Analytics</h4>
                <ul>
                  <li className={permissions.analytics?.read ? 'allowed' : 'denied'}>
                    {permissions.analytics?.read ? 'Pode visualizar analytics' : 'Não pode visualizar analytics'}
                  </li>
                </ul>
              </div>
              
              <div className="permission-group">
                <h4>Usuários</h4>
                <ul>
                  <li className={permissions.users?.create ? 'allowed' : 'denied'}>
                    {permissions.users?.create ? 'Pode criar usuários' : 'Não pode criar usuários'}
                  </li>
                  <li className={permissions.users?.read ? 'allowed' : 'denied'}>
                    {permissions.users?.read ? 'Pode visualizar usuários' : 'Não pode visualizar usuários'}
                  </li>
                  <li className={permissions.users?.update ? 'allowed' : 'denied'}>
                    {permissions.users?.update ? 'Pode editar usuários' : 'Não pode editar usuários'}
                  </li>
                  <li className={permissions.users?.delete ? 'allowed' : 'denied'}>
                    {permissions.users?.delete ? 'Pode excluir usuários' : 'Não pode excluir usuários'}
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <p>Nenhuma permissão definida</p>
          )}
        </div>
      </div>
    );
  };

  const renderStories = () => {
    return (
      <div className="user-stories">
        <div className="section-header">
          <h2>Seus Stories</h2>
          <div className="header-actions">
            {permissions?.stories?.create && (
              <button className="add-button">Criar Story</button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Carregando stories...</div>
        ) : (
          <>
            <div className="stories-list">
              {!stories.items || stories.items.length === 0 ? (
                <p>Nenhum story encontrado</p>
              ) : (
                <div className="stories-grid">
                  {stories.items.map(story => (
                    <div key={story.id} className="story-card">
                      <div 
                        className="story-thumbnail" 
                        style={{ backgroundImage: `url(${story.thumbnailUrl || '/placeholder-story.jpg'})` }}
                      >
                        <div className="story-stats">
                          <span className="views-count">{story.views || 0} visualizações</span>
                        </div>
                      </div>
                      
                      <div className="story-info">
                        <h3 className="story-title">{story.title}</h3>
                        <p className="story-date">Criado em {formatDate(story.createdAt)}</p>
                        <p className="story-description">{story.description}</p>
                      </div>
                      
                      <div className="story-actions">
                        {permissions?.stories?.read && (
                          <button className="action-button view">
                            <FaEye /> Visualizar
                          </button>
                        )}
                        
                        {permissions?.stories?.update && (
                          <button className="action-button edit">
                            <FaEdit /> Editar
                          </button>
                        )}
                        
                        {permissions?.analytics?.read && (
                          <button className="action-button analytics">
                            <FaChartLine /> Analytics
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {stories.pagination && stories.pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Anterior
                </button>
                
                <span className="pagination-info">
                  Página {currentPage} de {stories.pagination.totalPages}
                </span>
                
                <button 
                  className="pagination-button"
                  disabled={currentPage === stories.pagination.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderLives = () => {
    return (
      <div className="user-lives">
        <div className="section-header">
          <h2>Suas Lives</h2>
          <div className="header-actions">
            {permissions?.lives?.create && (
              <button className="add-button">Iniciar Live</button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Carregando lives...</div>
        ) : (
          <>
            <div className="lives-list">
              {!lives.items || lives.items.length === 0 ? (
                <p>Nenhuma live encontrada</p>
              ) : (
                <div className="lives-grid">
                  {lives.items.map(live => (
                    <div key={live.id} className="live-card">
                      <div className="live-status">
                        <span className={`status-badge ${live.status}`}>
                          {live.status === 'active' ? 'Ao Vivo' : 
                           live.status === 'ended' ? 'Finalizada' : 
                           live.status === 'scheduled' ? 'Agendada' : 
                           live.status}
                        </span>
                      </div>
                      
                      <div className="live-info">
                        <h3 className="live-title">{live.title}</h3>
                        <p className="live-date">{formatDate(live.createdAt)}</p>
                        <p className="live-description">{live.description}</p>
                        
                        <div className="live-stats">
                          <div className="stat-item">
                            <span className="stat-label">Espectadores:</span>
                            <span className="stat-value">{live.viewerCount || 0}</span>
                          </div>
                          
                          <div className="stat-item">
                            <span className="stat-label">Duração:</span>
                            <span className="stat-value">
                              {live.duration ? `${Math.floor(live.duration / 60)}:${(live.duration % 60).toString().padStart(2, '0')}` : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="live-actions">
                        {permissions?.lives?.read && (
                          <button className="action-button view">
                            <FaEye /> Visualizar
                          </button>
                        )}
                        
                        {permissions?.analytics?.read && (
                          <button className="action-button analytics">
                            <FaChartLine /> Analytics
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {lives.pagination && lives.pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Anterior
                </button>
                
                <span className="pagination-info">
                  Página {currentPage} de {lives.pagination.totalPages}
                </span>
                
                <button 
                  className="pagination-button"
                  disabled={currentPage === lives.pagination.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="admin-user-container">
      <div className="admin-header">
        <h1>Painel do Usuário</h1>
        <div className="user-info">
          <span className="user-name">{userData?.name}</span>
          <div className="user-avatar">
            <FaUser />
          </div>
        </div>
      </div>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        
        {permissions?.stories?.read && (
          <button 
            className={`tab-button ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            Stories
          </button>
        )}
        
        {permissions?.lives?.read && (
          <button 
            className={`tab-button ${activeTab === 'lives' ? 'active' : ''}`}
            onClick={() => setActiveTab('lives')}
          >
            Lives
          </button>
        )}
      </div>
      
      <div className="admin-content">
        {loading && activeTab !== 'dashboard' ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'stories' && renderStories()}
            {activeTab === 'lives' && renderLives()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUser;
