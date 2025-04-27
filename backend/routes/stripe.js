// Arquivo de mock para simular respostas da API Stripe
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Dados simulados
const mockPlans = [
  {
    id: 'prod_basic',
    name: 'Plano Básico',
    description: 'Ideal para pequenos negócios',
    priceId: 'price_basic',
    amount: 49.90,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    trialPeriodDays: 7,
    features: ['5 stories por mês', 'Métricas básicas', 'Suporte por email']
  },
  {
    id: 'prod_pro',
    name: 'Plano Profissional',
    description: 'Para negócios em crescimento',
    priceId: 'price_pro',
    amount: 99.90,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    trialPeriodDays: 7,
    features: ['20 stories por mês', 'Métricas avançadas', 'Suporte prioritário', 'Transmissões ao vivo']
  },
  {
    id: 'prod_enterprise',
    name: 'Plano Empresarial',
    description: 'Solução completa para grandes empresas',
    priceId: 'price_enterprise',
    amount: 199.90,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    trialPeriodDays: 7,
    features: ['Stories ilimitados', 'Métricas avançadas', 'Suporte 24/7', 'Transmissões ao vivo', 'API personalizada']
  }
];

const mockSubscription = {
  id: 'sub_12345',
  status: 'active',
  currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  plan: {
    id: 'prod_pro',
    name: 'Plano Profissional',
    description: 'Para negócios em crescimento',
    priceId: 'price_pro',
    amount: 99.90,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1
  }
};

const mockInvoices = [
  {
    id: 'in_12345',
    amount: 99.90,
    currency: 'brl',
    status: 'paid',
    paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    periodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    invoiceUrl: 'https://example.com/invoice/12345',
    pdfUrl: 'https://example.com/invoice/12345/pdf'
  },
  {
    id: 'in_67890',
    amount: 99.90,
    currency: 'brl',
    status: 'paid',
    paidAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    periodStart: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    invoiceUrl: 'https://example.com/invoice/67890',
    pdfUrl: 'https://example.com/invoice/67890/pdf'
  }
];

// Rotas simuladas
router.get('/plans', (req, res) => {
  return res.status(200).json(mockPlans);
});

router.post('/create-checkout-session', auth, (req, res) => {
  const { priceId } = req.body;
  
  if (!priceId) {
    return res.status(400).json({ msg: 'ID do preço é obrigatório' });
  }
  
  return res.status(200).json({ 
    sessionId: 'cs_test_' + Math.random().toString(36).substring(2, 15),
    url: 'https://checkout.stripe.com/pay/cs_test_' + Math.random().toString(36).substring(2, 15)
  });
});

router.post('/webhook', (req, res) => {
  return res.status(200).json({ received: true });
});

router.get('/subscription', auth, (req, res) => {
  return res.status(200).json({
    hasSubscription: true,
    subscription: mockSubscription
  });
});

router.post('/cancel-subscription', auth, (req, res) => {
  const updatedSubscription = {
    ...mockSubscription,
    cancelAtPeriodEnd: true
  };
  
  return res.status(200).json({
    msg: 'Assinatura cancelada com sucesso',
    subscription: updatedSubscription
  });
});

router.post('/update-subscription', auth, (req, res) => {
  const { newPriceId } = req.body;
  
  if (!newPriceId) {
    return res.status(400).json({ msg: 'ID do novo preço é obrigatório' });
  }
  
  const newPlan = mockPlans.find(plan => plan.priceId === newPriceId);
  
  if (!newPlan) {
    return res.status(404).json({ msg: 'Plano não encontrado' });
  }
  
  const updatedSubscription = {
    ...mockSubscription,
    plan: {
      id: newPlan.id,
      name: newPlan.name,
      description: newPlan.description,
      priceId: newPlan.priceId,
      amount: newPlan.amount,
      currency: newPlan.currency,
      interval: newPlan.interval,
      intervalCount: newPlan.intervalCount
    }
  };
  
  return res.status(200).json({
    msg: 'Assinatura atualizada com sucesso',
    subscription: updatedSubscription
  });
});

router.get('/portal-session', auth, (req, res) => {
  return res.status(200).json({
    url: 'https://billing.stripe.com/session/' + Math.random().toString(36).substring(2, 15)
  });
});

router.get('/invoices', auth, (req, res) => {
  return res.status(200).json(mockInvoices);
});

module.exports = router;
