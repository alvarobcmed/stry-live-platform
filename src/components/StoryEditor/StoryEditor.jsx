import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaImage, FaVideo, FaFont, FaLink, FaTrash, FaSave, FaEye, FaArrowLeft, FaPlus } from 'react-icons/fa';
import './StoryEditor.css';

const StoryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewStory = id === 'new';
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
  const [story, setStory] = useState({
    title: '',
    description: '',
    slides: [{ type: 'image', content: '', caption: '' }],
    isPublic: true,
    tags: []
  });
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(!isNewStory);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!isNewStory) {
      fetchStory();
    }
  }, [id]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStory(data);
      } else {
        setError('Erro ao carregar story');
      }
    } catch (error) {
      console.error('Erro ao buscar story:', error);
      setError('Erro ao carregar story');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validar dados
    if (!story.title.trim()) {
      setError('O título é obrigatório');
      return;
    }
    
    if (story.slides.length === 0) {
      setError('Adicione pelo menos um slide');
      return;
    }
    
    for (const slide of story.slides) {
      if (!slide.content) {
        setError('Todos os slides devem ter conteúdo');
        return;
      }
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const method = isNewStory ? 'POST' : 'PUT';
      const url = isNewStory ? '/api/stories' : `/api/stories/${id}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(story)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (isNewStory) {
          navigate(`/stories/${data.id}/edit`);
        } else {
          setStory(data);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Erro ao salvar story');
      }
    } catch (error) {
      console.error('Erro ao salvar story:', error);
      setError('Erro ao salvar story');
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = (e) => {
    setStory({ ...story, title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    setStory({ ...story, description: e.target.value });
  };

  const handleIsPublicChange = (e) => {
    setStory({ ...story, isPublic: e.target.checked });
  };

  const handleSlideContentChange = (content) => {
    const updatedSlides = [...story.slides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      content
    };
    setStory({ ...story, slides: updatedSlides });
  };

  const handleSlideCaptionChange = (e) => {
    const updatedSlides = [...story.slides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      caption: e.target.value
    };
    setStory({ ...story, slides: updatedSlides });
  };

  const handleSlideTypeChange = (type) => {
    const updatedSlides = [...story.slides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      type,
      content: ''
    };
    setStory({ ...story, slides: updatedSlides });
  };

  const handleAddSlide = () => {
    const newSlide = { type: 'image', content: '', caption: '' };
    setStory({ ...story, slides: [...story.slides, newSlide] });
    setCurrentSlideIndex(story.slides.length);
  };

  const handleDeleteSlide = () => {
    if (story.slides.length <= 1) {
      setError('O story deve ter pelo menos um slide');
      return;
    }
    
    const updatedSlides = story.slides.filter((_, index) => index !== currentSlideIndex);
    setStory({ ...story, slides: updatedSlides });
    
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      handleSlideContentChange(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      handleSlideContentChange(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = () => {
    fileInputRef.current.click();
  };

  const triggerVideoUpload = () => {
    videoInputRef.current.click();
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    if (!story.tags.includes(newTag.trim())) {
      setStory({ ...story, tags: [...story.tags, newTag.trim()] });
    }
    
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setStory({
      ...story,
      tags: story.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  if (loading) {
    return (
      <div className="story-editor-loading">
        <div className="spinner"></div>
        <p>Carregando editor...</p>
      </div>
    );
  }

  return (
    <div className="story-editor-container">
      <div className="story-editor-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <FaArrowLeft /> Voltar
        </button>
        <h1>{isNewStory ? 'Criar Novo Story' : 'Editar Story'}</h1>
        <div className="header-actions">
          <button 
            className="preview-button"
            onClick={togglePreviewMode}
          >
            <FaEye /> {previewMode ? 'Editar' : 'Visualizar'}
          </button>
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={saving}
          >
            <FaSave /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {previewMode ? (
        <div className="story-preview">
          <div className="preview-header">
            <h2>{story.title}</h2>
            <p>{story.description}</p>
          </div>
          
          <div className="preview-slides">
            <div className="preview-current-slide">
              {story.slides[currentSlideIndex].type === 'image' ? (
                <img 
                  src={story.slides[currentSlideIndex].content || '/placeholder-image.jpg'} 
                  alt={`Slide ${currentSlideIndex + 1}`}
                />
              ) : story.slides[currentSlideIndex].type === 'video' ? (
                <video 
                  src={story.slides[currentSlideIndex].content} 
                  controls
                />
              ) : (
                <div className="text-slide">
                  {story.slides[currentSlideIndex].content}
                </div>
              )}
              
              {story.slides[currentSlideIndex].caption && (
                <div className="preview-caption">
                  {story.slides[currentSlideIndex].caption}
                </div>
              )}
            </div>
            
            <div className="preview-navigation">
              {story.slides.map((_, index) => (
                <button
                  key={index}
                  className={`preview-nav-dot ${index === currentSlideIndex ? 'active' : ''}`}
                  onClick={() => setCurrentSlideIndex(index)}
                />
              ))}
            </div>
          </div>
          
          <div className="preview-info">
            <div className="preview-tags">
              {story.tags.map(tag => (
                <span key={tag} className="preview-tag">{tag}</span>
              ))}
            </div>
            
            <div className="preview-status">
              <span className={`status-badge ${story.isPublic ? 'public' : 'private'}`}>
                {story.isPublic ? 'Público' : 'Privado'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="story-editor">
          <div className="editor-sidebar">
            <div className="story-info-section">
              <div className="form-group">
                <label htmlFor="title">Título*</label>
                <input
                  type="text"
                  id="title"
                  value={story.title}
                  onChange={handleTitleChange}
                  placeholder="Digite o título do story"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <textarea
                  id="description"
                  value={story.description}
                  onChange={handleDescriptionChange}
                  placeholder="Digite uma descrição para o story"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={story.isPublic}
                    onChange={handleIsPublicChange}
                  />
                  Story público (visível para todos)
                </label>
              </div>
              
              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Adicionar tag"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button 
                    className="add-tag-button"
                    onClick={handleAddTag}
                  >
                    <FaPlus />
                  </button>
                </div>
                
                <div className="tags-list">
                  {story.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button 
                        className="remove-tag-button"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="slides-section">
              <h3>Slides</h3>
              <div className="slides-list">
                {story.slides.map((slide, index) => (
                  <div 
                    key={index}
                    className={`slide-item ${index === currentSlideIndex ? 'active' : ''}`}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <div className="slide-thumbnail">
                      {slide.type === 'image' ? (
                        <img 
                          src={slide.content || '/placeholder-image.jpg'} 
                          alt={`Slide ${index + 1}`}
                        />
                      ) : slide.type === 'video' ? (
                        <div className="video-thumbnail">
                          <FaVideo />
                        </div>
                      ) : (
                        <div className="text-thumbnail">
                          <FaFont />
                        </div>
                      )}
                    </div>
                    <span className="slide-number">{index + 1}</span>
                  </div>
                ))}
                
                <button 
                  className="add-slide-button"
                  onClick={handleAddSlide}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
          
          <div className="editor-main">
            <div className="slide-editor">
              <div className="slide-type-selector">
                <button 
                  className={`type-button ${story.slides[currentSlideIndex].type === 'image' ? 'active' : ''}`}
                  onClick={() => handleSlideTypeChange('image')}
                >
                  <FaImage /> Imagem
                </button>
                <button 
                  className={`type-button ${story.slides[currentSlideIndex].type === 'video' ? 'active' : ''}`}
                  onClick={() => handleSlideTypeChange('video')}
                >
                  <FaVideo /> Vídeo
                </button>
                <button 
                  className={`type-button ${story.slides[currentSlideIndex].type === 'text' ? 'active' : ''}`}
                  onClick={() => handleSlideTypeChange('text')}
                >
                  <FaFont /> Texto
                </button>
                <button 
                  className="delete-slide-button"
                  onClick={handleDeleteSlide}
                >
                  <FaTrash /> Excluir Slide
                </button>
              </div>
              
              <div className="slide-content-editor">
                {story.slides[currentSlideIndex].type === 'image' && (
                  <div className="image-editor">
                    {story.slides[currentSlideIndex].content ? (
                      <div className="image-preview">
                        <img 
                          src={story.slides[currentSlideIndex].content} 
                          alt="Preview"
                        />
                        <button 
                          className="change-image-button"
                          onClick={triggerImageUpload}
                        >
                          Alterar Imagem
                        </button>
                      </div>
                    ) : (
                      <div className="image-upload-area" onClick={triggerImageUpload}>
                        <FaImage className="upload-icon" />
                        <p>Clique para fazer upload de uma imagem</p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
                
                {story.slides[currentSlideIndex].type === 'video' && (
                  <div className="video-editor">
                    {story.slides[currentSlideIndex].content ? (
                      <div className="video-preview">
                        <video 
                          src={story.slides[currentSlideIndex].content} 
                          controls
                        />
                        <button 
                          className="change-video-button"
                          onClick={triggerVideoUpload}
                        >
                          Alterar Vídeo
                        </button>
                      </div>
                    ) : (
                      <div className="video-upload-area" onClick={triggerVideoUpload}>
                        <FaVideo className="upload-icon" />
                        <p>Clique para fazer upload de um vídeo</p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoUpload}
                      accept="video/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
                
                {story.slides[currentSlideIndex].type === 'text' && (
                  <div className="text-editor">
                    <textarea
                      value={story.slides[currentSlideIndex].content}
                      onChange={(e) => handleSlideContentChange(e.target.value)}
                      placeholder="Digite o texto do slide"
                      rows={10}
                    />
                  </div>
                )}
                
                <div className="caption-editor">
                  <label htmlFor="caption">Legenda</label>
                  <input
                    type="text"
                    id="caption"
                    value={story.slides[currentSlideIndex].caption}
                    onChange={handleSlideCaptionChange}
                    placeholder="Adicionar legenda (opcional)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditor;
