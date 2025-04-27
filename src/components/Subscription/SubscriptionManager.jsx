import React, { useState, useEffect, useContext } from 'react';
import { SubscriptionContext } from '../../contexts/SubscriptionContext';
import { FaCreditCard, FaCheckCircle, FaTimesCircle, FaArrowUp, FaArrowDown, FaInfoCircle } from 'react-icons/fa';
import './SubscriptionManager.css';

const SubscriptionManager = () => {
  const { 
    subscription, 
    plans, 
    fetchSubscription, 
    fetchPlans, 
    createCheckoutSession,
    createCustomerPortalSession,
    cancelSubscription,
    updateSubscription
  } = useContext(SubscriptionContext);
  
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

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
  }, [fetchSubscription, fetchPlans]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setPlanLoading(true);
    try {
      const { url } = await createCheckoutSession(selectedPlan.id);
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await createCustomerPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao criar sessão do portal do cliente:', error);
    }
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelSubscription(cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      await fetchSubscription();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
    }
  };

  const handleUpgradeClick = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleDowngradeClick = (plan) => {
    setSelectedPlan(plan);
    setShowDowngradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    try {
      await updateSubscription(selectedPlan.id);
      setShowUpgradeModal(false);
      setSelectedPlan(null);
      await fetchSubscription();
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
    }
  };

  const handleConfirmDowngrade = async () => {
    try {
      await updateSubscription(selectedPlan.id);
      setShowDowngradeModal(false);
      setSelectedPlan(null);
      await fetchSubscription();
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="status-badge active"><FaCheckCircle /> Ativa</span>;
      case 'canceled':
        return <span className="status-badge canceled"><FaTimesCircle /> Cancelada</span>;
      case 'past_due':
        return <span className="status-badge past-due"><FaTimesCircle /> Pagamento Atrasado</span>;
      case 'unpaid':
        return <span className="status-badge unpaid"><FaTimesCircle /> Não Paga</span>;
      case 'trialing':
        return <span className="status-badge trialing"><FaInfoCircle /> Período de Teste</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const renderCurrentSubscription = () => {
    if (!subscription) {
      return (
        <div className="no-subscription">
          <h3>Você não possui uma assinatura ativa</h3>
          <p>Escolha um plano abaixo para começar a usar todos os recursos do Stry.live</p>
        </div>
      );
    }
    
    return (
      <div className="current-subscription">
        <div className="subscription-header">
          <h3>Sua Assinatura Atual</h3>
          {getStatusBadge(subscription.status)}
        </div>
        
        <div className="subscription-details">
          <div className="detail-item">
            <span className="detail-label">Plano:</span>
            <span className="detail-value">{subscription.plan.name}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Preço:</span>
            <span className="detail-value">{formatCurrency(subscription.plan.amount)} / {subscription.plan.interval}</span>
          </div>
          
          {subscription.current_period_end && (
            <div className="detail-item">
              <span className="detail-label">Próxima cobrança:</span>
              <span className="detail-value">{formatDate(subscription.current_period_end)}</span>
            </div>
          )}
          
          {subscription.cancel_at_period_end && (
            <div className="detail-item">
              <span className="detail-label">Cancelamento agendado para:</span>
              <span className="detail-value">{formatDate(subscription.current_period_end)}</span>
            </div>
          )}
          
          {subscription.trial_end && (
            <div className="detail-item">
              <span className="detail-label">Período de teste termina em:</span>
              <span className="detail-value">{formatDate(subscription.trial_end)}</span>
            </div>
          )}
        </div>
        
        <div className="subscription-actions">
          <button 
            className="manage-button"
            onClick={handleManageSubscription}
          >
            <FaCreditCard /> Gerenciar Pagamento
          </button>
          
          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <button 
              className="cancel-button"
              onClick={handleCancelClick}
            >
              <FaTimesCircle /> Cancelar Assinatura
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPlans = () => {
    if (!plans || plans.length === 0) {
      return (
        <div className="no-plans">
          <p>Nenhum plano disponível no momento</p>
        </div>
      );
    }
    
    // Ordenar planos por preço
    const sortedPlans = [...plans].sort((a, b) => a.amount - b.amount);
    
    return (
      <div className="plans-container">
        {sortedPlans.map(plan => {
          const isCurrentPlan = subscription && subscription.plan.id === plan.id;
          const isPlanHigher = subscription && subscription.plan.amount < plan.amount;
          const isPlanLower = subscription && subscription.plan.amount > plan.amount;
          
          return (
            <div 
              key={plan.id} 
              className={`plan-card ${isCurrentPlan ? 'current-plan' : ''} ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
              onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
            >
              {isCurrentPlan && (
                <div className="current-plan-badge">
                  Plano Atual
                </div>
              )}
              
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <p className="plan-price">
                  {formatCurrency(plan.amount)} <span className="price-interval">/ {plan.interval}</span>
                </p>
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
              
              <div className="plan-actions">
                {!subscription && (
                  <button 
                    className="subscribe-button"
                    onClick={handleSubscribe}
                    disabled={selectedPlan?.id !== plan.id || planLoading}
                  >
                    {planLoading && selectedPlan?.id === plan.id ? 'Processando...' : 'Assinar'}
                  </button>
                )}
                
                {subscription && subscription.status === 'active' && !isCurrentPlan && (
                  <>
                    {isPlanHigher && (
                      <button 
                        className="upgrade-button"
                        onClick={() => handleUpgradeClick(plan)}
                      >
                        <FaArrowUp /> Fazer Upgrade
                      </button>
                    )}
                    
                    {isPlanLower && (
                      <button 
                        className="downgrade-button"
                        onClick={() => handleDowngradeClick(plan)}
                      >
                        <FaArrowDown /> Fazer Downgrade
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="subscription-manager-container">
      <div className="subscription-header">
        <h1>
          <FaCreditCard /> Gerenciamento de Assinatura
        </h1>
      </div>
      
      {loading ? (
        <div className="subscription-loading">
          <div className="spinner"></div>
          <p>Carregando informações da assinatura...</p>
        </div>
      ) : (
        <>
          {renderCurrentSubscription()}
          
          <div className="plans-section">
            <h2>Planos Disponíveis</h2>
            {renderPlans()}
          </div>
          
          <div className="subscription-info">
            <h3>Informações Importantes</h3>
            <ul>
              <li>As assinaturas são cobradas automaticamente a cada período.</li>
              <li>Você pode cancelar sua assinatura a qualquer momento.</li>
              <li>Ao cancelar, sua assinatura permanecerá ativa até o final do período atual.</li>
              <li>Upgrades são aplicados imediatamente, com cobrança proporcional.</li>
              <li>Downgrades são aplicados no próximo período de cobrança.</li>
            </ul>
          </div>
        </>
      )}
      
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="cancel-modal">
            <h3>Cancelar Assinatura</h3>
            <p>Tem certeza que deseja cancelar sua assinatura?</p>
            <p>Sua assinatura permanecerá ativa até {formatDate(subscription.current_period_end)}.</p>
            
            <div className="form-group">
              <label htmlFor="cancelReason">Motivo do cancelamento (opcional):</label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Conte-nos por que você está cancelando..."
                rows={4}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-action"
                onClick={() => setShowCancelModal(false)}
              >
                Voltar
              </button>
              <button 
                className="confirm-action"
                onClick={handleConfirmCancel}
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showUpgradeModal && selectedPlan && (
        <div className="modal-overlay">
          <div className="upgrade-modal">
            <h3>Fazer Upgrade de Plano</h3>
            <p>Você está prestes a fazer upgrade para o plano <strong>{selectedPlan.name}</strong>.</p>
            <p>O valor proporcional será cobrado imediatamente.</p>
            
            <div className="plan-change-details">
              <div className="plan-from">
                <h4>Plano Atual</h4>
                <p>{subscription.plan.name}</p>
                <p className="plan-price">{formatCurrency(subscription.plan.amount)} / {subscription.plan.interval}</p>
              </div>
              
              <div className="plan-arrow">
                <FaArrowRight />
              </div>
              
              <div className="plan-to">
                <h4>Novo Plano</h4>
                <p>{selectedPlan.name}</p>
                <p className="plan-price">{formatCurrency(selectedPlan.amount)} / {selectedPlan.interval}</p>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-action"
                onClick={() => setShowUpgradeModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="confirm-action"
                onClick={handleConfirmUpgrade}
              >
                Confirmar Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDowngradeModal && selectedPlan && (
        <div className="modal-overlay">
          <div className="downgrade-modal">
            <h3>Fazer Downgrade de Plano</h3>
            <p>Você está prestes a fazer downgrade para o plano <strong>{selectedPlan.name}</strong>.</p>
            <p>A alteração será aplicada no próximo período de cobrança em {formatDate(subscription.current_period_end)}.</p>
            
            <div className="plan-change-details">
              <div className="plan-from">
                <h4>Plano Atual</h4>
                <p>{subscription.plan.name}</p>
                <p className="plan-price">{formatCurrency(subscription.plan.amount)} / {subscription.plan.interval}</p>
              </div>
              
              <div className="plan-arrow">
                <FaArrowRight />
              </div>
              
              <div className="plan-to">
                <h4>Novo Plano</h4>
                <p>{selectedPlan.name}</p>
                <p className="plan-price">{formatCurrency(selectedPlan.amount)} / {selectedPlan.interval}</p>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-action"
                onClick={() => setShowDowngradeModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="confirm-action"
                onClick={handleConfirmDowngrade}
              >
                Confirmar Downgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
