const admin = require('firebase-admin');
const db = admin.firestore();

// Registrar um dispositivo para receber notificações push
exports.registerDevice = async (req, res) => {
  try {
    const { token, deviceType } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ msg: 'Token do dispositivo é obrigatório' });
    }

    // Verificar se o dispositivo já está registrado
    const deviceRef = db.collection('devices').doc(token);
    const deviceDoc = await deviceRef.get();

    if (deviceDoc.exists) {
      // Atualizar registro existente
      await deviceRef.update({
        userId,
        deviceType: deviceType || 'unknown',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Criar novo registro
      await deviceRef.set({
        userId,
        token,
        deviceType: deviceType || 'unknown',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return res.status(200).json({ msg: 'Dispositivo registrado com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar dispositivo:', error);
    return res.status(500).json({ msg: 'Erro ao registrar dispositivo' });
  }
};

// Enviar notificação para um usuário específico
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({ msg: 'UserId, título e corpo são obrigatórios' });
    }

    // Buscar tokens do usuário
    const devicesSnapshot = await db.collection('devices')
      .where('userId', '==', userId)
      .get();
    
    if (devicesSnapshot.empty) {
      return res.status(404).json({ msg: 'Nenhum dispositivo encontrado para este usuário' });
    }

    const tokens = [];
    devicesSnapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    // Criar mensagem de notificação
    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      tokens
    };

    // Enviar notificação
    const response = await admin.messaging().sendMulticast(message);
    
    // Salvar notificação no banco de dados
    await db.collection('notifications').add({
      userId,
      title,
      body,
      data: data || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ 
      msg: 'Notificação enviada com sucesso',
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return res.status(500).json({ msg: 'Erro ao enviar notificação' });
  }
};

// Enviar notificação para todos os usuários de um cliente
exports.broadcastNotification = async (req, res) => {
  try {
    const { clientId, title, body, data } = req.body;
    const adminLevel = req.user.adminLevel;
    
    // Verificar se o usuário tem permissão (Admin Cliente ou superior)
    if (adminLevel !== 'client' && adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    if (!clientId || !title || !body) {
      return res.status(400).json({ msg: 'ClientId, título e corpo são obrigatórios' });
    }

    // Buscar usuários do cliente
    const usersSnapshot = await db.collection('users')
      .where('clientId', '==', clientId)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ msg: 'Nenhum usuário encontrado para este cliente' });
    }

    const userIds = [];
    usersSnapshot.forEach(doc => {
      userIds.push(doc.id);
    });

    // Buscar tokens de todos os usuários
    const devicesSnapshot = await db.collection('devices')
      .where('userId', 'in', userIds)
      .get();
    
    if (devicesSnapshot.empty) {
      return res.status(404).json({ msg: 'Nenhum dispositivo encontrado para os usuários deste cliente' });
    }

    const tokens = [];
    devicesSnapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    // Enviar notificações em lotes de 500 tokens (limite do Firebase)
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      const message = {
        notification: {
          title,
          body
        },
        data: data || {},
        tokens: batch
      };
      
      batches.push(admin.messaging().sendMulticast(message));
    }
    
    const results = await Promise.all(batches);
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach(result => {
      successCount += result.successCount;
      failureCount += result.failureCount;
    });

    // Salvar notificações no banco de dados para cada usuário
    const batch = db.batch();
    
    userIds.forEach(userId => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId,
        title,
        body,
        data: data || {},
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();

    return res.status(200).json({ 
      msg: 'Notificação em massa enviada com sucesso',
      successCount,
      failureCount,
      totalUsers: userIds.length
    });
  } catch (error) {
    console.error('Erro ao enviar notificação em massa:', error);
    return res.status(500).json({ msg: 'Erro ao enviar notificação em massa' });
  }
};

// Obter todas as notificações do usuário
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Buscar notificações do usuário
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip)
      .get();
    
    const notifications = [];
    notificationsSnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
      });
    });

    // Contar total de notificações
    const countSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .count()
      .get();
    
    const totalNotifications = countSnapshot.data().count;
    const totalPages = Math.ceil(totalNotifications / limit);

    return res.status(200).json({
      notifications,
      pagination: {
        total: totalNotifications,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return res.status(500).json({ msg: 'Erro ao buscar notificações' });
  }
};

// Marcar notificação como lida
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verificar se a notificação existe e pertence ao usuário
    const notificationRef = db.collection('notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return res.status(404).json({ msg: 'Notificação não encontrada' });
    }

    if (notificationDoc.data().userId !== userId) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }

    // Marcar como lida
    await notificationRef.update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ msg: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return res.status(500).json({ msg: 'Erro ao marcar notificação como lida' });
  }
};

// Excluir uma notificação
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verificar se a notificação existe e pertence ao usuário
    const notificationRef = db.collection('notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return res.status(404).json({ msg: 'Notificação não encontrada' });
    }

    if (notificationDoc.data().userId !== userId) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }

    // Excluir notificação
    await notificationRef.delete();

    return res.status(200).json({ msg: 'Notificação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    return res.status(500).json({ msg: 'Erro ao excluir notificação' });
  }
};

// Obter configurações de notificação do usuário
exports.getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar configurações do usuário
    const settingsRef = db.collection('notificationSettings').doc(userId);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      // Configurações padrão
      const defaultSettings = {
        pushEnabled: true,
        emailEnabled: true,
        newStoryNotification: true,
        newLiveNotification: true,
        commentNotification: true,
        likeNotification: true,
        systemNotification: true
      };

      // Criar configurações padrão para o usuário
      await settingsRef.set({
        ...defaultSettings,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json(defaultSettings);
    }

    return res.status(200).json(settingsDoc.data());
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error);
    return res.status(500).json({ msg: 'Erro ao buscar configurações de notificação' });
  }
};

// Atualizar configurações de notificação do usuário
exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      pushEnabled,
      emailEnabled,
      newStoryNotification,
      newLiveNotification,
      commentNotification,
      likeNotification,
      systemNotification
    } = req.body;

    // Validar dados
    const settings = {};
    
    if (pushEnabled !== undefined) settings.pushEnabled = pushEnabled;
    if (emailEnabled !== undefined) settings.emailEnabled = emailEnabled;
    if (newStoryNotification !== undefined) settings.newStoryNotification = newStoryNotification;
    if (newLiveNotification !== undefined) settings.newLiveNotification = newLiveNotification;
    if (commentNotification !== undefined) settings.commentNotification = commentNotification;
    if (likeNotification !== undefined) settings.likeNotification = likeNotification;
    if (systemNotification !== undefined) settings.systemNotification = systemNotification;

    // Atualizar configurações
    const settingsRef = db.collection('notificationSettings').doc(userId);
    await settingsRef.set({
      ...settings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({ 
      msg: 'Configurações de notificação atualizadas com sucesso',
      settings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de notificação:', error);
    return res.status(500).json({ msg: 'Erro ao atualizar configurações de notificação' });
  }
};
