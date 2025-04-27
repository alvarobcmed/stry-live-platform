const admin = require('firebase-admin');
const db = admin.firestore();

// Obter visão geral das métricas
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    const adminLevel = req.user.adminLevel;
    
    // Determinar o escopo das métricas com base no nível de admin
    let scope = { userId };
    
    if (adminLevel === 'client') {
      scope = { clientId };
    } else if (adminLevel === 'master') {
      scope = {}; // Sem filtro para admin master (todos os dados)
    }
    
    // Período de tempo (padrão: últimos 30 dias)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar métricas de stories
    const storiesQuery = db.collection('stories');
    let storiesSnapshot;
    
    if (scope.userId) {
      storiesSnapshot = await storiesQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      storiesSnapshot = await storiesQuery.where('clientId', '==', scope.clientId).get();
    } else {
      storiesSnapshot = await storiesQuery.get();
    }
    
    const totalStories = storiesSnapshot.size;
    
    // Buscar métricas de lives
    const livesQuery = db.collection('lives');
    let livesSnapshot;
    
    if (scope.userId) {
      livesSnapshot = await livesQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      livesSnapshot = await livesQuery.where('clientId', '==', scope.clientId).get();
    } else {
      livesSnapshot = await livesQuery.get();
    }
    
    const totalLives = livesSnapshot.size;
    
    // Buscar eventos de visualização
    const viewsQuery = db.collection('events')
      .where('type', '==', 'view')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    let viewsSnapshot;
    
    if (scope.userId) {
      viewsSnapshot = await viewsQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      viewsSnapshot = await viewsQuery.where('clientId', '==', scope.clientId).get();
    } else {
      viewsSnapshot = await viewsQuery.get();
    }
    
    const totalViews = viewsSnapshot.size;
    
    // Buscar eventos de clique
    const clicksQuery = db.collection('events')
      .where('type', '==', 'click')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    let clicksSnapshot;
    
    if (scope.userId) {
      clicksSnapshot = await clicksQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      clicksSnapshot = await clicksQuery.where('clientId', '==', scope.clientId).get();
    } else {
      clicksSnapshot = await clicksQuery.get();
    }
    
    const totalClicks = clicksSnapshot.size;
    
    // Calcular taxa de conversão (cliques / visualizações)
    const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    
    // Buscar usuários únicos
    const uniqueUsers = new Set();
    
    viewsSnapshot.forEach(doc => {
      const visitorId = doc.data().visitorId;
      if (visitorId) {
        uniqueUsers.add(visitorId);
      }
    });
    
    const totalUniqueUsers = uniqueUsers.size;
    
    // Calcular visualizações por usuário
    const viewsPerUser = totalUniqueUsers > 0 ? totalViews / totalUniqueUsers : 0;
    
    // Calcular tendências (comparação com período anterior)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    const previousViewsQuery = db.collection('events')
      .where('type', '==', 'view')
      .where('timestamp', '>=', previousStartDate)
      .where('timestamp', '<', startDate);
    
    let previousViewsSnapshot;
    
    if (scope.userId) {
      previousViewsSnapshot = await previousViewsQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      previousViewsSnapshot = await previousViewsQuery.where('clientId', '==', scope.clientId).get();
    } else {
      previousViewsSnapshot = await previousViewsQuery.get();
    }
    
    const previousTotalViews = previousViewsSnapshot.size;
    const viewsTrend = previousTotalViews > 0 ? ((totalViews - previousTotalViews) / previousTotalViews) * 100 : 0;
    
    // Retornar visão geral das métricas
    return res.status(200).json({
      period: {
        days,
        startDate,
        endDate
      },
      overview: {
        totalStories,
        totalLives,
        totalViews,
        totalClicks,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        uniqueUsers: totalUniqueUsers,
        viewsPerUser: parseFloat(viewsPerUser.toFixed(2)),
        viewsTrend: parseFloat(viewsTrend.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar visão geral das métricas:', error);
    return res.status(500).json({ msg: 'Erro ao buscar visão geral das métricas' });
  }
};

// Obter métricas de stories
exports.getStoriesMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    const adminLevel = req.user.adminLevel;
    
    // Determinar o escopo das métricas com base no nível de admin
    let scope = { userId };
    
    if (adminLevel === 'client') {
      scope = { clientId };
    } else if (adminLevel === 'master') {
      scope = {}; // Sem filtro para admin master (todos os dados)
    }
    
    // Período de tempo (padrão: últimos 30 dias)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar stories
    const storiesQuery = db.collection('stories');
    let storiesSnapshot;
    
    if (scope.userId) {
      storiesSnapshot = await storiesQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      storiesSnapshot = await storiesQuery.where('clientId', '==', scope.clientId).get();
    } else {
      storiesSnapshot = await storiesQuery.get();
    }
    
    // Mapear IDs de stories
    const storyIds = [];
    const stories = [];
    
    storiesSnapshot.forEach(doc => {
      storyIds.push(doc.id);
      stories.push({
        id: doc.id,
        title: doc.data().title,
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
        views: 0,
        clicks: 0,
        completionRate: 0,
        avgWatchTime: 0
      });
    });
    
    // Buscar eventos de visualização para cada story
    const viewsPromises = storyIds.map(storyId => {
      return db.collection('events')
        .where('type', '==', 'view')
        .where('storyId', '==', storyId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();
    });
    
    const viewsResults = await Promise.all(viewsPromises);
    
    // Buscar eventos de clique para cada story
    const clicksPromises = storyIds.map(storyId => {
      return db.collection('events')
        .where('type', '==', 'click')
        .where('storyId', '==', storyId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();
    });
    
    const clicksResults = await Promise.all(clicksPromises);
    
    // Buscar eventos de conclusão para cada story
    const completionPromises = storyIds.map(storyId => {
      return db.collection('events')
        .where('type', '==', 'completion')
        .where('storyId', '==', storyId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();
    });
    
    const completionResults = await Promise.all(completionPromises);
    
    // Calcular métricas para cada story
    for (let i = 0; i < stories.length; i++) {
      const views = viewsResults[i].size;
      const clicks = clicksResults[i].size;
      const completions = completionResults[i].size;
      
      stories[i].views = views;
      stories[i].clicks = clicks;
      stories[i].completionRate = views > 0 ? (completions / views) * 100 : 0;
      
      // Calcular tempo médio de visualização
      let totalWatchTime = 0;
      
      viewsResults[i].forEach(doc => {
        const watchTime = doc.data().watchTime || 0;
        totalWatchTime += watchTime;
      });
      
      stories[i].avgWatchTime = views > 0 ? totalWatchTime / views : 0;
    }
    
    // Ordenar stories por visualizações (do maior para o menor)
    stories.sort((a, b) => b.views - a.views);
    
    return res.status(200).json({
      period: {
        days,
        startDate,
        endDate
      },
      stories
    });
  } catch (error) {
    console.error('Erro ao buscar métricas de stories:', error);
    return res.status(500).json({ msg: 'Erro ao buscar métricas de stories' });
  }
};

// Obter métricas de um story específico
exports.getStoryMetrics = async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;
    const clientId = req.user.clientId;
    const adminLevel = req.user.adminLevel;
    
    // Buscar story
    const storyRef = db.collection('stories').doc(storyId);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ msg: 'Story não encontrado' });
    }
    
    const story = storyDoc.data();
    
    // Verificar permissão
    if (adminLevel !== 'master' && 
        story.userId !== userId && 
        story.clientId !== clientId) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Período de tempo (padrão: últimos 30 dias)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar eventos de visualização
    const viewsSnapshot = await db.collection('events')
      .where('type', '==', 'view')
      .where('storyId', '==', storyId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();
    
    const totalViews = viewsSnapshot.size;
    
    // Buscar eventos de clique
    const clicksSnapshot = await db.collection('events')
      .where('type', '==', 'click')
      .where('storyId', '==', storyId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();
    
    const totalClicks = clicksSnapshot.size;
    
    // Buscar eventos de conclusão
    const completionSnapshot = await db.collection('events')
      .where('type', '==', 'completion')
      .where('storyId', '==', storyId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();
    
    const totalCompletions = completionSnapshot.size;
    
    // Calcular taxa de conclusão
    const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;
    
    // Calcular taxa de cliques
    const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    
    // Calcular tempo médio de visualização
    let totalWatchTime = 0;
    
    viewsSnapshot.forEach(doc => {
      const watchTime = doc.data().watchTime || 0;
      totalWatchTime += watchTime;
    });
    
    const avgWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;
    
    // Buscar usuários únicos
    const uniqueUsers = new Set();
    
    viewsSnapshot.forEach(doc => {
      const visitorId = doc.data().visitorId;
      if (visitorId) {
        uniqueUsers.add(visitorId);
      }
    });
    
    const totalUniqueUsers = uniqueUsers.size;
    
    // Calcular visualizações por usuário
    const viewsPerUser = totalUniqueUsers > 0 ? totalViews / totalUniqueUsers : 0;
    
    // Calcular tendências (comparação com período anterior)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    const previousViewsSnapshot = await db.collection('events')
      .where('type', '==', 'view')
      .where('storyId', '==', storyId)
      .where('timestamp', '>=', previousStartDate)
      .where('timestamp', '<', startDate)
      .get();
    
    const previousTotalViews = previousViewsSnapshot.size;
    const viewsTrend = previousTotalViews > 0 ? ((totalViews - previousTotalViews) / previousTotalViews) * 100 : 0;
    
    // Agrupar visualizações por dia
    const viewsByDay = {};
    
    viewsSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp.toDate();
      const day = timestamp.toISOString().split('T')[0];
      
      if (!viewsByDay[day]) {
        viewsByDay[day] = 0;
      }
      
      viewsByDay[day]++;
    });
    
    // Formatar dados para gráfico
    const dailyViews = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().split('T')[0];
      dailyViews.push({
        date: day,
        views: viewsByDay[day] || 0
      });
    }
    
    // Retornar métricas detalhadas
    return res.status(200).json({
      period: {
        days,
        startDate,
        endDate
      },
      story: {
        id: storyId,
        title: story.title,
        createdAt: story.createdAt ? story.createdAt.toDate() : null
      },
      metrics: {
        totalViews,
        totalClicks,
        totalCompletions,
        completionRate: parseFloat(completionRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
        avgWatchTime: parseFloat(avgWatchTime.toFixed(2)),
        uniqueUsers: totalUniqueUsers,
        viewsPerUser: parseFloat(viewsPerUser.toFixed(2)),
        viewsTrend: parseFloat(viewsTrend.toFixed(2))
      },
      dailyViews
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do story:', error);
    return res.status(500).json({ msg: 'Erro ao buscar métricas do story' });
  }
};

// Obter métricas de lives
exports.getLivesMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    const adminLevel = req.user.adminLevel;
    
    // Determinar o escopo das métricas com base no nível de admin
    let scope = { userId };
    
    if (adminLevel === 'client') {
      scope = { clientId };
    } else if (adminLevel === 'master') {
      scope = {}; // Sem filtro para admin master (todos os dados)
    }
    
    // Período de tempo (padrão: últimos 30 dias)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar lives
    const livesQuery = db.collection('lives');
    let livesSnapshot;
    
    if (scope.userId) {
      livesSnapshot = await livesQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      livesSnapshot = await livesQuery.where('clientId', '==', scope.clientId).get();
    } else {
      livesSnapshot = await livesQuery.get();
    }
    
    // Mapear IDs de lives
    const liveIds = [];
    const lives = [];
    
    livesSnapshot.forEach(doc => {
      liveIds.push(doc.id);
      lives.push({
        id: doc.id,
        title: doc.data().title,
        startTime: doc.data().startTime ? doc.data().startTime.toDate() : null,
        endTime: doc.data().endTime ? doc.data().endTime.toDate() : null,
        duration: doc.data().duration || 0,
        views: 0,
        peakViewers: 0,
        avgViewers: 0,
        totalEngagements: 0
      });
    });
    
    // Buscar eventos de visualização para cada live
    const viewsPromises = liveIds.map(liveId => {
      return db.collection('events')
        .where('type', '==', 'live_view')
        .where('liveId', '==', liveId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();
    });
    
    const viewsResults = await Promise.all(viewsPromises);
    
    // Buscar eventos de engajamento para cada live
    const engagementPromises = liveIds.map(liveId => {
      return db.collection('events')
        .where('type', 'in', ['live_comment', 'live_like', 'live_share'])
        .where('liveId', '==', liveId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();
    });
    
    const engagementResults = await Promise.all(engagementPromises);
    
    // Calcular métricas para cada live
    for (let i = 0; i < lives.length; i++) {
      const views = viewsResults[i].size;
      const engagements = engagementResults[i].size;
      
      lives[i].views = views;
      lives[i].totalEngagements = engagements;
      
      // Calcular pico de espectadores e média
      const viewersByMinute = {};
      let peakViewers = 0;
      
      viewsResults[i].forEach(doc => {
        const timestamp = doc.data().timestamp.toDate();
        const minute = Math.floor(timestamp.getTime() / 60000);
        
        if (!viewersByMinute[minute]) {
          viewersByMinute[minute] = 0;
        }
        
        viewersByMinute[minute]++;
        
        if (viewersByMinute[minute] > peakViewers) {
          peakViewers = viewersByMinute[minute];
        }
      });
      
      lives[i].peakViewers = peakViewers;
      
      // Calcular média de espectadores
      const totalMinutes = Object.keys(viewersByMinute).length;
      const totalViewers = Object.values(viewersByMinute).reduce((sum, viewers) => sum + viewers, 0);
      
      lives[i].avgViewers = totalMinutes > 0 ? totalViewers / totalMinutes : 0;
    }
    
    // Ordenar lives por visualizações (do maior para o menor)
    lives.sort((a, b) => b.views - a.views);
    
    return res.status(200).json({
      period: {
        days,
        startDate,
        endDate
      },
      lives
    });
  } catch (error) {
    console.error('Erro ao buscar métricas de lives:', error);
    return res.status(500).json({ msg: 'Erro ao buscar métricas de lives' });
  }
};

// Obter métricas de uma live específica
exports.getLiveMetrics = async (req, res) => {
  try {
    const liveId = req.params.id;
    const userId = req.user.id;
    const clientId = req.user.clientId;
    const adminLevel = req.user.adminLevel;
    
    // Buscar live
    const liveRef = db.collection('lives').doc(liveId);
    const liveDoc = await liveRef.get();
    
    if (!liveDoc.exists) {
      return res.status(404).json({ msg: 'Live não encontrada' });
    }
    
    const live = liveDoc.data();
    
    // Verificar permissão
    if (adminLevel !== 'master' && 
        live.userId !== userId && 
        live.clientId !== clientId) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Buscar eventos de visualização
    const viewsSnapshot = await db.collection('events')
      .where('type', '==', 'live_view')
      .where('liveId', '==', liveId)
      .get();
    
    const totalViews = viewsSnapshot.size;
    
    // Buscar eventos de comentário
    const commentsSnapshot = await db.collection('events')
      .where('type', '==', 'live_comment')
      .where('liveId', '==', liveId)
      .get();
    
    const totalComments = commentsSnapshot.size;
    
    // Buscar eventos de like
    const likesSnapshot = await db.collection('events')
      .where('type', '==', 'live_like')
      .where('liveId', '==', liveId)
      .get();
    
    const totalLikes = likesSnapshot.size;
    
    // Buscar eventos de compartilhamento
    const sharesSnapshot = await db.collection('events')
      .where('type', '==', 'live_share')
      .where('liveId', '==', liveId)
      .get();
    
    const totalShares = sharesSnapshot.size;
    
    // Calcular total de engajamentos
    const totalEngagements = totalComments + totalLikes + totalShares;
    
    // Calcular taxa de engajamento
    const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
    
    // Calcular pico de espectadores e média
    const viewersByMinute = {};
    let peakViewers = 0;
    let peakViewersTime = null;
    
    viewsSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp.toDate();
      const minute = Math.floor(timestamp.getTime() / 60000);
      
      if (!viewersByMinute[minute]) {
        viewersByMinute[minute] = {
          count: 0,
          timestamp
        };
      }
      
      viewersByMinute[minute].count++;
      
      if (viewersByMinute[minute].count > peakViewers) {
        peakViewers = viewersByMinute[minute].count;
        peakViewersTime = viewersByMinute[minute].timestamp;
      }
    });
    
    // Calcular média de espectadores
    const totalMinutes = Object.keys(viewersByMinute).length;
    const totalViewerCounts = Object.values(viewersByMinute).reduce((sum, data) => sum + data.count, 0);
    
    const avgViewers = totalMinutes > 0 ? totalViewerCounts / totalMinutes : 0;
    
    // Formatar dados para gráfico de espectadores ao longo do tempo
    const viewersOverTime = [];
    
    if (live.startTime && live.endTime) {
      const startTime = live.startTime.toDate();
      const endTime = live.endTime.toDate();
      
      for (let t = new Date(startTime); t <= endTime; t.setMinutes(t.getMinutes() + 1)) {
        const minute = Math.floor(t.getTime() / 60000);
        viewersOverTime.push({
          time: new Date(t),
          viewers: viewersByMinute[minute] ? viewersByMinute[minute].count : 0
        });
      }
    }
    
    // Buscar usuários únicos
    const uniqueUsers = new Set();
    
    viewsSnapshot.forEach(doc => {
      const visitorId = doc.data().visitorId;
      if (visitorId) {
        uniqueUsers.add(visitorId);
      }
    });
    
    const totalUniqueUsers = uniqueUsers.size;
    
    // Retornar métricas detalhadas
    return res.status(200).json({
      live: {
        id: liveId,
        title: live.title,
        startTime: live.startTime ? live.startTime.toDate() : null,
        endTime: live.endTime ? live.endTime.toDate() : null,
        duration: live.duration || 0
      },
      metrics: {
        totalViews,
        uniqueUsers: totalUniqueUsers,
        peakViewers,
        peakViewersTime,
        avgViewers: parseFloat(avgViewers.toFixed(2)),
        totalComments,
        totalLikes,
        totalShares,
        totalEngagements,
        engagementRate: parseFloat(engagementRate.toFixed(2))
      },
      viewersOverTime
    });
  } catch (error) {
    console.error('Erro ao buscar métricas da live:', error);
    return res.status(500).json({ msg: 'Erro ao buscar métricas da live' });
  }
};

// Obter métricas de usuários
exports.getUsersMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    const adminLevel = req.user.adminLevel;
    
    // Verificar permissão (apenas Admin Cliente ou superior)
    if (adminLevel !== 'client' && adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Determinar o escopo das métricas com base no nível de admin
    let scope = { clientId };
    
    if (adminLevel === 'master') {
      scope = {}; // Sem filtro para admin master (todos os dados)
    }
    
    // Período de tempo (padrão: últimos 30 dias)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar eventos de visualização
    const viewsQuery = db.collection('events')
      .where('type', '==', 'view')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    let viewsSnapshot;
    
    if (scope.clientId) {
      viewsSnapshot = await viewsQuery.where('clientId', '==', scope.clientId).get();
    } else {
      viewsSnapshot = await viewsQuery.get();
    }
    
    // Agrupar visualizações por dia
    const viewsByDay = {};
    const uniqueUsersByDay = {};
    
    viewsSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp.toDate();
      const day = timestamp.toISOString().split('T')[0];
      const visitorId = doc.data().visitorId;
      
      if (!viewsByDay[day]) {
        viewsByDay[day] = 0;
        uniqueUsersByDay[day] = new Set();
      }
      
      viewsByDay[day]++;
      
      if (visitorId) {
        uniqueUsersByDay[day].add(visitorId);
      }
    });
    
    // Formatar dados para gráfico
    const dailyMetrics = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().split('T')[0];
      dailyMetrics.push({
        date: day,
        views: viewsByDay[day] || 0,
        uniqueUsers: uniqueUsersByDay[day] ? uniqueUsersByDay[day].size : 0
      });
    }
    
    // Calcular métricas de dispositivos
    const deviceTypes = {};
    
    viewsSnapshot.forEach(doc => {
      const deviceType = doc.data().deviceType || 'unknown';
      
      if (!deviceTypes[deviceType]) {
        deviceTypes[deviceType] = 0;
      }
      
      deviceTypes[deviceType]++;
    });
    
    // Formatar dados de dispositivos para gráfico
    const deviceMetrics = Object.entries(deviceTypes).map(([type, count]) => ({
      type,
      count
    }));
    
    // Ordenar por contagem (do maior para o menor)
    deviceMetrics.sort((a, b) => b.count - a.count);
    
    // Calcular métricas de localização
    const locations = {};
    
    viewsSnapshot.forEach(doc => {
      const location = doc.data().location || 'unknown';
      
      if (!locations[location]) {
        locations[location] = 0;
      }
      
      locations[location]++;
    });
    
    // Formatar dados de localização para gráfico
    const locationMetrics = Object.entries(locations).map(([location, count]) => ({
      location,
      count
    }));
    
    // Ordenar por contagem (do maior para o menor)
    locationMetrics.sort((a, b) => b.count - a.count);
    
    // Calcular métricas de retenção
    const retentionData = {};
    const visitorSessions = {};
    
    viewsSnapshot.forEach(doc => {
      const visitorId = doc.data().visitorId;
      
      if (!visitorId) return;
      
      if (!visitorSessions[visitorId]) {
        visitorSessions[visitorId] = [];
      }
      
      visitorSessions[visitorId].push(doc.data().timestamp.toDate());
    });
    
    // Calcular número de sessões por visitante
    Object.values(visitorSessions).forEach(sessions => {
      // Ordenar sessões por timestamp
      sessions.sort((a, b) => a - b);
      
      // Agrupar sessões (considerar sessões com menos de 30 minutos de diferença como uma única sessão)
      const groupedSessions = [];
      let currentSession = [sessions[0]];
      
      for (let i = 1; i < sessions.length; i++) {
        const prevTime = currentSession[currentSession.length - 1];
        const currTime = sessions[i];
        
        // Se a diferença for menor que 30 minutos, adicionar à sessão atual
        if ((currTime - prevTime) < 30 * 60 * 1000) {
          currentSession.push(currTime);
        } else {
          groupedSessions.push(currentSession);
          currentSession = [currTime];
        }
      }
      
      groupedSessions.push(currentSession);
      
      const sessionCount = groupedSessions.length;
      
      if (!retentionData[sessionCount]) {
        retentionData[sessionCount] = 0;
      }
      
      retentionData[sessionCount]++;
    });
    
    // Formatar dados de retenção para gráfico
    const retentionMetrics = Object.entries(retentionData).map(([sessions, users]) => ({
      sessions: parseInt(sessions),
      users
    }));
    
    // Ordenar por número de sessões
    retentionMetrics.sort((a, b) => a.sessions - b.sessions);
    
    return res.status(200).json({
      period: {
        days,
        startDate,
        endDate
      },
      dailyMetrics,
      deviceMetrics,
      locationMetrics,
      retentionMetrics
    });
  } catch (error) {
    console.error('Erro ao buscar métricas de usuários:', error);
    return res.status(500).json({ msg: 'Erro ao buscar métricas de usuários' });
  }
};

// Obter métricas de engajamento
exports.getEngagementMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    const adminLevel = req.user.adminLevel;
    
    // Determinar o escopo das métricas com base no nível de admin
    let scope = { userId };
    
    if (adminLevel === 'client') {
      scope = { clientId };
    } else if (adminLevel === 'master') {
      scope = {}; // Sem filtro para admin master (todos os dados)
    }
    
    // Período de tempo (padrão: últimos 30 dias)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar eventos de visualização
    const viewsQuery = db.collection('events')
      .where('type', '==', 'view')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    let viewsSnapshot;
    
    if (scope.userId) {
      viewsSnapshot = await viewsQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      viewsSnapshot = await viewsQuery.where('clientId', '==', scope.clientId).get();
    } else {
      viewsSnapshot = await viewsQuery.get();
    }
    
    const totalViews = viewsSnapshot.size;
    
    // Buscar eventos de clique
    const clicksQuery = db.collection('events')
      .where('type', '==', 'click')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    let clicksSnapshot;
    
    if (scope.userId) {
      clicksSnapshot = await clicksQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      clicksSnapshot = await clicksQuery.where('clientId', '==', scope.clientId).get();
    } else {
      clicksSnapshot = await clicksQuery.get();
    }
    
    const totalClicks = clicksSnapshot.size;
    
    // Buscar eventos de conclusão
    const completionQuery = db.collection('events')
      .where('type', '==', 'completion')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    let completionSnapshot;
    
    if (scope.userId) {
      completionSnapshot = await completionQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      completionSnapshot = await completionQuery.where('clientId', '==', scope.clientId).get();
    } else {
      completionSnapshot = await completionQuery.get();
    }
    
    const totalCompletions = completionSnapshot.size;
    
    // Buscar eventos de like
    const likesQuery = db.collection('events')
      .where('type', '==', 'like')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    let likesSnapshot;
    
    if (scope.userId) {
      likesSnapshot = await likesQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      likesSnapshot = await likesQuery.where('clientId', '==', scope.clientId).get();
    } else {
      likesSnapshot = await likesQuery.get();
    }
    
    const totalLikes = likesSnapshot.size;
    
    // Buscar eventos de compartilhamento
    const sharesQuery = db.collection('events')
      .where('type', '==', 'share')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    let sharesSnapshot;
    
    if (scope.userId) {
      sharesSnapshot = await sharesQuery.where('userId', '==', scope.userId).get();
    } else if (scope.clientId) {
      sharesSnapshot = await sharesQuery.where('clientId', '==', scope.clientId).get();
    } else {
      sharesSnapshot = await sharesQuery.get();
    }
    
    const totalShares = sharesSnapshot.size;
    
    // Calcular taxas de engajamento
    const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;
    const likeRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
    const shareRate = totalViews > 0 ? (totalShares / totalViews) * 100 : 0;
    
    // Calcular tempo médio de visualização
    let totalWatchTime = 0;
    
    viewsSnapshot.forEach(doc => {
      const watchTime = doc.data().watchTime || 0;
      totalWatchTime += watchTime;
    });
    
    const avgWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;
    
    // Agrupar engajamentos por dia
    const engagementsByDay = {};
    
    // Inicializar estrutura
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().split('T')[0];
      engagementsByDay[day] = {
        views: 0,
        clicks: 0,
        completions: 0,
        likes: 0,
        shares: 0
      };
    }
    
    // Preencher visualizações
    viewsSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp.toDate();
      const day = timestamp.toISOString().split('T')[0];
      
      if (engagementsByDay[day]) {
        engagementsByDay[day].views++;
      }
    });
    
    // Preencher cliques
    clicksSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp.toDate();
      const day = timestamp.toISOString().split('T')[0];
      
      if (engagementsByDay[day]) {
        engagementsByDay[day].clicks++;
      }
    });
    
    // Preencher conclusões
    completionSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp.toDate();
      const day = timestamp.toISOString().split('T')[0];
      
      if (engagementsByDay[day]) {
        engagementsByDay[day].completions++;
      }
    });
    
    // Preencher likes
    likesSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp.toDate();
      const day = timestamp.toISOString().split('T')[0];
      
      if (engagementsByDay[day]) {
        engagementsByDay[day].likes++;
      }
    });
    
    // Preencher compartilhamentos
    sharesSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp.toDate();
      const day = timestamp.toISOString().split('T')[0];
      
      if (engagementsByDay[day]) {
        engagementsByDay[day].shares++;
      }
    });
    
    // Formatar dados para gráfico
    const dailyEngagements = Object.entries(engagementsByDay).map(([date, data]) => ({
      date,
      ...data
    }));
    
    // Ordenar por data
    dailyEngagements.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return res.status(200).json({
      period: {
        days,
        startDate,
        endDate
      },
      metrics: {
        totalViews,
        totalClicks,
        totalCompletions,
        totalLikes,
        totalShares,
        clickRate: parseFloat(clickRate.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(2)),
        likeRate: parseFloat(likeRate.toFixed(2)),
        shareRate: parseFloat(shareRate.toFixed(2)),
        avgWatchTime: parseFloat(avgWatchTime.toFixed(2))
      },
      dailyEngagements
    });
  } catch (error) {
    console.error('Erro ao buscar métricas de engajamento:', error);
    return res.status(500).json({ msg: 'Erro ao buscar métricas de engajamento' });
  }
};

// Exportar dados de analytics
exports.exportAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    const adminLevel = req.user.adminLevel;
    
    // Verificar permissão (apenas Admin Cliente ou superior)
    if (adminLevel !== 'client' && adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Determinar o escopo das métricas com base no nível de admin
    let scope = { clientId };
    
    if (adminLevel === 'master') {
      scope = {}; // Sem filtro para admin master (todos os dados)
    }
    
    // Período de tempo (padrão: últimos 30 dias)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Tipo de exportação
    const exportType = req.query.type || 'events';
    
    let data = [];
    
    if (exportType === 'events') {
      // Buscar todos os eventos
      const eventsQuery = db.collection('events')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
      
      let eventsSnapshot;
      
      if (scope.clientId) {
        eventsSnapshot = await eventsQuery.where('clientId', '==', scope.clientId).get();
      } else {
        eventsSnapshot = await eventsQuery.get();
      }
      
      // Formatar dados para exportação
      eventsSnapshot.forEach(doc => {
        const event = doc.data();
        data.push({
          id: doc.id,
          type: event.type,
          storyId: event.storyId || null,
          liveId: event.liveId || null,
          userId: event.userId || null,
          clientId: event.clientId || null,
          visitorId: event.visitorId || null,
          deviceType: event.deviceType || null,
          location: event.location || null,
          watchTime: event.watchTime || null,
          timestamp: event.timestamp ? event.timestamp.toDate() : null
        });
      });
    } else if (exportType === 'stories') {
      // Buscar métricas de stories
      const storiesQuery = db.collection('stories');
      let storiesSnapshot;
      
      if (scope.clientId) {
        storiesSnapshot = await storiesQuery.where('clientId', '==', scope.clientId).get();
      } else {
        storiesSnapshot = await storiesQuery.get();
      }
      
      // Mapear IDs de stories
      const stories = [];
      
      storiesSnapshot.forEach(doc => {
        const story = doc.data();
        stories.push({
          id: doc.id,
          title: story.title,
          userId: story.userId,
          clientId: story.clientId,
          createdAt: story.createdAt ? story.createdAt.toDate() : null,
          views: 0,
          clicks: 0,
          completions: 0
        });
      });
      
      // Buscar eventos para cada story
      for (const story of stories) {
        // Visualizações
        const viewsSnapshot = await db.collection('events')
          .where('type', '==', 'view')
          .where('storyId', '==', story.id)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        story.views = viewsSnapshot.size;
        
        // Cliques
        const clicksSnapshot = await db.collection('events')
          .where('type', '==', 'click')
          .where('storyId', '==', story.id)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        story.clicks = clicksSnapshot.size;
        
        // Conclusões
        const completionsSnapshot = await db.collection('events')
          .where('type', '==', 'completion')
          .where('storyId', '==', story.id)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        story.completions = completionsSnapshot.size;
      }
      
      data = stories;
    } else if (exportType === 'lives') {
      // Buscar métricas de lives
      const livesQuery = db.collection('lives');
      let livesSnapshot;
      
      if (scope.clientId) {
        livesSnapshot = await livesQuery.where('clientId', '==', scope.clientId).get();
      } else {
        livesSnapshot = await livesQuery.get();
      }
      
      // Mapear IDs de lives
      const lives = [];
      
      livesSnapshot.forEach(doc => {
        const live = doc.data();
        lives.push({
          id: doc.id,
          title: live.title,
          userId: live.userId,
          clientId: live.clientId,
          startTime: live.startTime ? live.startTime.toDate() : null,
          endTime: live.endTime ? live.endTime.toDate() : null,
          duration: live.duration || 0,
          views: 0,
          comments: 0,
          likes: 0,
          shares: 0
        });
      });
      
      // Buscar eventos para cada live
      for (const live of lives) {
        // Visualizações
        const viewsSnapshot = await db.collection('events')
          .where('type', '==', 'live_view')
          .where('liveId', '==', live.id)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        live.views = viewsSnapshot.size;
        
        // Comentários
        const commentsSnapshot = await db.collection('events')
          .where('type', '==', 'live_comment')
          .where('liveId', '==', live.id)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        live.comments = commentsSnapshot.size;
        
        // Likes
        const likesSnapshot = await db.collection('events')
          .where('type', '==', 'live_like')
          .where('liveId', '==', live.id)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        live.likes = likesSnapshot.size;
        
        // Compartilhamentos
        const sharesSnapshot = await db.collection('events')
          .where('type', '==', 'live_share')
          .where('liveId', '==', live.id)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        live.shares = sharesSnapshot.size;
      }
      
      data = lives;
    }
    
    return res.status(200).json({
      period: {
        days,
        startDate,
        endDate
      },
      exportType,
      data
    });
  } catch (error) {
    console.error('Erro ao exportar dados de analytics:', error);
    return res.status(500).json({ msg: 'Erro ao exportar dados de analytics' });
  }
};

// Registrar evento de analytics
exports.trackEvent = async (req, res) => {
  try {
    const {
      type,
      storyId,
      liveId,
      userId,
      clientId,
      visitorId,
      deviceType,
      location,
      watchTime,
      data
    } = req.body;
    
    if (!type) {
      return res.status(400).json({ msg: 'Tipo de evento é obrigatório' });
    }
    
    // Validar tipo de evento
    const validTypes = [
      'view', 'click', 'completion', 'like', 'share',
      'live_view', 'live_comment', 'live_like', 'live_share'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ msg: 'Tipo de evento inválido' });
    }
    
    // Criar evento
    const eventData = {
      type,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Adicionar campos opcionais
    if (storyId) eventData.storyId = storyId;
    if (liveId) eventData.liveId = liveId;
    if (userId) eventData.userId = userId;
    if (clientId) eventData.clientId = clientId;
    if (visitorId) eventData.visitorId = visitorId;
    if (deviceType) eventData.deviceType = deviceType;
    if (location) eventData.location = location;
    if (watchTime) eventData.watchTime = watchTime;
    if (data) eventData.data = data;
    
    // Salvar evento
    await db.collection('events').add(eventData);
    
    return res.status(200).json({ msg: 'Evento registrado com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
    return res.status(500).json({ msg: 'Erro ao registrar evento' });
  }
};
