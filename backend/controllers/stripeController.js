const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const db = admin.firestore();

// Obter todos os planos de assinatura disponíveis
exports.getPlans = async (req, res) => {
  try {
    // Buscar produtos ativos no Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    // Formatar dados para o frontend
    const plans = products.data.map(product => {
      const price = product.default_price;
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        priceId: price.id,
        amount: price.unit_amount / 100, // Converter de centavos para reais
        currency: price.currency,
        interval: price.recurring ? price.recurring.interval : null,
        intervalCount: price.recurring ? price.recurring.interval_count : null,
        trialPeriodDays: price.recurring ? price.recurring.trial_period_days : null,
        features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
        metadata: product.metadata
      };
    });

    return res.status(200).json(plans);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return res.status(500).json({ msg: 'Erro ao buscar planos de assinatura' });
  }
};

// Criar uma sessão de checkout para assinatura
exports.createCheckoutSession = async (req, res) => {
  try {
    const { priceId, clientId } = req.body;
    const userId = req.user.id;
    
    if (!priceId) {
      return res.status(400).json({ msg: 'ID do preço é obrigatório' });
    }

    // Buscar usuário no Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const user = userDoc.data();
    
    // Verificar se o usuário já tem um customerId no Stripe
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      // Criar cliente no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId,
          clientId: clientId || user.clientId
        }
      });
      
      customerId = customer.id;
      
      // Atualizar usuário com customerId
      await userRef.update({
        stripeCustomerId: customerId
      });
    }
    
    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`,
      metadata: {
        userId,
        clientId: clientId || user.clientId
      }
    });
    
    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    return res.status(500).json({ msg: 'Erro ao criar sessão de checkout' });
  }
};

// Webhook para eventos do Stripe
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // Importante: o body deve estar em formato raw
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Erro na assinatura do webhook:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  
  // Processar evento
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extrair dados da sessão
        const { userId, clientId } = session.metadata;
        const subscriptionId = session.subscription;
        
        // Buscar detalhes da assinatura
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Atualizar usuário com dados da assinatura
        const userRef = db.collection('users').doc(userId);
        
        await userRef.update({
          subscription: {
            id: subscriptionId,
            status: subscription.status,
            priceId: subscription.items.data[0].price.id,
            productId: subscription.items.data[0].price.product,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualizar cliente se necessário
        if (clientId) {
          const clientRef = db.collection('clients').doc(clientId);
          const clientDoc = await clientRef.get();
          
          if (clientDoc.exists) {
            await clientRef.update({
              subscriptionStatus: subscription.status,
              subscriptionId: subscriptionId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Buscar usuário pelo customerId
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const userId = userDoc.id;
          
          // Atualizar dados da assinatura
          await userDoc.ref.update({
            subscription: {
              id: subscription.id,
              status: subscription.status,
              priceId: subscription.items.data[0].price.id,
              productId: subscription.items.data[0].price.product,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Atualizar cliente se necessário
          const clientId = userDoc.data().clientId;
          
          if (clientId) {
            const clientRef = db.collection('clients').doc(clientId);
            const clientDoc = await clientRef.get();
            
            if (clientDoc.exists) {
              await clientRef.update({
                subscriptionStatus: subscription.status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Buscar usuário pelo customerId
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const userId = userDoc.id;
          
          // Atualizar dados da assinatura
          await userDoc.ref.update({
            'subscription.status': 'canceled',
            'subscription.cancelAtPeriodEnd': true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Atualizar cliente se necessário
          const clientId = userDoc.data().clientId;
          
          if (clientId) {
            const clientRef = db.collection('clients').doc(clientId);
            const clientDoc = await clientRef.get();
            
            if (clientDoc.exists) {
              await clientRef.update({
                subscriptionStatus: 'canceled',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        }
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        
        // Buscar usuário pelo customerId
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const userId = userDoc.id;
          
          // Salvar fatura no Firestore
          await db.collection('invoices').add({
            userId,
            invoiceId: invoice.id,
            subscriptionId,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: invoice.status,
            paidAt: new Date(invoice.status_transitions.paid_at * 1000),
            periodStart: new Date(invoice.period_start * 1000),
            periodEnd: new Date(invoice.period_end * 1000),
            invoiceUrl: invoice.hosted_invoice_url,
            pdfUrl: invoice.invoice_pdf,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        // Buscar usuário pelo customerId
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const userId = userDoc.id;
          
          // Notificar usuário sobre falha no pagamento
          // Implementar lógica de notificação aqui
        }
        
        break;
      }
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ msg: 'Erro ao processar webhook' });
  }
};

// Obter detalhes da assinatura do usuário
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar usuário no Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const user = userDoc.data();
    
    // Verificar se o usuário tem uma assinatura
    if (!user.subscription || !user.subscription.id) {
      return res.status(200).json({ 
        hasSubscription: false,
        subscription: null
      });
    }
    
    // Buscar detalhes atualizados da assinatura no Stripe
    const subscriptionId = user.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    });
    
    // Formatar dados para o frontend
    const formattedSubscription = {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan: {
        id: subscription.items.data[0].price.product.id,
        name: subscription.items.data[0].price.product.name,
        description: subscription.items.data[0].price.product.description,
        priceId: subscription.items.data[0].price.id,
        amount: subscription.items.data[0].price.unit_amount / 100,
        currency: subscription.items.data[0].price.currency,
        interval: subscription.items.data[0].price.recurring.interval,
        intervalCount: subscription.items.data[0].price.recurring.interval_count
      }
    };
    
    return res.status(200).json({
      hasSubscription: true,
      subscription: formattedSubscription
    });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return res.status(500).json({ msg: 'Erro ao buscar detalhes da assinatura' });
  }
};

// Cancelar assinatura
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar usuário no Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const user = userDoc.data();
    
    // Verificar se o usuário tem uma assinatura
    if (!user.subscription || !user.subscription.id) {
      return res.status(400).json({ msg: 'Usuário não possui assinatura ativa' });
    }
    
    // Cancelar assinatura no Stripe (ao final do período atual)
    const subscriptionId = user.subscription.id;
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    // Atualizar dados no Firestore
    await userRef.update({
      'subscription.cancelAtPeriodEnd': true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({
      msg: 'Assinatura cancelada com sucesso',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return res.status(500).json({ msg: 'Erro ao cancelar assinatura' });
  }
};

// Atualizar assinatura (mudar de plano)
exports.updateSubscription = async (req, res) => {
  try {
    const { newPriceId } = req.body;
    const userId = req.user.id;
    
    if (!newPriceId) {
      return res.status(400).json({ msg: 'ID do novo preço é obrigatório' });
    }
    
    // Buscar usuário no Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const user = userDoc.data();
    
    // Verificar se o usuário tem uma assinatura
    if (!user.subscription || !user.subscription.id) {
      return res.status(400).json({ msg: 'Usuário não possui assinatura ativa' });
    }
    
    // Atualizar assinatura no Stripe
    const subscriptionId = user.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Identificar o item da assinatura a ser atualizado
    const itemId = subscription.items.data[0].id;
    
    // Atualizar assinatura com o novo plano
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: itemId,
        price: newPriceId
      }],
      proration_behavior: 'create_prorations'
    });
    
    // Buscar detalhes do novo plano
    const price = await stripe.prices.retrieve(newPriceId, {
      expand: ['product']
    });
    
    // Atualizar dados no Firestore
    await userRef.update({
      'subscription.priceId': newPriceId,
      'subscription.productId': price.product.id,
      'subscription.status': updatedSubscription.status,
      'subscription.currentPeriodStart': new Date(updatedSubscription.current_period_start * 1000),
      'subscription.currentPeriodEnd': new Date(updatedSubscription.current_period_end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({
      msg: 'Assinatura atualizada com sucesso',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        plan: {
          id: price.product.id,
          name: price.product.name,
          priceId: price.id,
          amount: price.unit_amount / 100,
          currency: price.currency,
          interval: price.recurring.interval
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    return res.status(500).json({ msg: 'Erro ao atualizar assinatura' });
  }
};

// Criar uma sessão do portal de clientes do Stripe
exports.createPortalSession = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar usuário no Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const user = userDoc.data();
    
    // Verificar se o usuário tem um customerId no Stripe
    if (!user.stripeCustomerId) {
      return res.status(400).json({ msg: 'Usuário não possui conta no Stripe' });
    }
    
    // Criar sessão do portal
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`
    });
    
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error);
    return res.status(500).json({ msg: 'Erro ao criar sessão do portal de clientes' });
  }
};

// Obter faturas do usuário
exports.getInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    
    // Buscar usuário no Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const user = userDoc.data();
    
    // Verificar se o usuário tem um customerId no Stripe
    if (!user.stripeCustomerId) {
      return res.status(200).json({
        invoices: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      });
    }
    
    // Buscar faturas no Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit,
      starting_after: page > 1 ? req.query.lastInvoiceId : undefined
    });
    
    // Formatar dados para o frontend
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf
    }));
    
    // Contar total de faturas
    const invoiceCount = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 1
    });
    
    const totalInvoices = invoiceCount.has_more ? 100 : invoiceCount.data.length; // Aproximação, pois o Stripe não fornece contagem total
    const totalPages = Math.ceil(totalInvoices / limit);
    
    return res.status(200).json({
      invoices: formattedInvoices,
      pagination: {
        total: totalInvoices,
        page,
        limit,
        totalPages,
        lastInvoiceId: formattedInvoices.length > 0 ? formattedInvoices[formattedInvoices.length - 1].id : null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    return res.status(500).json({ msg: 'Erro ao buscar faturas' });
  }
};
