# Backend API para o Stry.live

Este diretório contém a implementação do backend API para o Stry.live, fornecendo suporte para todas as funcionalidades do sistema.

## Estrutura de Diretórios

```
backend/
├── config/           # Configurações do servidor e conexões
├── controllers/      # Controladores para cada rota
├── middleware/       # Middleware para autenticação e validação
├── models/           # Modelos de dados
├── routes/           # Definição de rotas
├── services/         # Serviços para lógica de negócios
├── utils/            # Utilitários e funções auxiliares
├── .env              # Variáveis de ambiente
├── index.js          # Ponto de entrada da aplicação
└── package.json      # Dependências e scripts
```

## Tecnologias Utilizadas

- Node.js
- Express
- Firebase Admin (Autenticação e Firestore)
- Stripe (Pagamentos)
- Socket.io (Notificações em tempo real)
- JWT (Autenticação)
- Multer (Upload de arquivos)

## Funcionalidades Implementadas

- Autenticação e gerenciamento de usuários
- CRUD completo para stories
- Integração com Stripe para assinaturas
- Sistema de notificações push
- API para transmissões ao vivo (RTMP)
- Métricas e analytics
- Sistema de permissões multinível
- Integração com sites externos via Google Tag Manager
