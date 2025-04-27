const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rotas protegidas
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);
router.put('/me', authMiddleware.verifyToken, authController.updateCurrentUser);
router.put('/change-password', authMiddleware.verifyToken, authController.changePassword);

// Rotas de administração
router.get('/users', 
  authMiddleware.verifyToken, 
  authMiddleware.checkRole(['admin_master']), 
  authController.getAllUsers
);

router.post('/users', 
  authMiddleware.verifyToken, 
  authMiddleware.checkRole(['admin_master', 'admin_client']), 
  authController.createUser
);

router.get('/users/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.checkRole(['admin_master', 'admin_client']), 
  authController.getUserById
);

router.put('/users/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.checkRole(['admin_master', 'admin_client']), 
  authController.updateUser
);

router.delete('/users/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.checkRole(['admin_master', 'admin_client']), 
  authController.deleteUser
);

// Rotas para gerenciamento de permissões
router.get('/permissions', 
  authMiddleware.verifyToken, 
  authMiddleware.checkRole(['admin_master', 'admin_client']), 
  authController.getPermissions
);

router.put('/users/:id/permissions', 
  authMiddleware.verifyToken, 
  authMiddleware.checkRole(['admin_master', 'admin_client']), 
  authController.updateUserPermissions
);

module.exports = router;
