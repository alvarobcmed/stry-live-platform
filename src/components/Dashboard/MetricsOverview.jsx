import React, { useState, useEffect } from 'react';
import { FaChartLine, FaEye, FaMousePointer, FaUsers, FaCalendarAlt, FaMobileAlt, FaDesktop } from 'react-icons/fa';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './MetricsOverview.css';

// Registrar componentes do Chart.js
Chart.register(...registerables);

const MetricsOverview = ({ metrics }) => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [metricsData, setMetricsData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);

  useEffect(() => {
    fetchMetricsData(period);
  }, [period]);

  const fetchMetricsData = async (days) => {
    setLoading(true);
    try {
      // Buscar visão geral das métricas
      const overviewResponse = await fetch(`/api/analytics/overview?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Buscar dados diários
      const dailyResponse = await fetch(`/api/analytics/engagement?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Buscar dados de dispositivos
      const usersResponse = await fetch(`/api/analytics/users?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (overviewResponse.ok && dailyResponse.ok && usersResponse.ok) {
        const overview = await overviewResponse.json();
        const daily = await dailyResponse.json();
        const users = await usersResponse.json();
        
        setMetricsData(overview.overview);
        
        // Preparar dados para gráficos
        prepareChartData(daily.dailyEngagements, users.deviceMetrics);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (dailyEngagements, deviceMetrics) => {
    // Preparar dados para gráfico de linha (visualizações diárias)
    const dates = dailyEngagements.map(item => item.date);
    const views = dailyEngagements.map(item => item.views);
    const clicks = dailyEngagements.map(item => item.clicks);
    
    setDailyData({
      labels: dates,
      datasets: [
        {
          label: 'Visualizações',
          data: views,
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Cliques',
          data: clicks,
          borderColor: '#f72585',
          backgroundColor: 'rgba(247, 37, 133, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    });
    
    // Preparar dados para gráfico de pizza (dispositivos)
    const deviceTypes = deviceMetrics.map(item => item.type);
    const deviceCounts = deviceMetrics.map(item => item.count);
    
    setDeviceData({
      labels: deviceTypes,
      datasets: [
        {
          data: deviceCounts,
          backgroundColor: [
            '#4361ee',
            '#f72585',
            '#4cc9f0',
            '#7209b7',
            '#3a0ca3'
          ],
          borderWidth: 1
        }
      ]
    });
    
    // Preparar dados para gráfico de barras (engajamento)
    const engagementTypes = ['Visualizações', 'Cliques', 'Conclusões', 'Likes', 'Compartilhamentos'];
    const engagementCounts = [
      dailyEngagements.reduce((sum, item) => sum + item.views, 0),
      dailyEngagements.reduce((sum, item) => sum + item.clicks, 0),
      dailyEngagements.reduce((sum, item) => sum + (item.completions || 0), 0),
      dailyEngagements.reduce((sum, item) => sum + (item.likes || 0), 0),
      dailyEngagements.reduce((sum, item) => sum + (item.shares || 0), 0)
    ];
    
    setEngagementData({
      labels: engagementTypes,
      datasets: [
        {
          label: 'Engajamento',
          data: engagementCounts,
          backgroundColor: [
            'rgba(67, 97, 238, 0.7)',
            'rgba(247, 37, 133, 0.7)',
            'rgba(76, 201, 240, 0.7)',
            'rgba(114, 9, 183, 0.7)',
            'rgba(58, 12, 163, 0.7)'
          ],
          borderWidth: 1
        }
      ]
    });
  };

  const formatNumber = (number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number;
  };

  if (loading && !metricsData) {
    return (
      <div className="metrics-loading">
        <div className="spinner"></div>
        <p>Carregando métricas...</p>
      </div>
    );
  }

  return (
    <div className="metrics-overview-container">
      <div className="metrics-header">
        <h2>Visão Geral de Métricas</h2>
        <div className="period-selector">
          <label htmlFor="period-select">Período:</label>
          <select 
            id="period-select" 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
      </div>

      <div className="metrics-cards">
        <div className="metric-card">
          <div className="metric-icon">
            <FaEye />
          </div>
          <div className="metric-content">
            <h3>Visualizações</h3>
            <p className="metric-value">{formatNumber(metricsData?.totalViews || 0)}</p>
            <p className="metric-trend">
              {metricsData?.viewsTrend > 0 ? '+' : ''}{metricsData?.viewsTrend?.toFixed(1)}% vs período anterior
            </p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <FaMousePointer />
          </div>
          <div className="metric-content">
            <h3>Cliques</h3>
            <p className="metric-value">{formatNumber(metricsData?.totalClicks || 0)}</p>
            <p className="metric-trend">
              Taxa de conversão: {metricsData?.conversionRate?.toFixed(1)}%
            </p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-content">
            <h3>Usuários Únicos</h3>
            <p className="metric-value">{formatNumber(metricsData?.uniqueUsers || 0)}</p>
            <p className="metric-trend">
              {formatNumber(metricsData?.viewsPerUser?.toFixed(1))} visualizações por usuário
            </p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <FaCalendarAlt />
          </div>
          <div className="metric-content">
            <h3>Stories Ativos</h3>
            <p className="metric-value">{formatNumber(metricsData?.totalStories || 0)}</p>
            <p className="metric-trend">
              {formatNumber(metricsData?.totalLives || 0)} lives realizadas
            </p>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card large">
          <h3>Visualizações e Cliques Diários</h3>
          {dailyData && (
            <Line 
              data={dailyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          )}
        </div>
        
        <div className="chart-card">
          <h3>Dispositivos</h3>
          {deviceData && (
            <div className="pie-chart-container">
              <Pie 
                data={deviceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    }
                  }
                }}
              />
            </div>
          )}
          <div className="device-breakdown">
            <div className="device-item">
              <FaMobileAlt className="device-icon mobile" />
              <span>Mobile: {metricsData?.mobilePercentage || '0'}%</span>
            </div>
            <div className="device-item">
              <FaDesktop className="device-icon desktop" />
              <span>Desktop: {metricsData?.desktopPercentage || '0'}%</span>
            </div>
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Engajamento</h3>
          {engagementData && (
            <Bar 
              data={engagementData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      <div className="metrics-footer">
        <button className="view-detailed-button">
          <FaChartLine /> Ver Relatório Detalhado
        </button>
        <button className="export-button">
          Exportar Dados
        </button>
      </div>
    </div>
  );
};

export default MetricsOverview;
