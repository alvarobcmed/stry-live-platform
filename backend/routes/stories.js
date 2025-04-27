const express = require('express');
const router = express.Router();
const storiesController = require('../controllers/storiesController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/stories'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limite
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens e vídeos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens e vídeos são permitidos!'), false);
    }
  }
});

// Rotas públicas
router.get('/public', storiesController.getPublicStories);
router.get('/public/:id', storiesController.getPublicStoryById);

// Rotas protegidas - Acesso básico
router.get('/', 
  authMiddleware.verifyToken, 
  storiesController.getAllStories
);

router.get('/:id', 
  authMiddleware.verifyToken, 
  storiesController.getStoryById
);

// Rotas protegidas - Criação e edição
router.post('/', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('create_story'),
  upload.fields([
    { name: 'media', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  storiesController.createStory
);

router.put('/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('edit_story'),
  upload.fields([
    { name: 'media', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  storiesController.updateStory
);

router.delete('/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('delete_story'),
  storiesController.deleteStory
);

// Rotas para gerenciamento de mídia
router.post('/:id/media', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('edit_story'),
  upload.single('media'),
  storiesController.addMediaToStory
);

router.delete('/:id/media/:mediaId', 
  authMiddleware.verifyToken, 
  authMiddleware.checkPermission('edit_story'),
  storiesController.removeMediaFromStory
);

// Rotas para interações
router.post('/:id/view', storiesController.recordView);
router.post('/:id/like', storiesController.toggleLike);
router.post('/:id/comment', storiesController.addComment);
router.delete('/:id/comment/:commentId', 
  authMiddleware.verifyToken,
  storiesController.deleteComment
);

// Rotas para estatísticas
router.get('/:id/stats', 
  authMiddleware.verifyToken,
  storiesController.getStoryStats
);

// Rotas para compartilhamento
router.get('/:id/share', storiesController.getShareLink);

module.exports = router;
