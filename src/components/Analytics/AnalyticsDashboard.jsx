import React, { useState, useEffect, useContext } from 'react';
import { FaChartBar, FaUsers, FaEye, FaThumbsUp, FaComment, FaClock, FaCalendarAlt, FaGlobe } from 'react-icons/fa';
import { StoriesContext } from '../../contexts/StoriesContext';
import { LivesContext } from '../../contexts/LivesContext';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { fetchStoriesAnalytics } = useContext(StoriesContext);
  const { fetchLivesAnalytics } = useContext(LivesContext);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [storiesData, setStoriesData] = useState(null);
  const [livesData, setLivesData] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        startDate = new Date(customStartDate).toISOString();
        endDate = new Date(customEndDate).toISOString();
      } else {
        const dates = getDateRangeFromOption(dateRange);
        startDate = dates.startDate;
        endDate = dates.endDate;
      }
      
      const [storiesAnalytics, livesAnalytics] = await Promise.all([
        fetchStoriesAnalytics(startDate, endDate),
        fetchLivesAnalytics(startDate, endDate)
      ]);
      
      setStoriesData(storiesAnalytics);
      setLivesData(livesAnalytics);
      
      // Combinar dados para visão geral
      setAnalyticsData({
        totalViews: storiesAnalytics.totalViews + livesAnalytics.totalViews,
        totalEngagements: storiesAnalytics.totalLikes + storiesAnalytics.totalComments + 
                          livesAnalytics.totalLikes + livesAnalytics.totalComments,
        averageRetentionTime: (
          (storiesAnalytics.totalViews * storiesAnalytics.averageRetentionTime) + 
          (livesAnalytics.totalViews * livesAnalytics.averageRetentionTime)
        ) / (storiesAnalytics.totalViews + livesAnalytics.totalViews || 1),
        viewsByDay: combineViewsByDay(storiesAnalytics.viewsByDay, livesAnalytics.viewsByDay),
        viewsByDevice: combineViewsByDevice(storiesAnalytics.viewsByDevice, livesAnalytics.viewsByDevice),
        viewsByLocation: combineViewsByLocation(storiesAnalytics.viewsByLocation, livesAnalytics.viewsByLocation)
      });
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeFromOption = (option) => {
    const endDate = new Date().toISOString();
    let startDate;
    
    switch (option) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    return { startDate, endDate };
  };

  const combineViewsByDay = (storiesViews, livesViews) => {
    const combined = {};
    
    // Adicionar visualizações de stories
    for (const date in storiesViews) {
      combined[date] = { stories: storiesViews[date], lives: 0 };
    }
    
    // Adicionar visualizações de lives
    for (const date in livesViews) {
      if (combined[date]) {
        combined[date].lives = livesViews[date];
      } else {
        combined[date] = { stories: 0, lives: livesViews[date] };
      }
    }
    
    // Converter para array e ordenar por data
    return Object.entries(combined)
      .map(([date, views]) => ({ date, ...views }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const combineViewsByDevice = (storiesViews, livesViews) => {
    const combined = {};
    
    // Adicionar visualizações de stories
    for (const device in storiesViews) {
      combined[device] = { stories: storiesViews[device], lives: 0 };
    }
    
    // Adicionar visualizações de lives
    for (const device in livesViews) {
      if (combined[device]) {
        combined[device].lives = livesViews[device];
      } else {
        combined[device] = { stories: 0, lives: livesViews[device] };
      }
    }
    
    return combined;
  };

  const combineViewsByLocation = (storiesViews, livesViews) => {
    const combined = {};
    
    // Adicionar visualizações de stories
    for (const location in storiesViews) {
      combined[location] = { stories: storiesViews[location], lives: 0 };
    }
    
    // Adicionar visualizações de lives
    for (const location in livesViews) {
      if (combined[location]) {
        combined[location].lives = livesViews[location];
      } else {
        combined[location] = { stories: 0, lives: livesViews[location] };
      }
    }
    
    // Converter para array e ordenar por total de visualizações
    return Object.entries(combined)
      .map(([location, views]) => ({ 
        location, 
        stories: views.stories, 
        lives: views.lives,
        total: views.stories + views.lives
      }))
      .sort((a, b) => b.total - a.total);
  };

  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setDateRange(value);
    
    if (value === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      loadAnalyticsData();
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    loadAnalyticsData();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const renderOverview = () => {
    if (!analyticsData) return null;
    
    return (
      <div className="analytics-overview">
        <div className="metrics-cards">
          <div className="metric-card">
            <div className="metric-icon">
              <FaEye />
            </div>
            <div className="metric-content">
              <h3>Total de Visualizações</h3>
              <p className="metric-value">{formatNumber(analyticsData.totalViews)}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FaUsers />
            </div>
            <div className="metric-content">
              <h3>Engajamento Total</h3>
              <p className="metric-value">{formatNumber(analyticsData.totalEngagements)}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FaClock />
            </div>
            <div className="metric-content">
              <h3>Tempo Médio de Retenção</h3>
              <p className="metric-value">{formatTime(analyticsData.averageRetentionTime)}</p>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>Visualizações por Dia</h3>
          <div className="views-by-day-chart">
            {analyticsData.viewsByDay.map(day => (
              <div key={day.date} className="day-column">
                <div className="day-bars">
                  <div 
                    className="stories-bar"
                    style={{ 
                      height: `${(day.stories / Math.max(...analyticsData.viewsByDay.map(d => Math.max(d.stories, d.lives)))) * 100}%` 
                    }}
                  >
                    <span className="bar-tooltip">{day.stories} visualizações</span>
                  </div>
                  <div 
                    className="lives-bar"
                    style={{ 
                      height: `${(day.lives / Math.max(...analyticsData.viewsByDay.map(d => Math.max(d.stories, d.lives)))) * 100}%` 
                    }}
                  >
                    <span className="bar-tooltip">{day.lives} visualizações</span>
                  </div>
                </div>
                <div className="day-label">{formatDate(day.date)}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color stories"></div>
              <span>Stories</span>
            </div>
            <div className="legend-item">
              <div className="legend-color lives"></div>
              <span>Lives</span>
            </div>
          </div>
        </div>
        
        <div className="charts-row">
          <div className="chart-container half-width">
            <h3>Visualizações por Dispositivo</h3>
            <div className="views-by-device">
              {Object.entries(analyticsData.viewsByDevice).map(([device, views]) => (
                <div key={device} className="device-item">
                  <div className="device-info">
                    <span className="device-name">{device}</span>
                    <span className="device-total">{formatNumber(views.stories + views.lives)}</span>
                  </div>
                  <div className="device-bar-container">
                    <div 
                      className="device-bar stories"
                      style={{ 
                        width: `${(views.stories / (views.stories + views.lives)) * 100}%` 
                      }}
                    ></div>
                    <div 
                      className="device-bar lives"
                      style={{ 
                        width: `${(views.lives / (views.stories + views.lives)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container half-width">
            <h3>Visualizações por Localização</h3>
            <div className="views-by-location">
              {analyticsData.viewsByLocation.slice(0, 5).map(location => (
                <div key={location.location} className="location-item">
                  <div className="location-info">
                    <span className="location-name">{location.location}</span>
                    <span className="location-total">{formatNumber(location.total)}</span>
                  </div>
                  <div className="location-bar-container">
                    <div 
                      className="location-bar stories"
                      style={{ 
                        width: `${(location.stories / location.total) * 100}%` 
                      }}
                    ></div>
                    <div 
                      className="location-bar lives"
                      style={{ 
                        width: `${(location.lives / location.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStoriesAnalytics = () => {
    if (!storiesData) return null;
    
    return (
      <div className="stories-analytics">
        <div className="metrics-cards">
          <div className="metric-card">
            <div className="metric-icon">
              <FaEye />
            </div>
            <div className="metric-content">
              <h3>Visualizações de Stories</h3>
              <p className="metric-value">{formatNumber(storiesData.totalViews)}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FaThumbsUp />
            </div>
            <div className="metric-content">
              <h3>Likes</h3>
              <p className="metric-value">{formatNumber(storiesData.totalLikes)}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FaComment />
            </div>
            <div className="metric-content">
              <h3>Comentários</h3>
              <p className="metric-value">{formatNumber(storiesData.totalComments)}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FaClock />
            </div>
            <div className="metric-content">
              <h3>Tempo Médio de Visualização</h3>
              <p className="metric-value">{formatTime(storiesData.averageRetentionTime)}</p>
            </div>
          </div>
        </div>
        
        <div className="stories-performance">
          <h3>Desempenho dos Stories</h3>
          <div className="stories-table">
            <table>
              <thead>
                <tr>
                  <th>Story</th>
                  <th>Visualizações</th>
                  <th>Likes</th>
                  <th>Comentários</th>
                  <th>Tempo Médio</th>
                  <th>Taxa de Conclusão</th>
                </tr>
              </thead>
              <tbody>
                {storiesData.topStories.map(story => (
                  <tr key={story.id}>
                    <td>{story.title}</td>
                    <td>{formatNumber(story.views)}</td>
                    <td>{formatNumber(story.likes)}</td>
                    <td>{formatNumber(story.comments)}</td>
                    <td>{formatTime(story.averageRetentionTime)}</td>
                    <td>{story.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="charts-row">
          <div className="chart-container half-width">
            <h3>Visualizações por Slide</h3>
            <div className="slide-views-chart">
              {storiesData.slidePerformance.map((slide, index) => (
                <div key={index} className="slide-item">
                  <div className="slide-info">
                    <span className="slide-number">Slide {index + 1}</span>
                    <span className="slide-views">{formatNumber(slide.views)}</span>
                  </div>
                  <div className="slide-bar-container">
                    <div 
                      className="slide-bar"
                      style={{ 
                        width: `${(slide.views / storiesData.slidePerformance[0].views) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container half-width">
            <h3>Interações por Tipo</h3>
            <div className="interactions-chart">
              {Object.entries(storiesData.interactionsByType).map(([type, count]) => (
                <div key={type} className="interaction-item">
                  <div className="interaction-info">
                    <span className="interaction-type">{type}</span>
                    <span className="interaction-count">{formatNumber(count)}</span>
                  </div>
                  <div className="interaction-bar-container">
                    <div 
                      className="interaction-bar"
                      style={{ 
                        width: `${(count / Math.max(...Object.values(storiesData.interactionsByType))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLivesAnalytics = () => {
    if (!livesData) return null;
    
    return (
      <div className="lives-analytics">
        <div className="metrics-cards">
          <div className="metric-card">
            <div className="metric-icon">
              <FaEye />
            </div>
            <div className="metric-content">
              <h3>Visualizações de Lives</h3>
              <p className="metric-value">{formatNumber(livesData.totalViews)}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FaUsers />
            </div>
            <div className="metric-content">
              <h3>Espectadores Únicos</h3>
              <p className="metric-value">{formatNumber(livesData.uniqueViewers)}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FaComment />
            </div>
            <div className="metric-content">
              <h3>Comentários</h3>
              <p className="metric-value">{formatNumber(livesData.totalComments)}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FaClock />
            </div>
            <div className="metric-content">
              <h3>Tempo Médio de Visualização</h3>
              <p className="metric-value">{formatTime(livesData.averageRetentionTime)}</p>
            </div>
          </div>
        </div>
        
        <div className="lives-performance">
          <h3>Desempenho das Lives</h3>
          <div className="lives-table">
            <table>
              <thead>
                <tr>
                  <th>Live</th>
                  <th>Data</th>
                  <th>Duração</th>
                  <th>Espectadores</th>
                  <th>Pico de Espectadores</th>
                  <th>Comentários</th>
                  <th>Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {livesData.topLives.map(live => (
                  <tr key={live.id}>
                    <td>{live.title}</td>
                    <td>{new Date(live.date).toLocaleDateString('pt-BR')}</td>
                    <td>{formatTime(live.duration)}</td>
                    <td>{formatNumber(live.viewers)}</td>
                    <td>{formatNumber(live.peakViewers)}</td>
                    <td>{formatNumber(live.comments)}</td>
                    <td>{formatTime(live.averageRetentionTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="charts-row">
          <div className="chart-container half-width">
            <h3>Retenção de Espectadores</h3>
            <div className="retention-chart">
              {livesData.retentionByMinute.map((retention, minute) => (
                <div key={minute} className="retention-item">
                  <div className="retention-info">
                    <span className="minute-label">{minute} min</span>
                    <span className="retention-percentage">{retention}%</span>
                  </div>
                  <div className="retention-bar-container">
                    <div 
                      className="retention-bar"
                      style={{ 
                        width: `${retention}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container half-width">
            <h3>Fontes de Tráfego</h3>
            <div className="traffic-sources-chart">
              {Object.entries(livesData.trafficSources).map(([source, percentage]) => (
                <div key={source} className="traffic-source-item">
                  <div className="traffic-source-info">
                    <span className="source-name">{source}</span>
                    <span className="source-percentage">{percentage}%</span>
                  </div>
                  <div className="traffic-source-bar-container">
                    <div 
                      className="traffic-source-bar"
                      style={{ 
                        width: `${percentage}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-dashboard-container">
      <div className="analytics-header">
        <h1>
          <FaChartBar /> Analytics
        </h1>
        
        <div className="date-range-selector">
          <select 
            value={dateRange}
            onChange={handleDateRangeChange}
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
            <option value="custom">Período personalizado</option>
          </select>
          
          {showCustomDatePicker && (
            <form className="custom-date-form" onSubmit={handleCustomDateSubmit}>
              <div className="date-inputs">
                <div className="date-input-group">
                  <label>De:</label>
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="date-input-group">
                  <label>Até:</label>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <button type="submit" className="apply-date-button">
                Aplicar
              </button>
            </form>
          )}
        </div>
      </div>
      
      <div className="analytics-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          Stories
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'lives' ? 'active' : ''}`}
          onClick={() => setActiveTab('lives')}
        >
          Lives
        </button>
      </div>
      
      <div className="analytics-content">
        {loading ? (
          <div className="analytics-loading">
            <div className="spinner"></div>
            <p>Carregando dados de analytics...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'stories' && renderStoriesAnalytics()}
            {activeTab === 'lives' && renderLivesAnalytics()}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
