import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { LivesContext } from '../../contexts/LivesContext';
import { FaVideo, FaPlay, FaStop, FaCog, FaUsers, FaComments, FaShare } from 'react-icons/fa';
import './LiveStreaming.css';

const LiveStreaming = () => {
  const { user } = useContext(AuthContext);
  const { createLive, updateLive, endLive } = useContext(LivesContext);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentLive, setCurrentLive] = useState(null);
  const [streamKey, setStreamKey] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [streamSettings, setStreamSettings] = useState({
    rtmpUrl: 'rtmp://streaming.stry.live/live',
    resolution: '720p',
    frameRate: 30,
    bitrate: '2500kbps'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Gerar chave de stream única para o usuário
    if (user) {
      generateStreamKey();
    }
  }, [user]);

  useEffect(() => {
    // Atualizar contador de duração quando estiver transmitindo
    let timer;
    if (isStreaming) {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStreaming]);

  useEffect(() => {
    // Simular comentários e visualizações durante a transmissão
    let viewersTimer;
    let commentsTimer;
    
    if (isStreaming) {
      // Simular flutuação de espectadores
      viewersTimer = setInterval(() => {
        const randomChange = Math.floor(Math.random() * 5) - 2; // -2 a +2
        setViewerCount(prev => Math.max(0, prev + randomChange));
      }, 5000);
      
      // Simular comentários
      commentsTimer = setInterval(() => {
        if (Math.random() > 0.7) { // 30% de chance de receber um comentário
          const randomComments = [
            'Ótima transmissão!',
            'Muito interessante esse conteúdo',
            'Estou adorando, continue assim!',
            'Pode explicar melhor essa parte?',
            'Primeira vez assistindo, muito bom!',
            'De onde você está transmitindo?',
            'Qual a frequência dessas lives?',
            'Vou compartilhar com meus amigos'
          ];
          
          const randomNames = [
            'João Silva',
            'Maria Oliveira',
            'Pedro Santos',
            'Ana Costa',
            'Carlos Souza',
            'Juliana Lima',
            'Roberto Alves',
            'Fernanda Pereira'
          ];
          
          const newRandomComment = {
            id: Date.now(),
            user: randomNames[Math.floor(Math.random() * randomNames.length)],
            text: randomComments[Math.floor(Math.random() * randomComments.length)],
            timestamp: new Date()
          };
          
          setComments(prev => [...prev, newRandomComment]);
        }
      }, 8000);
    }
    
    return () => {
      if (viewersTimer) clearInterval(viewersTimer);
      if (commentsTimer) clearInterval(commentsTimer);
    };
  }, [isStreaming]);

  const generateStreamKey = () => {
    // Gerar chave de stream baseada no ID do usuário
    const userId = user.id;
    const randomString = Math.random().toString(36).substring(2, 10);
    const generatedKey = `${userId}-${randomString}`;
    setStreamKey(generatedKey);
  };

  const startCountdown = () => {
    setCountdown(5);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          startStream();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startStream = async () => {
    if (!title) {
      setError('Por favor, defina um título para a transmissão');
      return;
    }
    
    try {
      // Criar nova live no backend
      const liveData = {
        title,
        description,
        isPublic,
        streamKey,
        rtmpUrl: streamSettings.rtmpUrl
      };
      
      const newLive = await createLive(liveData);
      setCurrentLive(newLive);
      setIsStreaming(true);
      setViewerCount(0);
      setComments([]);
      setDuration(0);
      setError(null);
    } catch (error) {
      console.error('Erro ao iniciar transmissão:', error);
      setError('Erro ao iniciar transmissão. Tente novamente.');
    }
  };

  const stopStream = async () => {
    try {
      if (currentLive) {
        // Finalizar live no backend
        await endLive(currentLive.id, {
          duration,
          viewerCount,
          commentCount: comments.length
        });
      }
      
      setIsStreaming(false);
      setCurrentLive(null);
      setError(null);
    } catch (error) {
      console.error('Erro ao finalizar transmissão:', error);
      setError('Erro ao finalizar transmissão. Tente novamente.');
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    const userComment = {
      id: Date.now(),
      user: user.name,
      text: newComment,
      timestamp: new Date(),
      isOwner: true
    };
    
    setComments(prev => [...prev, userComment]);
    setNewComment('');
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className="live-streaming-container">
      <div className="live-header">
        <h1>
          <FaVideo /> Transmissão ao Vivo
        </h1>
        <button 
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
        >
          <FaCog /> Configurações
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="live-content">
        <div className="stream-preview">
          {isStreaming ? (
            <div className="active-stream">
              <div className="video-container">
                <div className="video-placeholder">
                  <div className="live-indicator">AO VIVO</div>
                  <div className="stream-info">
                    <div className="stream-title">{title}</div>
                    <div className="stream-stats">
                      <span><FaUsers /> {viewerCount} espectadores</span>
                      <span><FaComments /> {comments.length} comentários</span>
                      <span className="duration">{formatDuration(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="stream-controls">
                <button 
                  className="stop-stream-button"
                  onClick={stopStream}
                >
                  <FaStop /> Encerrar Transmissão
                </button>
              </div>
            </div>
          ) : (
            <div className="stream-setup">
              {countdown !== null ? (
                <div className="countdown">
                  <div className="countdown-number">{countdown}</div>
                  <div className="countdown-text">Iniciando transmissão...</div>
                </div>
              ) : (
                <>
                  <div className="video-placeholder">
                    <div className="placeholder-icon">
                      <FaVideo />
                    </div>
                    <div className="placeholder-text">
                      Preencha as informações e clique em "Iniciar Transmissão"
                    </div>
                  </div>
                  
                  <div className="stream-form">
                    <div className="form-group">
                      <label htmlFor="title">Título da Transmissão*</label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Digite um título para sua transmissão"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="description">Descrição</label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva sua transmissão (opcional)"
                        rows={3}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                        />
                        Transmissão pública (visível para todos)
                      </label>
                    </div>
                    
                    <button 
                      className="start-stream-button"
                      onClick={startCountdown}
                      disabled={!title}
                    >
                      <FaPlay /> Iniciar Transmissão
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="stream-sidebar">
          {isStreaming ? (
            <div className="live-chat">
              <div className="chat-header">
                <h3>Chat ao Vivo</h3>
                <span className="viewer-count"><FaUsers /> {viewerCount}</span>
              </div>
              
              <div className="chat-messages">
                {comments.length === 0 ? (
                  <div className="no-comments">
                    Nenhum comentário ainda. Seja o primeiro a comentar!
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className={`chat-message ${comment.isOwner ? 'owner' : ''}`}>
                      <div className="message-header">
                        <span className="message-user">{comment.user}</span>
                        <span className="message-time">
                          {comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="message-text">{comment.text}</div>
                    </div>
                  ))
                )}
              </div>
              
              <form className="chat-input" onSubmit={handleCommentSubmit}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Digite um comentário..."
                />
                <button type="submit">Enviar</button>
              </form>
            </div>
          ) : (
            <div className="stream-info-sidebar">
              <div className="stream-key-section">
                <h3>Informações de Transmissão</h3>
                <div className="info-item">
                  <span className="info-label">URL RTMP:</span>
                  <div className="info-value-container">
                    <span className="info-value">{streamSettings.rtmpUrl}</span>
                    <button 
                      className="copy-button"
                      onClick={() => navigator.clipboard.writeText(streamSettings.rtmpUrl)}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Chave de Stream:</span>
                  <div className="info-value-container">
                    <span className="info-value">{streamKey}</span>
                    <button 
                      className="copy-button"
                      onClick={() => navigator.clipboard.writeText(streamKey)}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                
                <button 
                  className="regenerate-key-button"
                  onClick={generateStreamKey}
                >
                  Gerar Nova Chave
                </button>
              </div>
              
              <div className="stream-instructions">
                <h3>Como Transmitir</h3>
                <ol>
                  <li>Abra seu software de streaming (OBS Studio, Streamlabs, etc.)</li>
                  <li>Configure a URL RTMP e a Chave de Stream nas configurações</li>
                  <li>Configure sua câmera e microfone</li>
                  <li>Preencha as informações da transmissão nesta página</li>
                  <li>Clique em "Iniciar Transmissão" nesta página</li>
                  <li>Inicie a transmissão no seu software</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <div className="settings-header">
              <h2>Configurações de Transmissão</h2>
              <button 
                className="close-button"
                onClick={() => setShowSettings(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="resolution">Resolução</label>
                <select
                  id="resolution"
                  value={streamSettings.resolution}
                  onChange={(e) => setStreamSettings({...streamSettings, resolution: e.target.value})}
                >
                  <option value="480p">480p</option>
                  <option value="720p">720p (Recomendado)</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="frameRate">Taxa de Quadros</label>
                <select
                  id="frameRate"
                  value={streamSettings.frameRate}
                  onChange={(e) => setStreamSettings({...streamSettings, frameRate: parseInt(e.target.value)})}
                >
                  <option value="24">24 fps</option>
                  <option value="30">30 fps (Recomendado)</option>
                  <option value="60">60 fps</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="bitrate">Taxa de Bits</label>
                <select
                  id="bitrate"
                  value={streamSettings.bitrate}
                  onChange={(e) => setStreamSettings({...streamSettings, bitrate: e.target.value})}
                >
                  <option value="1500kbps">1500 kbps (Baixa)</option>
                  <option value="2500kbps">2500 kbps (Média)</option>
                  <option value="4000kbps">4000 kbps (Alta)</option>
                  <option value="6000kbps">6000 kbps (Ultra)</option>
                </select>
              </div>
              
              <div className="settings-info">
                <h4>Configurações Recomendadas</h4>
                <ul>
                  <li><strong>Conexão Lenta:</strong> 480p, 30fps, 1500kbps</li>
                  <li><strong>Conexão Média:</strong> 720p, 30fps, 2500kbps</li>
                  <li><strong>Conexão Rápida:</strong> 1080p, 60fps, 4000kbps</li>
                </ul>
              </div>
              
              <button 
                className="save-settings-button"
                onClick={() => setShowSettings(false)}
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreaming;
