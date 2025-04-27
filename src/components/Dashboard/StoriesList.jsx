import React, { useState, useEffect, useContext } from 'react';
import { StoriesContext } from '../../contexts/StoriesContext';
import { FaEdit, FaTrash, FaEye, FaChartLine, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './StoriesList.css';

const StoriesList = ({ stories, loading }) => {
  const { deleteStory } = useContext(StoriesContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStories, setFilteredStories] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (stories) {
      let filtered = [...stories];
      
      // Aplicar filtro de busca
      if (searchTerm) {
        filtered = filtered.filter(story => 
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Aplicar ordenação
      filtered.sort((a, b) => {
        if (sortBy === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (sortBy === 'title') {
          return sortOrder === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        } else if (sortBy === 'views') {
          return sortOrder === 'asc' 
            ? a.views - b.views
            : b.views - a.views;
        }
        return 0;
      });
      
      setFilteredStories(filtered);
    }
  }, [stories, searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteClick = (storyId) => {
    setConfirmDelete(storyId);
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      try {
        await deleteStory(confirmDelete);
        setConfirmDelete(null);
      } catch (error) {
        console.error('Erro ao excluir story:', error);
      }
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
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
      <div className="stories-loading">
        <FaSpinner className="spinner" />
        <p>Carregando stories...</p>
      </div>
    );
  }

  return (
    <div className="stories-list-container">
      <div className="stories-list-header">
        <h2>Seus Stories</h2>
        <Link to="/stories/new" className="new-story-button">Criar Novo Story</Link>
      </div>
      
      <div className="stories-list-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="sort-container">
          <span>Ordenar por:</span>
          <button 
            className={`sort-button ${sortBy === 'createdAt' ? 'active' : ''}`}
            onClick={() => handleSort('createdAt')}
          >
            Data {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`sort-button ${sortBy === 'title' ? 'active' : ''}`}
            onClick={() => handleSort('title')}
          >
            Título {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`sort-button ${sortBy === 'views' ? 'active' : ''}`}
            onClick={() => handleSort('views')}
          >
            Visualizações {sortBy === 'views' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>
      
      {filteredStories.length === 0 ? (
        <div className="no-stories">
          <p>Nenhum story encontrado. Crie seu primeiro story!</p>
          <Link to="/stories/new" className="create-first-story-button">Criar Story</Link>
        </div>
      ) : (
        <div className="stories-grid">
          {filteredStories.map(story => (
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
                <Link to={`/stories/${story.id}/view`} className="action-button view">
                  <FaEye /> Visualizar
                </Link>
                <Link to={`/stories/${story.id}/edit`} className="action-button edit">
                  <FaEdit /> Editar
                </Link>
                <button 
                  className="action-button delete"
                  onClick={() => handleDeleteClick(story.id)}
                >
                  <FaTrash /> Excluir
                </button>
                <Link to={`/stories/${story.id}/analytics`} className="action-button analytics">
                  <FaChartLine /> Analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {confirmDelete && (
        <div className="delete-confirmation-modal">
          <div className="delete-confirmation-content">
            <h3>Confirmar exclusão</h3>
            <p>Tem certeza que deseja excluir este story? Esta ação não pode ser desfeita.</p>
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

export default StoriesList;
