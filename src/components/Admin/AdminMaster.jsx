import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { FaUserShield, FaUsers, FaBuilding, FaUserCog, FaChartLine, FaHistory } from 'react-icons/fa';
import './AdminMaster.css';

const AdminMaster = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Verificar se o usuário é Admin Master
    if (user && user.adminLevel !== 'master') {
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
            await fetchDashboardData();
            break;
          case 'clients':
            await fetchClients();
            break;
          case 'users':
            await fetchUsers();
            break;
          case 'audit':
            await fetchAuditLogs();
            break;
          default:
            await fetchDashboardData();
        }
      } catch (error) {
        console.error('Erro ao carregar dados de administração:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [activeTab, currentPage]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`/api/admin/clients?page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?page=${currentPage}&limit=10`, {
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

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`/api/admin/audit-logs?page=${currentPage}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implementar busca com base no activeTab
    setCurrentPage(1);
    
    switch (activeTab) {
      case 'clients':
        fetchClients();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'audit':
        fetchAuditLogs();
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

  const renderDashboard = () => {
    if (!dashboardData) return <div className="loading-indicator">Carregando dados...</div>;
    
    return (
      <div className="admin-dashboard">
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon clients">
              <FaBuilding />
            </div>
            <div className="stat-content">
              <h3>Clientes</h3>
              <p className="stat-value">{dashboardData.counts.clients.total}</p>
              <p className="stat-detail">
                {dashboardData.counts.clients.active} ativos
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon users">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>Usuários</h3>
              <p className="stat-value">{dashboardData.counts.users.total}</p>
              <p className="stat-detail">
                {dashboardData.counts.users.active} ativos
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon stories">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <h3>Stories</h3>
              <p className="stat-value">{dashboardData.counts.stories.total}</p>
              <p className="stat-detail">
                {dashboardData.counts.stories.recent} nos últimos {dashboardData.period.days} dias
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon lives">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <h3>Lives</h3>
              <p className="stat-value">{dashboardData.counts.lives.total}</p>
              <p className="stat-detail">
                {dashboardData.counts.lives.recent} nos últimos {dashboardData.period.days} dias
              </p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h3>Clientes Recentes</h3>
            <div className="recent-clients">
              {dashboardData.recentClients.length === 0 ? (
                <p>Nenhum cliente recente</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Plano</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentClients.map(client => (
                      <tr key={client.id}>
                        <td>{client.name}</td>
                        <td>{client.email}</td>
                        <td>{client.plan}</td>
                        <td>
                          <span className={`status-badge ${client.status}`}>
                            {client.status}
                          </span>
                        </td>
                        <td>{formatDate(client.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="dashboard-section">
            <h3>Atividades Recentes</h3>
            <div className="recent-activities">
              {dashboardData.recentAuditLogs.length === 0 ? (
                <p>Nenhuma atividade recente</p>
              ) : (
                <ul className="activity-list">
                  {dashboardData.recentAuditLogs.map(log => (
                    <li key={log.id} className="activity-item">
                      <div className="activity-icon">
                        <FaHistory />
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">
                          <strong>{log.action}</strong> - ID: {log.targetId}
                        </p>
                        <p className="activity-time">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div className="dashboard-charts">
          <div className="chart-section">
            <h3>Distribuição de Planos</h3>
            <div className="plans-distribution">
              {Object.entries(dashboardData.plans).map(([plan, count]) => (
                <div key={plan} className="plan-item">
                  <div className="plan-name">{plan}</div>
                  <div className="plan-bar-container">
                    <div 
                      className="plan-bar" 
                      style={{ 
                        width: `${(count / dashboardData.counts.clients.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="plan-count">{count}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-section">
            <h3>Status de Assinaturas</h3>
            <div className="subscription-status">
              {Object.entries(dashboardData.subscriptions).map(([status, count]) => (
                <div key={status} className="subscription-item">
                  <div className="subscription-name">{status}</div>
                  <div className="subscription-count">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClients = () => {
    return (
      <div className="admin-clients">
        <div className="section-header">
          <h2>Gerenciamento de Clientes</h2>
          <div className="header-actions">
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>
            <button className="add-button">Adicionar Cliente</button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Carregando clientes...</div>
        ) : (
          <>
            <div className="clients-table">
              {clients.length === 0 ? (
                <p>Nenhum cliente encontrado</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Website</th>
                      <th>Plano</th>
                      <th>Status</th>
                      <th>Assinatura</th>
                      <th>Criado em</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id}>
                        <td>{client.name}</td>
                        <td>{client.email}</td>
                        <td>{client.website || '-'}</td>
                        <td>{client.plan}</td>
                        <td>
                          <span className={`status-badge ${client.status}`}>
                            {client.status}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${client.subscriptionStatus}`}>
                            {client.subscriptionStatus}
                          </span>
                        </td>
                        <td>{formatDate(client.createdAt)}</td>
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
                      <th>Nível Admin</th>
                      <th>Cliente</th>
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
                        <td>{user.adminLevel}</td>
                        <td>{user.clientId}</td>
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

  const renderAuditLogs = () => {
    return (
      <div className="admin-audit">
        <div className="section-header">
          <h2>Logs de Auditoria</h2>
          <div className="header-actions">
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>
            <button className="export-button">Exportar Logs</button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Carregando logs...</div>
        ) : (
          <>
            <div className="audit-logs-table">
              {auditLogs.length === 0 ? (
                <p>Nenhum log encontrado</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ação</th>
                      <th>Usuário</th>
                      <th>Alvo</th>
                      <th>Detalhes</th>
                      <th>Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.action}</td>
                        <td>{log.userId}</td>
                        <td>{log.targetId}</td>
                        <td>
                          <button className="view-details-button">
                            Ver Detalhes
                          </button>
                        </td>
                        <td>{formatDate(log.timestamp)}</td>
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

  const renderSettings = () => {
    return (
      <div className="admin-settings">
        <div className="section-header">
          <h2>Configurações do Sistema</h2>
        </div>
        
        <div className="settings-sections">
          <div className="settings-section">
            <h3>Configurações Gerais</h3>
            <div className="settings-form">
              <div className="form-group">
                <label>Nome do Site</label>
                <input type="text" defaultValue="Stry.live" />
              </div>
              
              <div className="form-group">
                <label>URL do Site</label>
                <input type="text" defaultValue="https://stry.live" />
              </div>
              
              <div className="form-group">
                <label>Email de Contato</label>
                <input type="email" defaultValue="contato@stry.live" />
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>Configurações de API</h3>
            <div className="settings-form">
              <div className="form-group">
                <label>Chave de API Firebase</label>
                <input type="text" defaultValue="********" />
                <button className="view-button">Visualizar</button>
              </div>
              
              <div className="form-group">
                <label>Chave de API Stripe</label>
                <input type="text" defaultValue="********" />
                <button className="view-button">Visualizar</button>
              </div>
              
              <div className="form-group">
                <label>Chave de API RTMP</label>
                <input type="text" defaultValue="********" />
                <button className="view-button">Visualizar</button>
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>Configurações de Email</h3>
            <div className="settings-form">
              <div className="form-group">
                <label>Servidor SMTP</label>
                <input type="text" defaultValue="smtp.stry.live" />
              </div>
              
              <div className="form-group">
                <label>Porta SMTP</label>
                <input type="number" defaultValue="587" />
              </div>
              
              <div className="form-group">
                <label>Email de Envio</label>
                <input type="email" defaultValue="no-reply@stry.live" />
              </div>
              
              <div className="form-group">
                <label>Senha</label>
                <input type="password" defaultValue="********" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="settings-actions">
          <button className="save-button">Salvar Configurações</button>
          <button className="reset-button">Restaurar Padrões</button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-master-container">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <FaUserShield />
          <h2>Admin Master</h2>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartLine /> Dashboard
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <FaBuilding /> Clientes
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> Usuários
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FaHistory /> Logs de Auditoria
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaUserCog /> Configurações
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
            {activeTab === 'clients' && renderClients()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'audit' && renderAuditLogs()}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMaster;
