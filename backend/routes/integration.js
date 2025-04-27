const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Controlador para gerenciar integrações
const integrationController = require('../controllers/integrationController');

/**
 * @route   GET api/integration/tag-manager
 * @desc    Obter configurações do Tag Manager
 * @access  Private
 */
router.get('/tag-manager', auth, integrationController.getTagManagerConfig);

/**
 * @route   POST api/integration/tag-manager
 * @desc    Atualizar configurações do Tag Manager
 * @access  Private
 */
router.post('/tag-manager', auth, integrationController.updateTagManagerConfig);

/**
 * @route   GET api/integration/embed-code
 * @desc    Obter código de incorporação para o site do cliente
 * @access  Private
 */
router.get('/embed-code', auth, integrationController.getEmbedCode);

/**
 * @route   POST api/integration/embed-code/customize
 * @desc    Personalizar código de incorporação
 * @access  Private
 */
router.post('/embed-code/customize', auth, integrationController.customizeEmbedCode);

/**
 * @route   GET api/integration/sites
 * @desc    Obter sites integrados
 * @access  Private
 */
router.get('/sites', auth, integrationController.getIntegratedSites);

/**
 * @route   POST api/integration/sites
 * @desc    Adicionar novo site integrado
 * @access  Private
 */
router.post('/sites', auth, integrationController.addIntegratedSite);

/**
 * @route   PUT api/integration/sites/:id
 * @desc    Atualizar site integrado
 * @access  Private
 */
router.put('/sites/:id', auth, integrationController.updateIntegratedSite);

/**
 * @route   DELETE api/integration/sites/:id
 * @desc    Remover site integrado
 * @access  Private
 */
router.delete('/sites/:id', auth, integrationController.removeIntegratedSite);

/**
 * @route   GET api/integration/preview
 * @desc    Obter URL de preview da integração
 * @access  Private
 */
router.get('/preview', auth, integrationController.getPreviewUrl);

/**
 * @route   POST api/integration/test
 * @desc    Testar integração
 * @access  Private
 */
router.post('/test', auth, integrationController.testIntegration);

module.exports = router;
