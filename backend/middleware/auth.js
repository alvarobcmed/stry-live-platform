const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

// Middleware para verificar o token JWT
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acesso não autorizado. Token não fornecido.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar o token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário existe no Firebase
    try {
      const userRecord = await getAuth().getUser(decoded.uid);
      req.user = {
        uid: userRecord.uid,
        email: userRecord.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || []
      };
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Usuário não encontrado ou token inválido.' });
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

// Middleware para verificar o papel do usuário
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem permissão para acessar este recurso.' 
      });
    }
    
    next();
  };
};

// Middleware para verificar permissões específicas
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    
    // Admin Master tem todas as permissões
    if (req.user.role === 'admin_master') {
      return next();
    }
    
    // Verificar se o usuário tem a permissão específica
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem permissão para realizar esta ação.' 
      });
    }
    
    next();
  };
};
