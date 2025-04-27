import React, { useState, useEffect, useContext } from 'react';
import { FaGlobe, FaPlus, FaEdit, FaTrash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './IntegrationsList.css';

const IntegrationsList = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagManagerConfig, setTagManagerConfig] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [embedCode, setEmbedCode] = useState(null);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  useEffect(() => {
    const fetchIntegrationData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTagManagerConfig(),
          fetchIntegratedSites(),
          fetchEmbedCode()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados de integração:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrationData();
  }, []);

  const fetchTagManagerConfig = async () => {
    try {
      const response = await fetch('/api/integration/tag-manager', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTagManagerConfig(data);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações do Tag Manager:', error);
    }
  };

  const fetchIntegratedSites = async () => {
    try {
      const response = await fetch('/api/integration/sites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSites(data);
      }
    } catch (error) {
      console.error('Erro ao buscar sites integrados:', error);
    }
  };

  const fetchEmbedCode = async () => {
    try {
      const response = await fetch('/api/integration/embed-code', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmbedCode(data);
      }
    } catch (error) {
      console.error('Erro ao buscar código de incorporação:', error);
    }
  };

  const handleDeleteClick = (siteId) => {
    setConfirmDelete(siteId);
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      try {
        const response = await fetch(`/api/integration/sites/${confirmDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          // Atualizar lista de sites após exclusão
          setSites(sites.filter(site => site.id !== confirmDelete));
          setConfirmDelete(null);
        }
      } catch (error) {
        console.error('Erro ao excluir site:', error);
      }
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const toggleEmbedCode = () => {
    setShowEmbedCode(!showEmbedCode);
  };

  const testIntegration = async (url) => {
    try {
      const response = await fetch('/api/integration/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ url })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Teste concluído: ${data.result.success ? 'Sucesso' : 'Falha'}`);
      }
    } catch (error) {
      console.error('Erro ao testar integração:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="integrations-loading">
        <div className="spinner"></div>
        <p>Carregando integrações...</p>
      </div>
    );
  }

  return (
    <div className="integrations-list-container">
      <div className="integrations-list-header">
        <h2>Integrações</h2>
        <div className="header-actions">
          <Link to="/integration/tag-manager" className="config-button">
            Configurar Tag Manager
          </Link>
          <button className="embed-code-button" onClick={toggleEmbedCode}>
            {showEmbedCode ? 'Ocultar Código' : 'Mostrar Código de Incorporação'}
          </button>
        </div>
      </div>

      {showEmbedCode && embedCode && (
        <div className="embed-code-container">
          <h3>Código de Incorporação</h3>
          <p>Adicione este código ao seu site para integrar o Stry.live:</p>
          
          <div className="code-tabs">
            <button className="code-tab active">Implementação Direta</button>
            <button className="code-tab">Google Tag Manager</button>
          </div>
          
          <div className="code-content">
            <pre className="code-block">{embedCode.stryCode}</pre>
            <button className="copy-button" onClick={() => navigator.clipboard.writeText(embedCode.stryCode)}>
              Copiar Código
            </button>
          </div>
          
          <div className="integration-preview">
            <h4>Prévia da Integração</h4>
            <p>Veja como o player de stories ficará no seu site:</p>
            <div className="preview-frame">
              <iframe 
                src={`/integration/preview?clientId=${embedCode.config.clientId}`}
                title="Prévia da Integração"
                className="preview-iframe"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <div className="tag-manager-status">
        <h3>Status do Google Tag Manager</h3>
        <div className={`status-indicator ${tagManagerConfig?.enabled ? 'active' : 'inactive'}`}>
          {tagManagerConfig?.enabled ? (
            <>
              <FaCheck className="status-icon" />
              <span>Integração Ativa</span>
            </>
          ) : (
            <>
              <FaExclamationTriangle className="status-icon" />
              <span>Integração Inativa</span>
            </>
          )}
        </div>
        
        <div className="tag-manager-details">
          <p>
            <strong>Container ID:</strong> {tagManagerConfig?.containerId || 'Não configurado'}
          </p>
          <p>
            <strong>Posição do Player:</strong> {tagManagerConfig?.playerConfig?.position || 'bottom-right'}
          </p>
          <p>
            <strong>Tamanho:</strong> {tagManagerConfig?.playerConfig?.size || 'medium'}
          </p>
        </div>
      </div>

      <div className="integrated-sites">
        <div className="sites-header">
          <h3>Sites Integrados</h3>
          <Link to="/integration/sites/new" className="add-site-button">
            <FaPlus /> Adicionar Site
          </Link>
        </div>
        
        {sites.length === 0 ? (
          <div className="no-sites">
            <p>Nenhum site integrado. Adicione seu primeiro site!</p>
            <Link to="/integration/sites/new" className="add-first-site-button">Adicionar Site</Link>
          </div>
        ) : (
          <div className="sites-grid">
            {sites.map(site => (
              <div key={site.id} className="site-card">
                <div className="site-icon">
                  <FaGlobe />
                </div>
                
                <div className="site-info">
                  <h4 className="site-name">{site.name}</h4>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="site-url">
                    {site.url}
                  </a>
                  <p className="site-description">{site.description}</p>
                  <p className="site-date">Integrado em {formatDate(site.createdAt)}</p>
                </div>
                
                <div className="site-status">
                  <span className={`status-badge ${site.status === 'active' ? 'active' : 'inactive'}`}>
                    {site.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="site-actions">
                  <button 
                    className="action-button test"
                    onClick={() => testIntegration(site.url)}
                  >
                    Testar
                  </button>
                  <Link to={`/integration/sites/${site.id}/edit`} className="action-button edit">
                    <FaEdit /> Editar
                  </Link>
                  <button 
                    className="action-button delete"
                    onClick={() => handleDeleteClick(site.id)}
                  >
                    <FaTrash /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {confirmDelete && (
        <div className="delete-confirmation-modal">
          <div className="delete-confirmation-content">
            <h3>Confirmar exclusão</h3>
            <p>Tem certeza que deseja excluir este site? Esta ação não pode ser desfeita.</p>
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

export default IntegrationsList;
