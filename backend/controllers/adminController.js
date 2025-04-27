const admin = require('firebase-admin');
const db = admin.firestore();
const { v4: uuidv4 } = require('uuid');

// Obter todos os usuários
exports.getUsers = async (req, res) => {
  try {
    const adminLevel = req.user.adminLevel;
    
    // Verificar permissão (apenas Admin Master)
    if (adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Parâmetros de paginação
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Filtros
    const clientId = req.query.clientId;
    const role = req.query.role;
    const status = req.query.status;
    
    // Construir query
    let query = db.collection('users');
    
    if (clientId) {
      query = query.where('clientId', '==', clientId);
    }
    
    if (role) {
      query = query.where('role', '==', role);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Contar total de usuários
    const countSnapshot = await query.count().get();
    const totalUsers = countSnapshot.data().count;
    
    // Buscar usuários com paginação
    const usersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip)
      .get();
    
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Remover campos sensíveis
      delete userData.password;
      delete userData.resetPasswordToken;
      
      users.push({
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt ? userData.createdAt.toDate() : null,
        updatedAt: userData.updatedAt ? userData.updatedAt.toDate() : null
      });
    });
    
    return res.status(200).json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ msg: 'Erro ao buscar usuários' });
  }
};

// Obter um usuário específico
exports.getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminLevel = req.user.adminLevel;
    const clientId = req.user.clientId;
    
    // Buscar usuário
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userData = userDoc.data();
    
    // Verificar permissão (Admin Master ou Admin Cliente para seus usuários)
    if (adminLevel !== 'master' && 
        (adminLevel !== 'client' || userData.clientId !== clientId)) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Remover campos sensíveis
    delete userData.password;
    delete userData.resetPasswordToken;
    
    return res.status(200).json({
      id: userDoc.id,
      ...userData,
      createdAt: userData.createdAt ? userData.createdAt.toDate() : null,
      updatedAt: userData.updatedAt ? userData.updatedAt.toDate() : null
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ msg: 'Erro ao buscar usuário' });
  }
};

// Criar um novo usuário
exports.createUser = async (req, res) => {
  try {
    const adminLevel = req.user.adminLevel;
    const adminClientId = req.user.clientId;
    
    // Verificar permissão (Admin Master ou Admin Cliente)
    if (adminLevel !== 'master' && adminLevel !== 'client') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    const {
      name,
      email,
      password,
      role,
      clientId,
      permissions
    } = req.body;
    
    // Validar dados
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Nome, email e senha são obrigatórios' });
    }
    
    // Verificar se o email já está em uso
    const emailCheck = await admin.auth().getUserByEmail(email).catch(() => null);
    
    if (emailCheck) {
      return res.status(400).json({ msg: 'Email já está em uso' });
    }
    
    // Determinar clientId com base no nível de admin
    let userClientId = clientId;
    
    if (adminLevel === 'client') {
      // Admin Cliente só pode criar usuários para seu próprio cliente
      userClientId = adminClientId;
    } else if (!userClientId && adminLevel === 'master') {
      return res.status(400).json({ msg: 'ClientId é obrigatório' });
    }
    
    // Verificar se o cliente existe
    const clientRef = db.collection('clients').doc(userClientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return res.status(404).json({ msg: 'Cliente não encontrado' });
    }
    
    // Determinar nível de admin com base no role
    let userAdminLevel = 'user';
    
    if (role === 'admin') {
      userAdminLevel = 'client';
    } else if (role === 'master' && adminLevel === 'master') {
      userAdminLevel = 'master';
    }
    
    // Criar usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      disabled: false
    });
    
    // Definir claims personalizadas
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role,
      adminLevel: userAdminLevel,
      clientId: userClientId
    });
    
    // Criar usuário no Firestore
    const userData = {
      name,
      email,
      role,
      adminLevel: userAdminLevel,
      clientId: userClientId,
      status: 'active',
      createdBy: req.user.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Adicionar permissões se fornecidas
    if (permissions) {
      userData.permissions = permissions;
    } else {
      // Permissões padrão
      userData.permissions = {
        stories: { create: true, read: true, update: true, delete: true },
        lives: { create: true, read: true, update: true, delete: true },
        analytics: { read: true },
        users: { create: false, read: true, update: false, delete: false }
      };
    }
    
    await db.collection('users').doc(userRecord.uid).set(userData);
    
    // Registrar ação no log de auditoria
    await db.collection('auditLogs').add({
      action: 'create_user',
      userId: req.user.id,
      targetId: userRecord.uid,
      details: {
        name,
        email,
        role,
        clientId: userClientId
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(201).json({
      msg: 'Usuário criado com sucesso',
      user: {
        id: userRecord.uid,
        name,
        email,
        role,
        adminLevel: userAdminLevel,
        clientId: userClientId,
        permissions: userData.permissions
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ msg: 'Erro ao criar usuário' });
  }
};

// Atualizar um usuário
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminLevel = req.user.adminLevel;
    const adminClientId = req.user.clientId;
    
    // Buscar usuário
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userData = userDoc.data();
    
    // Verificar permissão (Admin Master ou Admin Cliente para seus usuários)
    if (adminLevel !== 'master' && 
        (adminLevel !== 'client' || userData.clientId !== adminClientId)) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    const {
      name,
      email,
      password,
      role,
      clientId,
      status,
      permissions
    } = req.body;
    
    // Preparar dados para atualização
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.id
    };
    
    // Atualizar campos fornecidos
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (permissions) updateData.permissions = permissions;
    
    // Atualizar role e adminLevel (apenas Admin Master)
    if (role && adminLevel === 'master') {
      updateData.role = role;
      
      // Determinar nível de admin com base no role
      let userAdminLevel = 'user';
      
      if (role === 'admin') {
        userAdminLevel = 'client';
      } else if (role === 'master') {
        userAdminLevel = 'master';
      }
      
      updateData.adminLevel = userAdminLevel;
      
      // Atualizar claims no Firebase Auth
      await admin.auth().setCustomUserClaims(userId, {
        role,
        adminLevel: userAdminLevel,
        clientId: clientId || userData.clientId
      });
    }
    
    // Atualizar clientId (apenas Admin Master)
    if (clientId && adminLevel === 'master') {
      // Verificar se o cliente existe
      const clientRef = db.collection('clients').doc(clientId);
      const clientDoc = await clientRef.get();
      
      if (!clientDoc.exists) {
        return res.status(404).json({ msg: 'Cliente não encontrado' });
      }
      
      updateData.clientId = clientId;
      
      // Atualizar claims no Firebase Auth
      await admin.auth().setCustomUserClaims(userId, {
        role: updateData.role || userData.role,
        adminLevel: updateData.adminLevel || userData.adminLevel,
        clientId
      });
    }
    
    // Atualizar email (Firebase Auth + Firestore)
    if (email && email !== userData.email) {
      // Verificar se o email já está em uso
      try {
        const emailCheck = await admin.auth().getUserByEmail(email);
        
        if (emailCheck && emailCheck.uid !== userId) {
          return res.status(400).json({ msg: 'Email já está em uso' });
        }
      } catch (error) {
        // Email não está em uso, podemos prosseguir
      }
      
      // Atualizar email no Firebase Auth
      await admin.auth().updateUser(userId, { email });
      
      updateData.email = email;
    }
    
    // Atualizar senha (apenas Firebase Auth)
    if (password) {
      await admin.auth().updateUser(userId, { password });
    }
    
    // Atualizar usuário no Firestore
    await userRef.update(updateData);
    
    // Registrar ação no log de auditoria
    await db.collection('auditLogs').add({
      action: 'update_user',
      userId: req.user.id,
      targetId: userId,
      details: {
        updatedFields: Object.keys(updateData).filter(key => 
          key !== 'updatedAt' && key !== 'updatedBy'
        )
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Buscar usuário atualizado
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();
    
    // Remover campos sensíveis
    delete updatedUserData.password;
    delete updatedUserData.resetPasswordToken;
    
    return res.status(200).json({
      msg: 'Usuário atualizado com sucesso',
      user: {
        id: userId,
        ...updatedUserData,
        createdAt: updatedUserData.createdAt ? updatedUserData.createdAt.toDate() : null,
        updatedAt: updatedUserData.updatedAt ? updatedUserData.updatedAt.toDate() : null
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ msg: 'Erro ao atualizar usuário' });
  }
};

// Excluir um usuário
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminLevel = req.user.adminLevel;
    const adminClientId = req.user.clientId;
    
    // Buscar usuário
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userData = userDoc.data();
    
    // Verificar permissão (Admin Master ou Admin Cliente para seus usuários)
    if (adminLevel !== 'master' && 
        (adminLevel !== 'client' || userData.clientId !== adminClientId)) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Verificar se o usuário está tentando excluir a si mesmo
    if (userId === req.user.id) {
      return res.status(400).json({ msg: 'Não é possível excluir seu próprio usuário' });
    }
    
    // Excluir usuário no Firebase Auth
    await admin.auth().deleteUser(userId);
    
    // Excluir usuário no Firestore
    await userRef.delete();
    
    // Registrar ação no log de auditoria
    await db.collection('auditLogs').add({
      action: 'delete_user',
      userId: req.user.id,
      targetId: userId,
      details: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        clientId: userData.clientId
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({ msg: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ msg: 'Erro ao excluir usuário' });
  }
};

// Obter todos os clientes
exports.getClients = async (req, res) => {
  try {
    const adminLevel = req.user.adminLevel;
    
    // Verificar permissão (apenas Admin Master)
    if (adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Parâmetros de paginação
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Filtros
    const status = req.query.status;
    const subscriptionStatus = req.query.subscriptionStatus;
    
    // Construir query
    let query = db.collection('clients');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (subscriptionStatus) {
      query = query.where('subscriptionStatus', '==', subscriptionStatus);
    }
    
    // Contar total de clientes
    const countSnapshot = await query.count().get();
    const totalClients = countSnapshot.data().count;
    
    // Buscar clientes com paginação
    const clientsSnapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip)
      .get();
    
    const clients = [];
    
    clientsSnapshot.forEach(doc => {
      const clientData = doc.data();
      
      clients.push({
        id: doc.id,
        ...clientData,
        createdAt: clientData.createdAt ? clientData.createdAt.toDate() : null,
        updatedAt: clientData.updatedAt ? clientData.updatedAt.toDate() : null
      });
    });
    
    return res.status(200).json({
      clients,
      pagination: {
        total: totalClients,
        page,
        limit,
        totalPages: Math.ceil(totalClients / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return res.status(500).json({ msg: 'Erro ao buscar clientes' });
  }
};

// Obter um cliente específico
exports.getClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const adminLevel = req.user.adminLevel;
    const adminClientId = req.user.clientId;
    
    // Verificar permissão (Admin Master ou Admin Cliente para seu próprio cliente)
    if (adminLevel !== 'master' && 
        (adminLevel !== 'client' || clientId !== adminClientId)) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Buscar cliente
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return res.status(404).json({ msg: 'Cliente não encontrado' });
    }
    
    const clientData = clientDoc.data();
    
    // Buscar usuários do cliente
    const usersSnapshot = await db.collection('users')
      .where('clientId', '==', clientId)
      .get();
    
    const totalUsers = usersSnapshot.size;
    
    // Buscar stories do cliente
    const storiesSnapshot = await db.collection('stories')
      .where('clientId', '==', clientId)
      .get();
    
    const totalStories = storiesSnapshot.size;
    
    // Buscar lives do cliente
    const livesSnapshot = await db.collection('lives')
      .where('clientId', '==', clientId)
      .get();
    
    const totalLives = livesSnapshot.size;
    
    return res.status(200).json({
      id: clientDoc.id,
      ...clientData,
      stats: {
        totalUsers,
        totalStories,
        totalLives
      },
      createdAt: clientData.createdAt ? clientData.createdAt.toDate() : null,
      updatedAt: clientData.updatedAt ? clientData.updatedAt.toDate() : null
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ msg: 'Erro ao buscar cliente' });
  }
};

// Criar um novo cliente
exports.createClient = async (req, res) => {
  try {
    const adminLevel = req.user.adminLevel;
    
    // Verificar permissão (apenas Admin Master)
    if (adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    const {
      name,
      email,
      website,
      phone,
      address,
      plan,
      status
    } = req.body;
    
    // Validar dados
    if (!name || !email) {
      return res.status(400).json({ msg: 'Nome e email são obrigatórios' });
    }
    
    // Verificar se o email já está em uso
    const clientsSnapshot = await db.collection('clients')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!clientsSnapshot.empty) {
      return res.status(400).json({ msg: 'Email já está em uso' });
    }
    
    // Gerar código único para o cliente
    const clientCode = uuidv4().substring(0, 8);
    
    // Criar cliente no Firestore
    const clientData = {
      name,
      email,
      website: website || null,
      phone: phone || null,
      address: address || null,
      clientCode,
      plan: plan || 'free',
      status: status || 'active',
      subscriptionStatus: 'none',
      createdBy: req.user.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const clientRef = db.collection('clients').doc();
    await clientRef.set(clientData);
    
    // Registrar ação no log de auditoria
    await db.collection('auditLogs').add({
      action: 'create_client',
      userId: req.user.id,
      targetId: clientRef.id,
      details: {
        name,
        email,
        plan: plan || 'free'
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(201).json({
      msg: 'Cliente criado com sucesso',
      client: {
        id: clientRef.id,
        ...clientData
      }
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return res.status(500).json({ msg: 'Erro ao criar cliente' });
  }
};

// Atualizar um cliente
exports.updateClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const adminLevel = req.user.adminLevel;
    const adminClientId = req.user.clientId;
    
    // Verificar permissão (Admin Master ou Admin Cliente para seu próprio cliente)
    if (adminLevel !== 'master' && 
        (adminLevel !== 'client' || clientId !== adminClientId)) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Buscar cliente
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return res.status(404).json({ msg: 'Cliente não encontrado' });
    }
    
    const {
      name,
      email,
      website,
      phone,
      address,
      plan,
      status,
      subscriptionStatus
    } = req.body;
    
    // Preparar dados para atualização
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.id
    };
    
    // Campos que qualquer admin pode atualizar
    if (name) updateData.name = name;
    if (website) updateData.website = website;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    
    // Campos que apenas Admin Master pode atualizar
    if (adminLevel === 'master') {
      if (email) {
        // Verificar se o email já está em uso
        const emailCheckSnapshot = await db.collection('clients')
          .where('email', '==', email)
          .limit(1)
          .get();
        
        if (!emailCheckSnapshot.empty && emailCheckSnapshot.docs[0].id !== clientId) {
          return res.status(400).json({ msg: 'Email já está em uso' });
        }
        
        updateData.email = email;
      }
      
      if (plan) updateData.plan = plan;
      if (status) updateData.status = status;
      if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
    }
    
    // Atualizar cliente no Firestore
    await clientRef.update(updateData);
    
    // Registrar ação no log de auditoria
    await db.collection('auditLogs').add({
      action: 'update_client',
      userId: req.user.id,
      targetId: clientId,
      details: {
        updatedFields: Object.keys(updateData).filter(key => 
          key !== 'updatedAt' && key !== 'updatedBy'
        )
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Buscar cliente atualizado
    const updatedClientDoc = await clientRef.get();
    const updatedClientData = updatedClientDoc.data();
    
    return res.status(200).json({
      msg: 'Cliente atualizado com sucesso',
      client: {
        id: clientId,
        ...updatedClientData,
        createdAt: updatedClientData.createdAt ? updatedClientData.createdAt.toDate() : null,
        updatedAt: updatedClientData.updatedAt ? updatedClientData.updatedAt.toDate() : null
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return res.status(500).json({ msg: 'Erro ao atualizar cliente' });
  }
};

// Excluir um cliente
exports.deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const adminLevel = req.user.adminLevel;
    
    // Verificar permissão (apenas Admin Master)
    if (adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Buscar cliente
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return res.status(404).json({ msg: 'Cliente não encontrado' });
    }
    
    const clientData = clientDoc.data();
    
    // Verificar se há usuários associados ao cliente
    const usersSnapshot = await db.collection('users')
      .where('clientId', '==', clientId)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      return res.status(400).json({ 
        msg: 'Não é possível excluir o cliente porque existem usuários associados a ele' 
      });
    }
    
    // Excluir cliente no Firestore
    await clientRef.delete();
    
    // Registrar ação no log de auditoria
    await db.collection('auditLogs').add({
      action: 'delete_client',
      userId: req.user.id,
      targetId: clientId,
      details: {
        name: clientData.name,
        email: clientData.email
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({ msg: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return res.status(500).json({ msg: 'Erro ao excluir cliente' });
  }
};

// Obter todas as permissões
exports.getPermissions = async (req, res) => {
  try {
    const adminLevel = req.user.adminLevel;
    const clientId = req.user.clientId;
    
    // Verificar permissão (Admin Cliente ou Admin Master)
    if (adminLevel !== 'client' && adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Buscar usuários com base no nível de admin
    let usersQuery = db.collection('users');
    
    if (adminLevel === 'client') {
      usersQuery = usersQuery.where('clientId', '==', clientId);
    }
    
    const usersSnapshot = await usersQuery.get();
    
    const usersPermissions = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      usersPermissions.push({
        id: doc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        adminLevel: userData.adminLevel,
        permissions: userData.permissions || {}
      });
    });
    
    return res.status(200).json(usersPermissions);
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    return res.status(500).json({ msg: 'Erro ao buscar permissões' });
  }
};

// Atualizar permissões de um usuário
exports.updatePermissions = async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminLevel = req.user.adminLevel;
    const adminClientId = req.user.clientId;
    const { permissions } = req.body;
    
    // Validar dados
    if (!permissions) {
      return res.status(400).json({ msg: 'Permissões são obrigatórias' });
    }
    
    // Buscar usuário
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userData = userDoc.data();
    
    // Verificar permissão (Admin Cliente para seus usuários ou Admin Master)
    if (adminLevel !== 'master' && 
        (adminLevel !== 'client' || userData.clientId !== adminClientId)) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Atualizar permissões
    await userRef.update({
      permissions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.id
    });
    
    // Registrar ação no log de auditoria
    await db.collection('auditLogs').add({
      action: 'update_permissions',
      userId: req.user.id,
      targetId: userId,
      details: {
        permissions
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({
      msg: 'Permissões atualizadas com sucesso',
      permissions
    });
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    return res.status(500).json({ msg: 'Erro ao atualizar permissões' });
  }
};

// Obter dados do dashboard administrativo
exports.getDashboard = async (req, res) => {
  try {
    const adminLevel = req.user.adminLevel;
    
    // Verificar permissão (apenas Admin Master)
    if (adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Período de tempo (padrão: últimos 30 dias)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Contar total de clientes
    const clientsSnapshot = await db.collection('clients').count().get();
    const totalClients = clientsSnapshot.data().count;
    
    // Contar clientes ativos
    const activeClientsSnapshot = await db.collection('clients')
      .where('status', '==', 'active')
      .count()
      .get();
    
    const activeClients = activeClientsSnapshot.data().count;
    
    // Contar total de usuários
    const usersSnapshot = await db.collection('users').count().get();
    const totalUsers = usersSnapshot.data().count;
    
    // Contar usuários ativos
    const activeUsersSnapshot = await db.collection('users')
      .where('status', '==', 'active')
      .count()
      .get();
    
    const activeUsers = activeUsersSnapshot.data().count;
    
    // Contar total de stories
    const storiesSnapshot = await db.collection('stories').count().get();
    const totalStories = storiesSnapshot.data().count;
    
    // Contar stories criados no período
    const recentStoriesSnapshot = await db.collection('stories')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .count()
      .get();
    
    const recentStories = recentStoriesSnapshot.data().count;
    
    // Contar total de lives
    const livesSnapshot = await db.collection('lives').count().get();
    const totalLives = livesSnapshot.data().count;
    
    // Contar lives criadas no período
    const recentLivesSnapshot = await db.collection('lives')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .count()
      .get();
    
    const recentLives = recentLivesSnapshot.data().count;
    
    // Contar assinaturas por status
    const subscriptionStatusCounts = {};
    
    const subscriptionStatusSnapshot = await db.collection('clients')
      .where('subscriptionStatus', '!=', 'none')
      .get();
    
    subscriptionStatusSnapshot.forEach(doc => {
      const status = doc.data().subscriptionStatus;
      
      if (!subscriptionStatusCounts[status]) {
        subscriptionStatusCounts[status] = 0;
      }
      
      subscriptionStatusCounts[status]++;
    });
    
    // Contar clientes por plano
    const planCounts = {};
    
    const plansSnapshot = await db.collection('clients').get();
    
    plansSnapshot.forEach(doc => {
      const plan = doc.data().plan || 'free';
      
      if (!planCounts[plan]) {
        planCounts[plan] = 0;
      }
      
      planCounts[plan]++;
    });
    
    // Buscar clientes recentes
    const recentClientsSnapshot = await db.collection('clients')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const recentClients = [];
    
    recentClientsSnapshot.forEach(doc => {
      const clientData = doc.data();
      
      recentClients.push({
        id: doc.id,
        name: clientData.name,
        email: clientData.email,
        plan: clientData.plan,
        status: clientData.status,
        subscriptionStatus: clientData.subscriptionStatus,
        createdAt: clientData.createdAt ? clientData.createdAt.toDate() : null
      });
    });
    
    // Buscar eventos recentes do log de auditoria
    const auditLogsSnapshot = await db.collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const recentAuditLogs = [];
    
    auditLogsSnapshot.forEach(doc => {
      const logData = doc.data();
      
      recentAuditLogs.push({
        id: doc.id,
        action: logData.action,
        userId: logData.userId,
        targetId: logData.targetId,
        details: logData.details,
        timestamp: logData.timestamp ? logData.timestamp.toDate() : null
      });
    });
    
    return res.status(200).json({
      period: {
        days,
        startDate,
        endDate
      },
      counts: {
        clients: {
          total: totalClients,
          active: activeClients
        },
        users: {
          total: totalUsers,
          active: activeUsers
        },
        stories: {
          total: totalStories,
          recent: recentStories
        },
        lives: {
          total: totalLives,
          recent: recentLives
        }
      },
      subscriptions: subscriptionStatusCounts,
      plans: planCounts,
      recentClients,
      recentAuditLogs
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return res.status(500).json({ msg: 'Erro ao buscar dados do dashboard' });
  }
};

// Obter logs de auditoria
exports.getAuditLogs = async (req, res) => {
  try {
    const adminLevel = req.user.adminLevel;
    
    // Verificar permissão (apenas Admin Master)
    if (adminLevel !== 'master') {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Parâmetros de paginação
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Filtros
    const action = req.query.action;
    const userId = req.query.userId;
    const targetId = req.query.targetId;
    
    // Período de tempo
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    
    // Construir query
    let query = db.collection('auditLogs');
    
    if (action) {
      query = query.where('action', '==', action);
    }
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (targetId) {
      query = query.where('targetId', '==', targetId);
    }
    
    if (startDate && endDate) {
      query = query.where('timestamp', '>=', startDate)
                  .where('timestamp', '<=', endDate);
    } else if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    } else if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }
    
    // Contar total de logs
    const countSnapshot = await query.count().get();
    const totalLogs = countSnapshot.data().count;
    
    // Buscar logs com paginação
    const logsSnapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(skip)
      .get();
    
    const logs = [];
    
    logsSnapshot.forEach(doc => {
      const logData = doc.data();
      
      logs.push({
        id: doc.id,
        action: logData.action,
        userId: logData.userId,
        targetId: logData.targetId,
        details: logData.details,
        timestamp: logData.timestamp ? logData.timestamp.toDate() : null
      });
    });
    
    return res.status(200).json({
      logs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        totalPages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return res.status(500).json({ msg: 'Erro ao buscar logs de auditoria' });
  }
};
