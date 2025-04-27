import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { FaBuilding, FaUsers, FaChartLine, FaCog, FaUserTie } from 'react-icons/fa';
import './AdminClient.css';

const AdminClient = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [lives, setLives] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Verificar se o usuário é Admin Cliente
    if (user && user.adminLevel !== 'client') {
      // Redirecionar para página de acesso negado ou dashboard normal
      window.location.href = '/dashboard';
    }
  }, [user]);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case 'dashboard':
            await fetchClientData();
            break;
          case 'users':
            await fetchUsers();
            break;
          case 'stories':
            await fetchStories();
            break;
          case 'lives':
            await fetchLives();
            break;
          case 'permissions':
            await fetchPermissions();
            break;
          default:
            await fetchClientData();
        }
      } catch (error) {
        console.error('Erro ao carregar dados de administração:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [activeTab, currentPage]);

  const fetchClientData = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${user.clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClientData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do cliente:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?clientId=${user.clientId}&page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await fetch(`/api/stories?clientId=${user.clientId}&page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao buscar stories:', error);
    }
  };

  const fetchLives = async () => {
    try {
      const response = await fetch(`/api/lives?clientId=${user.clientId}&page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLives(data.lives);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao buscar lives:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implementar busca com base no activeTab
    setCurrentPage(1);
    
    switch (activeTab) {
      case 'users':
        fetchUsers();
        break;
      case 'stories':
        fetchStories();
        break;
      case 'lives':
        fetchLives();
        break;
      default:
        break;
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

  const handleUpdatePermissions = async (userId, permissions) => {
    try {
      const response = await fetch(`/api/admin/permissions/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ permissions })
      });
      
      if (response.ok) {
        // Atualizar lista de permissões
        await fetchPermissions();
      }
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
    }
  };

  const renderDashboard = () => {
    if (!clientData) return <div className="loading-indicator">Carregando dados...</div>;
    
    return (
      <div className="admin-dashboard">
        <div className="client-info">
          <div className="client-header">
            <h2>{clientData.name}</h2>
            <span className={`status-badge ${clientData.status}`}>
              {clientData.status}
            </span>
          </div>
          
          <div className="client-details">
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{clientData.email}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Website:</span>
              <span className="detail-value">{clientData.website || '-'}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Plano:</span>
              <span className="detail-value">{clientData.plan}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Status da Assinatura:</span>
              <span className={`detail-value status-${clientData.subscriptionStatus}`}>
                {clientData.subscriptionStatus}
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Criado em:</span>
              <span className="detail-value">{formatDate(clientData.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon users">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>Usuários</h3>
              <p className="stat-value">{clientData.stats.totalUsers}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon stories">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <h3>Stories</h3>
              <p className="stat-value">{clientData.stats.totalStories}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon lives">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <h3>Lives</h3>
              <p className="stat-value">{clientData.stats.totalLives}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-actions">
          <button className="action-button">
            <FaUsers /> Gerenciar Usuários
          </button>
          <button className="action-button">
            <FaChartLine /> Ver Analytics
          </button>
          <button className="action-button">
            <FaCog /> Configurações
          </button>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="admin-users">
        <div className="section-header">
          <h2>Gerenciamento de Usuários</h2>
          <div className="header-actions">
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>
            <button className="add-button">Adicionar Usuário</button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Carregando usuários...</div>
        ) : (
          <>
            <div className="users-table">
              {users.length === 0 ? (
                <p>Nenhum usuário encontrado</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Função</th>
                      <th>Status</th>
                      <th>Criado em</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <span className={`status-badge ${user.status}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td className="actions-cell">
                          <button className="action-button view">Ver</button>
                          <button className="action-button edit">Editar</button>
                          <button className="action-button delete">Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="pagination">
              <button 
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </button>
              
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              
              <button 
                className="pagination-button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderStories = () => {
    return (
      <div className="admin-stories">
        <div className="section-header">
          <h2>Gerenciamento de Stories</h2>
          <div className="header-actions">
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Buscar stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>
            <button className="add-button">Criar Story</button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Carregando stories...</div>
        ) : (
          <>
            <div className="stories-table">
              {stories.length === 0 ? (
                <p>Nenhum story encontrado</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Criado por</th>
                      <th>Visualizações</th>
                      <th>Status</th>
                      <th>Criado em</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stories.map(story => (
                      <tr key={story.id}>
                        <td>{story.title}</td>
                        <td>{story.createdBy}</td>
                        <td>{story.views || 0}</td>
                        <td>
                          <span className={`status-badge ${story.isPublic ? 'public' : 'private'}`}>
                            {story.isPublic ? 'Público' : 'Privado'}
                          </span>
                        </td>
                        <td>{formatDate(story.createdAt)}</td>
                        <td className="actions-cell">
                          <button className="action-button view">Ver</button>
                          <button className="action-button edit">Editar</button>
                          <button className="action-button delete">Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="pagination">
              <button 
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </button>
              
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              
              <button 
                className="pagination-button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderLives = () => {
    return (
      <div className="admin-lives">
        <div className="section-header">
          <h2>Gerenciamento de Lives</h2>
          <div className="header-actions">
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Buscar lives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>
            <button className="add-button">Iniciar Live</button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Carregando lives...</div>
        ) : (
          <>
            <div className="lives-table">
              {lives.length === 0 ? (
                <p>Nenhuma live encontrada</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Transmitido por</th>
                      <th>Espectadores</th>
                      <th>Duração</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lives.map(live => (
                      <tr key={live.id}>
                        <td>{live.title}</td>
                        <td>{live.createdBy}</td>
                        <td>{live.viewerCount || 0}</td>
                        <td>{live.duration ? `${Math.floor(live.duration / 60)}:${(live.duration % 60).toString().padStart(2, '0')}` : '-'}</td>
                        <td>
                          <span className={`status-badge ${live.status}`}>
                            {live.status}
                          </span>
                        </td>
                        <td>{formatDate(live.createdAt)}</td>
                        <td className="actions-cell">
                          <button className="action-button view">Ver</button>
                          <button className="action-button analytics">Analytics</button>
                          <button className="action-button delete">Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="pagination">
              <button 
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </button>
              
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              
              <button 
                className="pagination-button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderPermissions = () => {
    return (
      <div className="admin-permissions">
        <div className="section-header">
          <h2>Gerenciamento de Permissões</h2>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Carregando permissões...</div>
        ) : (
          <div className="permissions-container">
            {permissions.length === 0 ? (
              <p>Nenhum usuário encontrado</p>
            ) : (
              permissions.map(user => (
                <div key={user.id} className="permission-card">
                  <div className="permission-header">
                    <div className="user-info">
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </div>
                  </div>
                  
                  <div className="permission-settings">
                    <h4>Permissões</h4>
                    
                    <div className="permission-group">
                      <h5>Stories</h5>
                      <div className="permission-toggles">
                        <label className="toggle-label">
                          <span>Criar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.stories?.create || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                stories: {
                                  ...user.permissions?.stories,
                                  create: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Visualizar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.stories?.read || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                stories: {
                                  ...user.permissions?.stories,
                                  read: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Editar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.stories?.update || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                stories: {
                                  ...user.permissions?.stories,
                                  update: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Excluir</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.stories?.delete || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                stories: {
                                  ...user.permissions?.stories,
                                  delete: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="permission-group">
                      <h5>Lives</h5>
                      <div className="permission-toggles">
                        <label className="toggle-label">
                          <span>Criar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.lives?.create || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                lives: {
                                  ...user.permissions?.lives,
                                  create: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Visualizar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.lives?.read || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                lives: {
                                  ...user.permissions?.lives,
                                  read: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Editar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.lives?.update || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                lives: {
                                  ...user.permissions?.lives,
                                  update: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Excluir</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.lives?.delete || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                lives: {
                                  ...user.permissions?.lives,
                                  delete: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="permission-group">
                      <h5>Analytics</h5>
                      <div className="permission-toggles">
                        <label className="toggle-label">
                          <span>Visualizar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.analytics?.read || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                analytics: {
                                  ...user.permissions?.analytics,
                                  read: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="permission-group">
                      <h5>Usuários</h5>
                      <div className="permission-toggles">
                        <label className="toggle-label">
                          <span>Criar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.users?.create || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                users: {
                                  ...user.permissions?.users,
                                  create: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Visualizar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.users?.read || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                users: {
                                  ...user.permissions?.users,
                                  read: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Editar</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.users?.update || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                users: {
                                  ...user.permissions?.users,
                                  update: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        
                        <label className="toggle-label">
                          <span>Excluir</span>
                          <input 
                            type="checkbox" 
                            checked={user.permissions?.users?.delete || false}
                            onChange={(e) => {
                              const updatedPermissions = {
                                ...user.permissions,
                                users: {
                                  ...user.permissions?.users,
                                  delete: e.target.checked
                                }
                              };
                              handleUpdatePermissions(user.id, updatedPermissions);
                            }}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-client-container">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <FaUserTie />
          <h2>Admin Cliente</h2>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartLine /> Dashboard
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> Usuários
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            <FaChartLine /> Stories
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'lives' ? 'active' : ''}`}
            onClick={() => setActiveTab('lives')}
          >
            <FaChartLine /> Lives
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            <FaCog /> Permissões
          </button>
        </nav>
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
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'stories' && renderStories()}
            {activeTab === 'lives' && renderLives()}
            {activeTab === 'permissions' && renderPermissions()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminClient;
