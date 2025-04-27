const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const auth = require('../middleware/auth');

// Controlador para gerenciar notificações
const notificationsController = require('../controllers/notificationsController');

/**
 * @route   POST api/notifications/register
 * @desc    Registrar um dispositivo para receber notificações push
 * @access  Private
 */
router.post('/register', auth, notificationsController.registerDevice);

/**
 * @route   POST api/notifications/send
 * @desc    Enviar notificação para um usuário específico
 * @access  Private
 */
router.post('/send', auth, notificationsController.sendNotification);

/**
 * @route   POST api/notifications/broadcast
 * @desc    Enviar notificação para todos os usuários de um cliente
 * @access  Private (Admin Cliente ou superior)
 */
router.post('/broadcast', auth, notificationsController.broadcastNotification);

/**
 * @route   GET api/notifications
 * @desc    Obter todas as notificações do usuário
 * @access  Private
 */
router.get('/', auth, notificationsController.getUserNotifications);

/**
 * @route   PUT api/notifications/:id
 * @desc    Marcar notificação como lida
 * @access  Private
 */
router.put('/:id', auth, notificationsController.markAsRead);

/**
 * @route   DELETE api/notifications/:id
 * @desc    Excluir uma notificação
 * @access  Private
 */
router.delete('/:id', auth, notificationsController.deleteNotification);

/**
 * @route   GET api/notifications/settings
 * @desc    Obter configurações de notificação do usuário
 * @access  Private
 */
router.get('/settings', auth, notificationsController.getNotificationSettings);

/**
 * @route   PUT api/notifications/settings
 * @desc    Atualizar configurações de notificação do usuário
 * @access  Private
 */
router.put('/settings', auth, notificationsController.updateNotificationSettings);

module.exports = router;
