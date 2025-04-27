# Guia de Configuração de Serviços Externos para o Stry.live

Este guia fornece instruções detalhadas sobre como configurar todos os serviços externos necessários para o funcionamento completo do Stry.live.

## 1. Configuração do Stripe

O Stry.live utiliza o Stripe para processamento de pagamentos e gerenciamento de assinaturas.

### 1.1. Criar uma conta no Stripe

1. Acesse [stripe.com](https://stripe.com) e crie uma conta
2. Complete o processo de verificação da sua conta

### 1.2. Obter chaves API

1. No dashboard do Stripe, vá para "Desenvolvedores" > "Chaves API"
2. Você verá duas chaves: "Chave publicável" e "Chave secreta"
3. Copie ambas as chaves

### 1.3. Configurar Webhooks

1. No dashboard do Stripe, vá para "Desenvolvedores" > "Webhooks"
2. Clique em "Adicionar endpoint"
3. Insira a URL do seu webhook: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione os eventos a serem ouvidos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copie o "Segredo do webhook" gerado

### 1.4. Configurar produtos e preços

1. No dashboard do Stripe, vá para "Produtos"
2. Crie pelo menos dois produtos:
   - Plano Mensal
   - Plano Anual
3. Para cada produto, defina um preço recorrente
4. Anote os IDs dos produtos e preços

### 1.5. Configurar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publicavel
STRIPE_WEBHOOK_SECRET=whsec_seu_segredo_webhook
STRIPE_MONTHLY_PRODUCT_ID=prod_seu_id_produto_mensal
STRIPE_MONTHLY_PRICE_ID=price_seu_id_preco_mensal
STRIPE_ANNUAL_PRODUCT_ID=prod_seu_id_produto_anual
STRIPE_ANNUAL_PRICE_ID=price_seu_id_preco_anual
STRIPE_ACCOUNT_ID=acct_seu_id_conta
```

## 2. Configuração do Firebase

O Stry.live utiliza o Firebase para autenticação, armazenamento de dados e hospedagem.

### 2.1. Criar um projeto no Firebase

1. Acesse [firebase.google.com](https://firebase.google.com) e faça login com sua conta Google
2. Clique em "Adicionar projeto"
3. Dê um nome ao seu projeto (ex: "stry-live")
4. Siga as instruções para criar o projeto

### 2.2. Configurar o Authentication

1. No console do Firebase, vá para "Authentication" > "Sign-in method"
2. Habilite os métodos de login:
   - Email/Senha
   - Google (opcional)
   - Facebook (opcional)

### 2.3. Configurar o Firestore

1. No console do Firebase, vá para "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha o modo de inicialização (recomendado: modo de produção)
4. Escolha a localização do servidor
5. Crie as seguintes coleções:
   - `users`
   - `stories`
   - `subscriptions`
   - `analytics`

### 2.4. Criar uma conta de serviço

1. No console do Firebase, vá para "Configurações do projeto" > "Contas de serviço"
2. Clique em "Gerar nova chave privada"
3. Salve o arquivo JSON gerado como `firebase-service-account.json` na pasta `backend` do projeto

### 2.5. Obter configurações do Firebase

1. No console do Firebase, vá para "Configurações do projeto" > "Geral"
2. Role para baixo até "Seus aplicativos" e clique em "Web"
3. Registre um novo app web se necessário
4. Copie o objeto de configuração do Firebase

### 2.6. Configurar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```
FIREBASE_API_KEY=sua_api_key
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_id
FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
FIREBASE_APP_ID=seu_app_id
FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

## 3. Configuração do Google Tag Manager

O Stry.live utiliza o Google Tag Manager para integração com sites de clientes.

### 3.1. Criar uma conta no Google Tag Manager

1. Acesse [tagmanager.google.com](https://tagmanager.google.com) e faça login com sua conta Google
2. Clique em "Criar conta"
3. Preencha os detalhes da conta e do contêiner
4. Escolha "Web" como plataforma

### 3.2. Configurar tags personalizadas

1. No console do GTM, vá para "Tags" > "Nova"
2. Crie uma tag personalizada para o Stry.live
3. Configure a tag para carregar o script do Stry.live
4. Defina o gatilho para "All Pages"

### 3.3. Publicar o contêiner

1. Clique em "Enviar" no canto superior direito
2. Adicione uma descrição da versão
3. Clique em "Publicar"

### 3.4. Obter IDs do GTM

1. Copie o ID do contêiner (formato: GTM-XXXXXX)
2. Anote também o ID da conta do GTM

### 3.5. Configurar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```
GTM_CONTAINER_ID=GTM-XXXXXX
GTM_ACCOUNT_ID=seu_account_id
```

## 4. Configuração do Servidor RTMP para Lives

O Stry.live utiliza um servidor RTMP para transmissões ao vivo.

### 4.1. Opção 1: Configurar Nginx RTMP Module

#### Instalação

```bash
sudo apt update
sudo apt install build-essential libpcre3-dev libssl-dev nginx
git clone https://github.com/arut/nginx-rtmp-module.git
cd nginx-rtmp-module
sudo ./configure --with-http_ssl_module --add-module=../nginx-rtmp-module
sudo make
sudo make install
```

#### Configuração

Edite o arquivo de configuração do Nginx:

```bash
sudo nano /etc/nginx/nginx.conf
```

Adicione a configuração RTMP:

```
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;
            
            # Autenticação (opcional)
            on_publish http://localhost:3000/api/auth/stream;
            
            # HLS
            hls on;
            hls_path /var/www/html/hls;
            hls_fragment 3;
            hls_playlist_length 60;
        }
    }
}
```

Reinicie o Nginx:

```bash
sudo systemctl restart nginx
```

### 4.2. Opção 2: Usar um serviço de streaming

Alternativamente, você pode usar serviços como:

- [Wowza Streaming Engine](https://www.wowza.com/)
- [Amazon IVS](https://aws.amazon.com/ivs/)
- [Mux](https://mux.com/)

### 4.3. Configurar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```
RTMP_SERVER_URL=rtmp://seu-servidor-rtmp/live
RTMP_STREAM_KEY=sua_chave_stream
HLS_URL=https://seu-servidor-rtmp/hls
```

## 5. Configuração do Netlify para Deploy

### 5.1. Criar uma conta no Netlify

1. Acesse [netlify.com](https://netlify.com) e crie uma conta
2. Conecte sua conta do GitHub

### 5.2. Configurar um novo site

1. Clique em "New site from Git"
2. Selecione GitHub como provedor
3. Selecione o repositório "stry-live-platform"
4. Nas configurações de build:
   - Build command: `npm install && cp -r static-site/* public/`
   - Publish directory: `public`
5. Clique em "Deploy site"

### 5.3. Configurar variáveis de ambiente

No dashboard do Netlify, vá para "Site settings" > "Environment variables" e adicione todas as variáveis de ambiente mencionadas anteriormente.

### 5.4. Configurar domínio personalizado (opcional)

1. No dashboard do Netlify, vá para "Domain settings"
2. Clique em "Add custom domain"
3. Siga as instruções para configurar seu domínio personalizado

## 6. Testando a Configuração

Após configurar todos os serviços externos, você deve testar cada funcionalidade:

1. **Autenticação**: Teste o registro e login de usuários
2. **Stories**: Teste a criação, edição e visualização de stories
3. **Lives**: Teste a transmissão ao vivo usando o servidor RTMP
4. **Pagamentos**: Teste o fluxo de assinatura completo
5. **Integrações**: Teste a integração com sites de clientes via Google Tag Manager

## 7. Solução de Problemas Comuns

### 7.1. Problemas com o Stripe

- Verifique se as chaves API estão corretas
- Confirme que o webhook está configurado corretamente
- Verifique os logs de eventos no dashboard do Stripe

### 7.2. Problemas com o Firebase

- Verifique as regras de segurança do Firestore
- Confirme que o arquivo de conta de serviço está correto
- Verifique as configurações de autenticação

### 7.3. Problemas com o servidor RTMP

- Verifique se o servidor RTMP está rodando
- Confirme que as portas necessárias estão abertas
- Verifique os logs do Nginx para erros

## 8. Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Documentação do Firebase](https://firebase.google.com/docs)
- [Documentação do Google Tag Manager](https://developers.google.com/tag-manager)
- [Documentação do Nginx RTMP Module](https://github.com/arut/nginx-rtmp-module)
- [Documentação do Netlify](https://docs.netlify.com)
