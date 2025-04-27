const express = require('express');
const router = express.Router();
const liveController = require('../controllers/liveController');
const authMiddleware = require('../middleware/auth');

// Rotas públicas
router.get('/public', liveController.getPublicLives);
router.get('/public/:id', liveController.getPublicLiveById);

// Rotas protegidas - Acesso básico
router.get('/', 
  authMiddleware.verifyToken, 
  liveController.getAllLives
);

router.get('/:id', 
  authMiddleware.verifyToken, 
  liveController.getLiveById
);

// Rotas protegidas - Criação e gerenciamento
router.post('/', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('create_live'),
  liveController.createLive
);

router.put('/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('edit_live'),
  liveController.updateLive
);

router.delete('/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('delete_live'),
  liveController.deleteLive
);

// Rotas para controle de transmissão
router.post('/:id/start', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('manage_live'),
  liveController.startLive
);

router.post('/:id/stop', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('manage_live'),
  liveController.stopLive
);

// Rotas para RTMP
router.post('/rtmp/auth', liveController.authenticateRTMP);
router.post('/rtmp/publish', liveController.handleRTMPPublish);
router.post('/rtmp/play', liveController.handleRTMPPlay);
router.post('/rtmp/done', liveController.handleRTMPDone);

// Rotas para interações
router.post('/:id/view', liveController.recordView);
router.post('/:id/like', liveController.toggleLike);
router.post('/:id/comment', liveController.addComment);
router.delete('/:id/comment/:commentId', 
  authMiddleware.verifyToken,
  liveController.deleteComment
);

// Rotas para estatísticas
router.get('/:id/stats', 
  authMiddleware.verifyToken,
  liveController.getLiveStats
);

module.exports = router;
