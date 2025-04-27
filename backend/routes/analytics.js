const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Controlador para gerenciar analytics
const analyticsController = require('../controllers/analyticsController');

/**
 * @route   GET api/analytics/overview
 * @desc    Obter visão geral das métricas
 * @access  Private
 */
router.get('/overview', auth, analyticsController.getOverview);

/**
 * @route   GET api/analytics/stories
 * @desc    Obter métricas de stories
 * @access  Private
 */
router.get('/stories', auth, analyticsController.getStoriesMetrics);

/**
 * @route   GET api/analytics/stories/:id
 * @desc    Obter métricas de um story específico
 * @access  Private
 */
router.get('/stories/:id', auth, analyticsController.getStoryMetrics);

/**
 * @route   GET api/analytics/lives
 * @desc    Obter métricas de lives
 * @access  Private
 */
router.get('/lives', auth, analyticsController.getLivesMetrics);

/**
 * @route   GET api/analytics/lives/:id
 * @desc    Obter métricas de uma live específica
 * @access  Private
 */
router.get('/lives/:id', auth, analyticsController.getLiveMetrics);

/**
 * @route   GET api/analytics/users
 * @desc    Obter métricas de usuários
 * @access  Private (Admin Cliente ou superior)
 */
router.get('/users', auth, analyticsController.getUsersMetrics);

/**
 * @route   GET api/analytics/engagement
 * @desc    Obter métricas de engajamento
 * @access  Private
 */
router.get('/engagement', auth, analyticsController.getEngagementMetrics);

/**
 * @route   GET api/analytics/export
 * @desc    Exportar dados de analytics
 * @access  Private (Admin Cliente ou superior)
 */
router.get('/export', auth, analyticsController.exportAnalytics);

/**
 * @route   POST api/analytics/event
 * @desc    Registrar evento de analytics
 * @access  Public
 */
router.post('/event', analyticsController.trackEvent);

module.exports = router;
