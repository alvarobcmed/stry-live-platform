const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Controlador para gerenciar administração
const adminController = require('../controllers/adminController');

/**
 * @route   GET api/admin/users
 * @desc    Obter todos os usuários
 * @access  Private (Admin Master)
 */
router.get('/users', auth, adminController.getUsers);

/**
 * @route   GET api/admin/users/:id
 * @desc    Obter um usuário específico
 * @access  Private (Admin Master ou Admin Cliente para seus usuários)
 */
router.get('/users/:id', auth, adminController.getUser);

/**
 * @route   POST api/admin/users
 * @desc    Criar um novo usuário
 * @access  Private (Admin Master ou Admin Cliente)
 */
router.post('/users', auth, adminController.createUser);

/**
 * @route   PUT api/admin/users/:id
 * @desc    Atualizar um usuário
 * @access  Private (Admin Master ou Admin Cliente para seus usuários)
 */
router.put('/users/:id', auth, adminController.updateUser);

/**
 * @route   DELETE api/admin/users/:id
 * @desc    Excluir um usuário
 * @access  Private (Admin Master ou Admin Cliente para seus usuários)
 */
router.delete('/users/:id', auth, adminController.deleteUser);

/**
 * @route   GET api/admin/clients
 * @desc    Obter todos os clientes
 * @access  Private (Admin Master)
 */
router.get('/clients', auth, adminController.getClients);

/**
 * @route   GET api/admin/clients/:id
 * @desc    Obter um cliente específico
 * @access  Private (Admin Master ou Admin Cliente para seu próprio cliente)
 */
router.get('/clients/:id', auth, adminController.getClient);

/**
 * @route   POST api/admin/clients
 * @desc    Criar um novo cliente
 * @access  Private (Admin Master)
 */
router.post('/clients', auth, adminController.createClient);

/**
 * @route   PUT api/admin/clients/:id
 * @desc    Atualizar um cliente
 * @access  Private (Admin Master ou Admin Cliente para seu próprio cliente)
 */
router.put('/clients/:id', auth, adminController.updateClient);

/**
 * @route   DELETE api/admin/clients/:id
 * @desc    Excluir um cliente
 * @access  Private (Admin Master)
 */
router.delete('/clients/:id', auth, adminController.deleteClient);

/**
 * @route   GET api/admin/permissions
 * @desc    Obter todas as permissões
 * @access  Private (Admin Cliente ou Admin Master)
 */
router.get('/permissions', auth, adminController.getPermissions);

/**
 * @route   PUT api/admin/permissions/:userId
 * @desc    Atualizar permissões de um usuário
 * @access  Private (Admin Cliente para seus usuários ou Admin Master)
 */
router.put('/permissions/:userId', auth, adminController.updatePermissions);

/**
 * @route   GET api/admin/dashboard
 * @desc    Obter dados do dashboard administrativo
 * @access  Private (Admin Master)
 */
router.get('/dashboard', auth, adminController.getDashboard);

/**
 * @route   GET api/admin/audit-logs
 * @desc    Obter logs de auditoria
 * @access  Private (Admin Master)
 */
router.get('/audit-logs', auth, adminController.getAuditLogs);

module.exports = router;
