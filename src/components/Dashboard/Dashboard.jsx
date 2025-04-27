import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { StoriesContext } from '../../contexts/StoriesContext';
import { NotificationsContext } from '../../contexts/NotificationsContext';
import { SubscriptionContext } from '../../contexts/SubscriptionContext';
import StoriesList from './StoriesList';
import IntegrationsList from './IntegrationsList';
import SubscriptionStatus from './SubscriptionStatus';
import MetricsOverview from './MetricsOverview';
import { FaPlus, FaBell, FaChartBar, FaCog, FaTag, FaVideo } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { stories, fetchStories } = useContext(StoriesContext);
  const { unreadCount, fetchNotifications } = useContext(NotificationsContext);
  const { subscription, fetchSubscription } = useContext(SubscriptionContext);
  const [activeTab, setActiveTab] = useState('stories');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStories(),
          fetchNotifications(),
          fetchSubscription(),
          fetchMetrics()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchStories, fetchNotifications, fetchSubscription]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.overview);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stories':
        return <StoriesList stories={stories} loading={loading} />;
      case 'integrations':
        return <IntegrationsList />;
      case 'metrics':
        return <MetricsOverview metrics={metrics} />;
      case 'subscription':
        return <SubscriptionStatus subscription={subscription} />;
      default:
        return <StoriesList stories={stories} loading={loading} />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-actions">
          <Link to="/notifications" className="notification-icon">
            <FaBell />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </Link>
          <Link to="/settings" className="settings-icon">
            <FaCog />
          </Link>
        </div>
      </div>

      <div className="dashboard-welcome">
        <h2>Bem-vindo, {user?.name || 'Usuário'}!</h2>
        <p>Gerencie seus stories, lives e integrações em um só lugar.</p>
      </div>

      <div className="dashboard-quick-actions">
        <Link to="/stories/new" className="quick-action-button">
          <FaPlus /> Novo Story
        </Link>
        <Link to="/lives/new" className="quick-action-button">
          <FaVideo /> Nova Live
        </Link>
        <Link to="/integration/tag-manager" className="quick-action-button">
          <FaTag /> Integrar Site
        </Link>
        <Link to="/analytics" className="quick-action-button">
          <FaChartBar /> Ver Analytics
        </Link>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          Stories
        </button>
        <button 
          className={`tab-button ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          Integrações
        </button>
        <button 
          className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Métricas
        </button>
        <button 
          className={`tab-button ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          Assinatura
        </button>
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;
