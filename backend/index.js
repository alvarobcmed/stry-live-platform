require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importar rotas
const authRoutes = require('./routes/auth');
const storiesRoutes = require('./routes/stories');
const stripeRoutes = require('./routes/stripe');
const notificationsRoutes = require('./routes/notifications');
const livesRoutes = require('./routes/lives');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const integrationRoutes = require('./routes/integration');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/lives', livesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integration', integrationRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('API do Stry.live está funcionando!');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
