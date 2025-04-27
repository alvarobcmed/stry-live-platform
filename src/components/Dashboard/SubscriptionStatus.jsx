import React, { useState, useEffect, useContext } from 'react';
import { SubscriptionContext } from '../../contexts/SubscriptionContext';
import { FaCheckCircle, FaTimesCircle, FaCreditCard, FaInfoCircle } from 'react-icons/fa';
import './SubscriptionStatus.css';

const SubscriptionStatus = () => {
  const { subscription, fetchSubscription, cancelSubscription } = useContext(SubscriptionContext);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const loadSubscriptionData = async () => {
      setLoading(true);
      try {
        await fetchSubscription();
        await fetchPlans();
      } catch (error) {
        console.error('Erro ao carregar dados da assinatura:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionData();
  }, [fetchSubscription]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/stripe/plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      setShowCancelModal(false);
      // Atualizar dados da assinatura
      await fetchSubscription();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
    }
  };

  const handleUpgradeSubscription = async () => {
    if (!selectedPlan) return;
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ priceId: selectedPlan.priceId })
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal-session', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erro ao acessar portal de assinatura:', error);
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

  const formatCurrency = (amount, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="subscription-loading">
        <div className="spinner"></div>
        <p>Carregando informações da assinatura...</p>
      </div>
    );
  }

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <h2>Status da Assinatura</h2>
        <button 
          className="manage-subscription-button"
          onClick={handleManageSubscription}
        >
          <FaCreditCard /> Gerenciar Pagamento
        </button>
      </div>

      {!subscription || !subscription.hasSubscription ? (
        <div className="no-subscription">
          <div className="no-subscription-icon">
            <FaInfoCircle />
          </div>
          <h3>Sem assinatura ativa</h3>
          <p>Você ainda não possui uma assinatura ativa. Escolha um plano abaixo para começar.</p>
          
          <div className="plans-grid">
            {plans.map(plan => (
              <div key={plan.id} className="plan-card">
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <span className="plan-price">
                    {formatCurrency(plan.amount)}/{plan.interval}
                  </span>
                </div>
                
                <div className="plan-features">
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <FaCheckCircle className="feature-icon" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button 
                  className="subscribe-button"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowUpgradeModal(true);
                  }}
                >
                  Assinar Agora
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="active-subscription">
          <div className="subscription-status">
            <div className={`status-indicator ${subscription.subscription.status === 'active' ? 'active' : 'inactive'}`}>
              {subscription.subscription.status === 'active' ? (
                <>
                  <FaCheckCircle className="status-icon" />
                  <span>Assinatura Ativa</span>
                </>
              ) : (
                <>
                  <FaTimesCircle className="status-icon" />
                  <span>Assinatura {subscription.subscription.status}</span>
                </>
              )}
            </div>
            
            {subscription.subscription.cancelAtPeriodEnd && (
              <div className="cancellation-notice">
                <FaInfoCircle className="notice-icon" />
                <span>Sua assinatura será cancelada em {formatDate(subscription.subscription.currentPeriodEnd)}</span>
              </div>
            )}
          </div>
          
          <div className="subscription-details">
            <div className="detail-item">
              <span className="detail-label">Plano:</span>
              <span className="detail-value">{subscription.subscription.plan.name}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Valor:</span>
              <span className="detail-value">
                {formatCurrency(subscription.subscription.plan.amount)}/{subscription.subscription.plan.interval}
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Próxima cobrança:</span>
              <span className="detail-value">{formatDate(subscription.subscription.currentPeriodEnd)}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status-${subscription.subscription.status}`}>
                {subscription.subscription.status === 'active' ? 'Ativa' : 
                 subscription.subscription.status === 'trialing' ? 'Em período de teste' :
                 subscription.subscription.status === 'past_due' ? 'Pagamento pendente' :
                 subscription.subscription.status === 'canceled' ? 'Cancelada' :
                 subscription.subscription.status}
              </span>
            </div>
          </div>
          
          <div className="subscription-actions">
            {!subscription.subscription.cancelAtPeriodEnd && (
              <button 
                className="cancel-subscription-button"
                onClick={() => setShowCancelModal(true)}
              >
                Cancelar Assinatura
              </button>
            )}
            
            <button 
              className="upgrade-subscription-button"
              onClick={() => setShowUpgradeModal(true)}
            >
              Mudar de Plano
            </button>
          </div>
          
          <div className="subscription-info">
            <h3>Recursos do seu plano</h3>
            <ul className="plan-features-list">
              {plans.find(p => p.id === subscription.subscription.plan.id)?.features.map((feature, index) => (
                <li key={index}>
                  <FaCheckCircle className="feature-icon" /> {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cancelar Assinatura</h3>
            <p>Tem certeza que deseja cancelar sua assinatura?</p>
            <p>Você continuará tendo acesso aos recursos até o final do período atual ({formatDate(subscription.subscription.currentPeriodEnd)}).</p>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowCancelModal(false)}
              >
                Voltar
              </button>
              <button 
                className="confirm-button"
                onClick={handleCancelSubscription}
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showUpgradeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{subscription?.hasSubscription ? 'Mudar de Plano' : 'Escolher Plano'}</h3>
            
            <div className="plans-selection">
              {plans.map(plan => (
                <div 
                  key={plan.id} 
                  className={`plan-option ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="plan-option-header">
                    <h4>{plan.name}</h4>
                    <span className="plan-price">
                      {formatCurrency(plan.amount)}/{plan.interval}
                    </span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlan(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button"
                onClick={handleUpgradeSubscription}
                disabled={!selectedPlan}
              >
                {subscription?.hasSubscription ? 'Mudar para este Plano' : 'Assinar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
