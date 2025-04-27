const jsonServer = require('json-server');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Criar servidor Express
const app = express();

// Configurar CORS
app.use(cors());

// Configurar middleware para parsear JSON
app.use(express.json());

// Carregar dados do mock
const mockData = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock-db.json')));

// Criar servidor JSON
const router = jsonServer.router(path.join(__dirname, '../mock-db.json'));
const middlewares = jsonServer.defaults();

// Servir página de login estática
app.use(express.static(path.join(__dirname, 'public')));

// Adicionar middleware de autenticação simulada
app.use((req, res, next) => {
  // Simular autenticação com token no header
  const authHeader = req.headers.authorization;
  
  // Rotas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/index.html',
    '/login',
    '/api/auth/login',
    '/api/auth/register',
    '/api/stripe/plans',
    '/api/stripe/webhook',
    '/styles.css',
    '/script.js'
  ];
  
  if (publicRoutes.some(route => req.path.includes(route)) || req.method === 'OPTIONS') {
    return next();
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Token não fornecido' });
  }
  
  // Simular validação de token
  const token = authHeader.split(' ')[1];
  if (token !== 'mock-token-123') {
    return res.status(401).json({ msg: 'Token inválido' });
  }
  
  // Adicionar usuário ao request (simulado)
  req.user = mockData.users[0];
  next();
});

// Rota de login simulada
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ msg: 'Por favor, forneça email e senha' });
  }
  
  // Encontrar usuário pelo email
  const user = mockData.users.find(u => u.email === email);
  
  if (!user) {
    return res.status(400).json({ msg: 'Credenciais inválidas' });
  }
  
  // Simular validação de senha (em um ambiente real, usaríamos bcrypt)
  if (password !== 'senha123') {
    return res.status(400).json({ msg: 'Credenciais inválidas' });
  }
  
  // Retornar token e dados do usuário
  res.json({
    token: 'mock-token-123',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId
    }
  });
});

// Rota de registro simulada
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Por favor, forneça todos os campos obrigatórios' });
  }
  
  // Verificar se o email já está em uso
  const existingUser = mockData.users.find(u => u.email === email);
  
  if (existingUser) {
    return res.status(400).json({ msg: 'Email já está em uso' });
  }
  
  // Simular criação de usuário
  const newUser = {
    id: String(mockData.users.length + 1),
    name,
    email,
    role: 'admin_client',
    clientId: String(mockData.clients.length + 1)
  };
  
  // Retornar token e dados do usuário
  res.status(201).json({
    token: 'mock-token-123',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      clientId: newUser.clientId
    }
  });
});

// Rota para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Usar middlewares do json-server
app.use(middlewares);

// Redirecionar todas as rotas /api/* para o json-server
app.use('/api', router);

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor mock rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
