const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();
const usersCollection = db.collection('users');
const permissionsCollection = db.collection('permissions');

// Registrar um novo usuário
exports.register = async (req, res) => {
  try {
    const { email, password, name, company } = req.body;

    // Verificar se o email já está em uso
    try {
      const userRecord = await getAuth().getUserByEmail(email);
      return res.status(400).json({ message: 'Este email já está em uso.' });
    } catch (error) {
      // Email não está em uso, podemos continuar
    }

    // Criar usuário no Firebase Authentication
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    // Definir papel padrão como 'user'
    const role = 'user';
    const permissions = [];

    // Armazenar informações adicionais no Firestore
    await usersCollection.doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      company,
      role,
      permissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Gerar token JWT
    const token = jwt.sign(
      { uid: userRecord.uid, email, role, permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      user: {
        uid: userRecord.uid,
        email,
        name,
        company,
        role,
        permissions
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário', error: error.message });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Autenticar com Firebase
    const userCredential = await getAuth().getUserByEmail(email);
    
    // Obter dados adicionais do Firestore
    const userDoc = await usersCollection.doc(userCredential.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuário não encontrado no banco de dados.' });
    }
    
    const userData = userDoc.data();
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        uid: userCredential.uid, 
        email: userCredential.email, 
        role: userData.role || 'user',
        permissions: userData.permissions || []
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        uid: userCredential.uid,
        email: userCredential.email,
        name: userData.name,
        company: userData.company,
        role: userData.role || 'user',
        permissions: userData.permissions || []
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(401).json({ message: 'Credenciais inválidas', error: error.message });
  }
};

// Recuperação de senha
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verificar se o email existe
    await getAuth().getUserByEmail(email);
    
    // Enviar email de recuperação de senha
    await getAuth().generatePasswordResetLink(email);
    
    res.status(200).json({ message: 'Email de recuperação de senha enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    // Não informamos se o email existe ou não por questões de segurança
    res.status(200).json({ message: 'Se o email estiver registrado, um link de recuperação será enviado.' });
  }
};

// Redefinir senha
exports.resetPassword = async (req, res) => {
  try {
    const { oobCode, newPassword } = req.body;
    
    // Verificar o código oob e redefinir a senha
    await getAuth().verifyPasswordResetCode(oobCode);
    await getAuth().confirmPasswordReset(oobCode, newPassword);
    
    res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(400).json({ message: 'Erro ao redefinir senha', error: error.message });
  }
};

// Obter usuário atual
exports.getCurrentUser = async (req, res) => {
  try {
    const userDoc = await usersCollection.doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const userData = userDoc.data();
    
    res.status(200).json({
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        company: userData.company,
        role: userData.role,
        permissions: userData.permissions
      }
    });
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    res.status(500).json({ message: 'Erro ao obter usuário atual', error: error.message });
  }
};

// Atualizar usuário atual
exports.updateCurrentUser = async (req, res) => {
  try {
    const { name, company } = req.body;
    
    // Atualizar no Firestore
    await usersCollection.doc(req.user.uid).update({
      name,
      company,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
};

// Alterar senha
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Atualizar senha no Firebase Auth
    await getAuth().updateUser(req.user.uid, {
      password: newPassword
    });
    
    res.status(200).json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha', error: error.message });
  }
};

// Obter todos os usuários (apenas para admin_master)
exports.getAllUsers = async (req, res) => {
  try {
    const usersSnapshot = await usersCollection.get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        company: userData.company,
        role: userData.role,
        permissions: userData.permissions,
        createdAt: userData.createdAt
      });
    });
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    res.status(500).json({ message: 'Erro ao obter usuários', error: error.message });
  }
};

// Criar usuário (admin_master e admin_client)
exports.createUser = async (req, res) => {
  try {
    const { email, password, name, company, role, permissions } = req.body;
    
    // Verificar se o papel é válido
    const validRoles = ['user', 'admin_user', 'admin_client', 'admin_master'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Papel inválido.' });
    }
    
    // Verificar se o admin_client está tentando criar um admin_master
    if (req.user.role === 'admin_client' && role === 'admin_master') {
      return res.status(403).json({ message: 'Você não tem permissão para criar um Admin Master.' });
    }
    
    // Criar usuário no Firebase Authentication
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name
    });
    
    // Armazenar informações adicionais no Firestore
    await usersCollection.doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      company,
      role,
      permissions: permissions || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid
    });
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        uid: userRecord.uid,
        email,
        name,
        company,
        role,
        permissions: permissions || []
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
  }
};

// Obter usuário por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obter usuário do Firestore
    const userDoc = await usersCollection.doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const userData = userDoc.data();
    
    // Verificar se o admin_client está tentando acessar um usuário que não é seu
    if (req.user.role === 'admin_client' && userData.createdBy !== req.user.uid) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar este usuário.' });
    }
    
    res.status(200).json({
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        company: userData.company,
        role: userData.role,
        permissions: userData.permissions,
        createdAt: userData.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ message: 'Erro ao obter usuário', error: error.message });
  }
};

// Atualizar usuário
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, role, permissions } = req.body;
    
    // Obter usuário do Firestore
    const userDoc = await usersCollection.doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const userData = userDoc.data();
    
    // Verificar se o admin_client está tentando atualizar um usuário que não é seu
    if (req.user.role === 'admin_client' && userData.createdBy !== req.user.uid) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este usuário.' });
    }
    
    // Verificar se o admin_client está tentando mudar o papel para admin_master
    if (req.user.role === 'admin_client' && role === 'admin_master') {
      return res.status(403).json({ message: 'Você não tem permissão para criar um Admin Master.' });
    }
    
    // Atualizar no Firestore
    await usersCollection.doc(id).update({
      name,
      company,
      role,
      permissions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
};

// Excluir usuário
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obter usuário do Firestore
    const userDoc = await usersCollection.doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const userData = userDoc.data();
    
    // Verificar se o admin_client está tentando excluir um usuário que não é seu
    if (req.user.role === 'admin_client' && userData.createdBy !== req.user.uid) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir este usuário.' });
    }
    
    // Excluir do Firebase Authentication
    await getAuth().deleteUser(id);
    
    // Excluir do Firestore
    await usersCollection.doc(id).delete();
    
    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro ao excluir usuário', error: error.message });
  }
};

// Obter permissões disponíveis
exports.getPermissions = async (req, res) => {
  try {
    const permissionsSnapshot = await permissionsCollection.get();
    const permissions = [];
    
    permissionsSnapshot.forEach(doc => {
      const permissionData = doc.data();
      permissions.push({
        id: doc.id,
        name: permissionData.name,
        description: permissionData.description,
        category: permissionData.category
      });
    });
    
    res.status(200).json({ permissions });
  } catch (error) {
    console.error('Erro ao obter permissões:', error);
    res.status(500).json({ message: 'Erro ao obter permissões', error: error.message });
  }
};

// Atualizar permissões de um usuário
exports.updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    // Obter usuário do Firestore
    const userDoc = await usersCollection.doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const userData = userDoc.data();
    
    // Verificar se o admin_client está tentando atualizar um usuário que não é seu
    if (req.user.role === 'admin_client' && userData.createdBy !== req.user.uid) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este usuário.' });
    }
    
    // Atualizar permissões no Firestore
    await usersCollection.doc(id).update({
      permissions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ message: 'Permissões atualizadas com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    res.status(500).json({ message: 'Erro ao atualizar permissões', error: error.message });
  }
};
