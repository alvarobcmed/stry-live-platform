# Guia de Teste - Stry.live

## Sumário

1. [Introdução](#introdução)
2. [Ambiente de Teste](#ambiente-de-teste)
3. [Testes de Autenticação](#testes-de-autenticação)
4. [Testes do Sistema de Stories](#testes-do-sistema-de-stories)
5. [Testes do Sistema de Lives](#testes-do-sistema-de-lives)
6. [Testes de Notificações Push](#testes-de-notificações-push)
7. [Testes de Integração com Google Tag Manager](#testes-de-integração-com-google-tag-manager)
8. [Testes do Sistema de Assinaturas](#testes-do-sistema-de-assinaturas)
9. [Testes do Painel de Administração](#testes-do-painel-de-administração)
10. [Testes de Analytics](#testes-de-analytics)
11. [Testes de Performance](#testes-de-performance)
12. [Testes de Segurança](#testes-de-segurança)
13. [Relatório de Bugs](#relatório-de-bugs)

## Introdução

Este guia de teste fornece instruções detalhadas para testar todas as funcionalidades do Stry.live. O objetivo é garantir que todas as funcionalidades estejam operando corretamente antes da implantação em produção.

Os testes são organizados por funcionalidade e incluem:
- Pré-requisitos para cada teste
- Passos detalhados para execução
- Resultados esperados
- Critérios de sucesso
- Procedimentos para relatório de bugs

## Ambiente de Teste

### Acessando o Ambiente de Teste

1. Acesse o ambiente de teste em: [https://test.stry.live](https://test.stry.live)
2. Utilize as seguintes credenciais para login:
   - **Admin Master**: 
     - Email: admin@stry.live
     - Senha: Test@123
   - **Admin Cliente**: 
     - Email: cliente@stry.live
     - Senha: Test@123
   - **Admin Usuário**: 
     - Email: usuario@stry.live
     - Senha: Test@123
   - **Usuário Regular**: 
     - Email: regular@stry.live
     - Senha: Test@123

### Configuração do Ambiente

O ambiente de teste inclui:
- Banco de dados pré-populado com dados de exemplo
- Integração com sandbox do Stripe para testes de pagamento
- Servidor RTMP de teste para transmissões ao vivo
- Site de exemplo para testar a integração com Google Tag Manager

### Ferramentas Necessárias

Para realizar todos os testes, você precisará de:
- Navegador web atualizado (Chrome, Firefox, Safari ou Edge)
- Software de streaming (OBS Studio, Streamlabs ou similar) para testes de lives
- Dispositivo móvel para testes de responsividade e notificações push
- Conta de teste no Google Tag Manager para testes de integração

## Testes de Autenticação

### Teste de Registro de Usuário

**Pré-requisitos:**
- Acesso ao ambiente de teste
- Email válido não registrado anteriormente

**Passos:**
1. Acesse a página inicial do Stry.live
2. Clique no botão "Criar Conta"
3. Preencha o formulário com:
   - Nome completo
   - Email válido
   - Senha (mínimo 8 caracteres)
4. Aceite os termos de serviço
5. Clique em "Registrar"
6. Verifique seu email e clique no link de confirmação

**Resultado esperado:**
- Você deve ser redirecionado para a página de seleção de planos
- Deve receber um email de confirmação
- Após confirmar o email, deve conseguir fazer login

### Teste de Login

**Pré-requisitos:**
- Conta já registrada no sistema

**Passos:**
1. Acesse a página inicial do Stry.live
2. Clique no botão "Entrar"
3. Insira seu email e senha
4. Clique em "Entrar"

**Resultado esperado:**
- Você deve ser redirecionado para o Dashboard
- Seu nome deve aparecer no canto superior direito
- O menu lateral deve mostrar as opções disponíveis para seu nível de acesso

### Teste de Recuperação de Senha

**Pré-requisitos:**
- Conta já registrada no sistema

**Passos:**
1. Acesse a página inicial do Stry.live
2. Clique no botão "Entrar"
3. Clique em "Esqueceu sua senha?"
4. Insira o email associado à sua conta
5. Clique em "Enviar link de recuperação"
6. Verifique seu email e clique no link de recuperação
7. Insira uma nova senha
8. Clique em "Redefinir senha"

**Resultado esperado:**
- Você deve receber um email com link de recuperação
- Após redefinir a senha, deve conseguir fazer login com a nova senha
- A senha antiga não deve mais funcionar

### Teste de Logout

**Pré-requisitos:**
- Estar logado no sistema

**Passos:**
1. Clique no seu nome no canto superior direito
2. Selecione "Sair" no menu dropdown

**Resultado esperado:**
- Você deve ser redirecionado para a página inicial
- Ao tentar acessar páginas protegidas, deve ser redirecionado para o login

## Testes do Sistema de Stories

### Teste de Criação de Story

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter imagens e vídeos disponíveis para upload

**Passos:**
1. No Dashboard, clique em "Stories" no menu lateral
2. Clique no botão "+ Novo Story"
3. Preencha o título e descrição
4. Adicione tags relevantes
5. Clique em "Criar" para ir ao editor
6. Adicione um slide de imagem:
   - Clique em "Adicionar Slide"
   - Selecione "Imagem"
   - Faça upload de uma imagem
   - Adicione texto de sobreposição
7. Adicione um slide de vídeo:
   - Clique em "Adicionar Slide"
   - Selecione "Vídeo"
   - Faça upload de um vídeo curto
8. Adicione um slide de texto:
   - Clique em "Adicionar Slide"
   - Selecione "Texto"
   - Digite o conteúdo desejado
   - Formate o texto (negrito, itálico, etc.)
9. Reordene os slides arrastando-os na barra lateral
10. Clique em "Visualizar" para ver o preview
11. Clique em "Salvar" para salvar como rascunho
12. Clique em "Publicar" para publicar o story

**Resultado esperado:**
- O story deve ser criado e aparecer na lista de stories
- Todos os slides devem ser exibidos corretamente na visualização
- O story publicado deve estar disponível para visualização
- As estatísticas iniciais devem mostrar zero visualizações

### Teste de Edição de Story

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter pelo menos um story criado

**Passos:**
1. No Dashboard, clique em "Stories" no menu lateral
2. Localize o story que deseja editar
3. Clique no ícone de lápis (editar)
4. Modifique o título e descrição
5. Adicione ou remova tags
6. Edite os slides existentes:
   - Altere textos
   - Substitua imagens ou vídeos
   - Ajuste formatação
7. Adicione novos slides
8. Remova slides existentes
9. Reordene os slides
10. Clique em "Salvar" para salvar as alterações
11. Clique em "Publicar" para republicar o story

**Resultado esperado:**
- As alterações devem ser salvas corretamente
- O story editado deve refletir todas as modificações
- A data de atualização deve ser atualizada
- O story republicado deve estar disponível com as novas alterações

### Teste de Exclusão de Story

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter pelo menos um story criado

**Passos:**
1. No Dashboard, clique em "Stories" no menu lateral
2. Localize o story que deseja excluir
3. Clique no ícone de lixeira (excluir)
4. Confirme a exclusão na caixa de diálogo

**Resultado esperado:**
- O story deve ser removido da lista
- Ao tentar acessar o URL direto do story, deve receber uma mensagem de "não encontrado"
- As estatísticas associadas ao story devem ser mantidas para referência histórica

### Teste de Visualização de Story

**Pré-requisitos:**
- Ter pelo menos um story publicado
- Pode ser testado como usuário logado ou não logado

**Passos:**
1. Acesse a página de stories públicos ou use o link direto para um story
2. Observe o carregamento do primeiro slide
3. Navegue entre os slides:
   - Clique na borda direita para avançar
   - Clique na borda esquerda para retroceder
   - Aguarde o avanço automático baseado na duração configurada
4. Interaja com os elementos:
   - Clique em links
   - Dê like no story
   - Adicione comentários (se habilitado)
   - Compartilhe o story (se habilitado)
5. Feche o visualizador clicando no X ou pressionando ESC

**Resultado esperado:**
- O story deve carregar rapidamente
- A navegação entre slides deve ser suave
- O avanço automático deve respeitar a duração configurada
- As interações (likes, comentários, compartilhamentos) devem funcionar corretamente
- As estatísticas de visualização devem ser incrementadas

## Testes do Sistema de Lives

### Teste de Configuração de Live

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter software de streaming instalado (OBS Studio, Streamlabs, etc.)

**Passos:**
1. No Dashboard, clique em "Lives" no menu lateral
2. Clique no botão "+ Nova Live"
3. Preencha os campos:
   - Título da transmissão
   - Descrição
   - Data e hora programada (opcional)
   - Duração estimada
   - Visibilidade (pública ou privada)
4. Clique em "Criar"
5. Na página da live, observe a URL RTMP e a Chave de Stream
6. Copie essas informações para seu software de streaming:
   - Abra o OBS Studio ou software similar
   - Nas configurações de transmissão, selecione "Serviço Personalizado"
   - Cole a URL RTMP no campo de servidor
   - Cole a Chave de Stream no campo correspondente
7. Configure as fontes de áudio e vídeo no software
8. Não inicie a transmissão ainda

**Resultado esperado:**
- A live deve ser criada com status "agendada" ou "não iniciada"
- A URL RTMP e a Chave de Stream devem ser geradas corretamente
- A página da live deve mostrar a área de pré-visualização vazia
- O software de streaming deve aceitar as configurações sem erros

### Teste de Transmissão via Software Externo

**Pré-requisitos:**
- Ter completado o teste de configuração de live
- Software de streaming configurado com URL RTMP e Chave de Stream

**Passos:**
1. Na página da live no Stry.live, verifique se está tudo pronto
2. No seu software de streaming, inicie a transmissão
3. Observe a página da live no Stry.live
4. Verifique se o vídeo aparece na pré-visualização
5. Teste diferentes configurações de câmera e microfone
6. Transmita por pelo menos 5 minutos
7. No software de streaming, encerre a transmissão

**Resultado esperado:**
- O vídeo deve aparecer na pré-visualização após alguns segundos
- O status da live deve mudar para "ao vivo"
- A qualidade do vídeo deve ser boa e sem travamentos
- Ao encerrar a transmissão, o status deve mudar para "encerrada"
- Deve ser gerado um resumo da transmissão com estatísticas

### Teste de Transmissão via Navegador

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter uma webcam e microfone conectados ao computador
- Usar um navegador que suporte WebRTC (Chrome, Firefox, etc.)

**Passos:**
1. No Dashboard, clique em "Lives" no menu lateral
2. Clique no botão "+ Nova Live"
3. Preencha os campos necessários
4. Clique em "Criar"
5. Na página da live, clique em "Transmitir pelo Navegador"
6. Conceda permissão para uso da câmera e microfone
7. Ajuste as configurações:
   - Selecione a câmera e microfone desejados
   - Ajuste a qualidade da transmissão
8. Clique em "Iniciar Transmissão"
9. Transmita por pelo menos 5 minutos
10. Clique em "Encerrar Transmissão"

**Resultado esperado:**
- O navegador deve solicitar permissão para câmera e microfone
- A pré-visualização deve mostrar o vídeo da câmera
- Ao iniciar a transmissão, o status deve mudar para "ao vivo"
- A transmissão deve funcionar sem travamentos
- Ao encerrar, o status deve mudar para "encerrada"
- Deve ser gerado um resumo da transmissão com estatísticas

### Teste de Visualização de Live

**Pré-requisitos:**
- Ter uma transmissão ao vivo ativa
- Pode ser testado como usuário logado ou não logado

**Passos:**
1. Acesse a página de lives públicas ou use o link direto para uma live ativa
2. Observe o carregamento do player de vídeo
3. Verifique se o vídeo e áudio estão funcionando
4. Teste os controles do player:
   - Play/Pause
   - Volume
   - Tela cheia
5. Se disponível, teste o chat ao vivo:
   - Envie mensagens
   - Veja mensagens de outros usuários
6. Assista por pelo menos 5 minutos
7. Feche a página ou navegue para outra seção

**Resultado esperado:**
- O player deve carregar rapidamente
- O vídeo e áudio devem ser sincronizados e sem travamentos
- Os controles do player devem funcionar corretamente
- O chat ao vivo deve mostrar mensagens em tempo real
- As estatísticas de visualização devem ser incrementadas

## Testes de Notificações Push

### Teste de Configuração de Notificações

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Usar um navegador que suporte notificações push (Chrome, Firefox, etc.)

**Passos:**
1. No Dashboard, clique em "Notificações" no menu lateral
2. Na aba "Configurações", ative a opção "Notificações Push"
3. Personalize as configurações:
   - Faça upload de um ícone personalizado
   - Escolha as cores para notificações
   - Selecione um som de alerta
4. Clique em "Salvar Configurações"
5. Na primeira vez, o navegador solicitará permissão para enviar notificações
6. Conceda a permissão quando solicitado

**Resultado esperado:**
- As configurações devem ser salvas corretamente
- O navegador deve solicitar permissão para notificações
- Após conceder permissão, o dispositivo deve aparecer na lista de dispositivos registrados
- O status deve mostrar "Notificações ativadas"

### Teste de Envio de Notificação

**Pré-requisitos:**
- Ter completado o teste de configuração de notificações
- Estar logado como Admin Cliente ou Admin Usuário com permissão

**Passos:**
1. No Dashboard, clique em "Notificações" no menu lateral
2. Clique no botão "+ Nova Notificação"
3. Preencha os campos:
   - Título da notificação
   - Mensagem
   - Faça upload de uma imagem (opcional)
   - URL de destino
4. Escolha o público-alvo:
   - Todos os usuários
   - Segmentos específicos
   - Usuários individuais
5. Escolha enviar imediatamente
6. Clique em "Enviar"
7. Minimize o navegador ou mude para outra aba

**Resultado esperado:**
- A notificação deve ser criada e enviada
- Você deve receber a notificação push no seu dispositivo
- A notificação deve mostrar o título, mensagem e imagem configurados
- Ao clicar na notificação, deve ser redirecionado para a URL de destino
- A notificação deve aparecer no histórico de notificações enviadas

### Teste de Automação de Notificações

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter configurado as notificações push

**Passos:**
1. No Dashboard, clique em "Notificações" no menu lateral
2. Na aba "Automações", clique em "+ Nova Automação"
3. Selecione o evento gatilho:
   - Novo story publicado
   - Nova live iniciada
4. Configure a mensagem:
   - Título: "Novo {{tipo}} disponível"
   - Mensagem: "Confira o novo {{tipo}} '{{título}}' agora!"
5. Configure as opções de envio:
   - Todos os usuários
   - Envio imediato
6. Ative a automação
7. Crie um novo story ou inicie uma nova live
8. Minimize o navegador ou mude para outra aba

**Resultado esperado:**
- A automação deve ser criada e ativada
- Ao publicar um story ou iniciar uma live, a notificação deve ser enviada automaticamente
- A notificação deve conter o título e mensagem configurados, com as variáveis substituídas
- Ao clicar na notificação, deve ser redirecionado para o story ou live correspondente
- A notificação deve aparecer no histórico de notificações enviadas

## Testes de Integração com Google Tag Manager

### Teste de Configuração de Integração

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter acesso a uma conta do Google Tag Manager
- Ter pelo menos um story publicado

**Passos:**
1. No Dashboard, clique em "Integrações" no menu lateral
2. Clique em "+ Nova Integração"
3. Preencha os campos:
   - Nome do Site: "Site de Teste"
   - URL do Site: URL do site onde será testado
   - ID do Google Tag Manager: Seu ID GTM (formato GTM-XXXXXX)
4. Clique em "Criar Integração"
5. Na página da integração, copie o código de snippet fornecido
6. Acesse sua conta do Google Tag Manager
7. Crie uma nova tag:
   - Tipo: HTML personalizado
   - Cole o código copiado
   - Gatilho: Todas as páginas
8. Publique as alterações no GTM

**Resultado esperado:**
- A integração deve ser criada com sucesso
- O código de snippet deve ser gerado corretamente
- A tag deve ser criada no Google Tag Manager sem erros
- O status da integração deve mostrar "Pendente" até que seja testada

### Teste de Personalização da Aparência

**Pré-requisitos:**
- Ter completado o teste de configuração de integração
- Estar logado como Admin Cliente ou Admin Usuário com permissão

**Passos:**
1. No Dashboard, clique em "Integrações" no menu lateral
2. Selecione a integração criada anteriormente
3. Na aba "Aparência", personalize:
   - Posição: Escolha diferentes posições (canto superior direito, inferior esquerdo, etc.)
   - Tema: Alterne entre temas claro, escuro e personalizado
   - Cores: Personalize as cores do player
   - Tamanho: Ajuste o tamanho do ícone e do player
   - Animações: Ative ou desative efeitos de animação
4. Clique em "Salvar" após cada alteração
5. Use o botão "Visualizar" para ver como ficará no site

**Resultado esperado:**
- As alterações de aparência devem ser salvas corretamente
- A visualização deve mostrar as alterações em tempo real
- As diferentes posições, temas e cores devem ser aplicadas corretamente
- O tamanho e as animações devem funcionar conforme configurado

### Teste de Integração em Site Real

**Pré-requisitos:**
- Ter completado os testes de configuração e personalização
- Ter acesso a um site com o Google Tag Manager implementado
- Ter publicado as alterações no Google Tag Manager

**Passos:**
1. Acesse o site onde a integração foi configurada
2. Verifique se o ícone de stories aparece na posição configurada
3. Clique no ícone para abrir o player de stories
4. Navegue pelos stories disponíveis
5. Teste as interações:
   - Navegação entre slides
   - Likes (se habilitado)
   - Comentários (se habilitado)
   - Compartilhamento (se habilitado)
6. Feche o player e reabra
7. Teste em diferentes dispositivos:
   - Desktop
   - Tablet
   - Smartphone

**Resultado esperado:**
- O ícone deve aparecer na posição configurada
- O player deve abrir suavemente ao clicar no ícone
- Os stories devem ser exibidos corretamente
- A navegação e interações devem funcionar conforme configurado
- O player deve ser responsivo e funcionar bem em diferentes dispositivos
- As estatísticas de visualização devem ser registradas

### Teste de Verificação de Integração

**Pré-requisitos:**
- Ter completado o teste de integração em site real
- Estar logado como Admin Cliente ou Admin Usuário com permissão

**Passos:**
1. No Dashboard, clique em "Integrações" no menu lateral
2. Selecione a integração criada anteriormente
3. Clique em "Testar Integração"
4. Insira a URL da página onde a integração foi implementada
5. Clique em "Verificar"
6. Aguarde a verificação ser concluída

**Resultado esperado:**
- O sistema deve verificar se o código está instalado corretamente
- Deve mostrar um status "Integração verificada com sucesso"
- Deve exibir uma prévia de como os stories aparecem no site
- O status da integração deve mudar para "Ativa"
- Deve começar a mostrar estatísticas de visualização para esta integração

## Testes do Sistema de Assinaturas

### Teste de Seleção de Plano

**Pré-requisitos:**
- Estar logado como usuário sem assinatura ativa
- Ter um cartão de teste do Stripe disponível

**Passos:**
1. No Dashboard, clique em "Assinatura" no menu lateral
2. Observe os planos disponíveis
3. Compare as funcionalidades de cada plano
4. Selecione o plano "Profissional"
5. Clique em "Assinar"
6. Você será redirecionado para o Stripe Checkout
7. Não complete o pagamento ainda

**Resultado esperado:**
- Os planos devem ser exibidos com preços e funcionalidades
- Ao selecionar um plano, deve mostrar um resumo da seleção
- Ao clicar em "Assinar", deve redirecionar para o Stripe Checkout
- O Stripe Checkout deve mostrar o plano selecionado com o preço correto

### Teste de Checkout com Stripe

**Pré-requisitos:**
- Ter completado o teste de seleção de plano
- Estar na página do Stripe Checkout

**Passos:**
1. Na página do Stripe Checkout, insira os dados do cartão de teste:
   - Número: 4242 4242 4242 4242
   - Data: Qualquer data futura
   - CVC: Qualquer 3 dígitos
   - Nome: Seu nome
   - Endereço: Qualquer endereço válido
2. Clique em "Pagar"
3. Aguarde o processamento
4. Você será redirecionado de volta para o Stry.live

**Resultado esperado:**
- O pagamento deve ser processado com sucesso
- Você deve ser redirecionado para a página de sucesso
- O status da sua assinatura deve mudar para "Ativa"
- Você deve ter acesso às funcionalidades do plano Profissional
- Deve receber um email de confirmação da assinatura

### Teste de Gerenciamento de Assinatura

**Pré-requisitos:**
- Ter uma assinatura ativa
- Estar logado como Admin Cliente

**Passos:**
1. No Dashboard, clique em "Assinatura" no menu lateral
2. Observe os detalhes da sua assinatura:
   - Plano atual
   - Status
   - Data de renovação
   - Histórico de pagamentos
3. Clique em "Alterar Plano"
4. Selecione o plano "Empresarial"
5. Confirme a alteração
6. Volte para a página de assinatura
7. Clique em "Gerenciar Métodos de Pagamento"
8. Adicione um novo cartão de teste:
   - Número: 5555 5555 5555 4444
   - Data: Qualquer data futura
   - CVC: Qualquer 3 dígitos
9. Defina o novo cartão como padrão
10. Volte para a página de assinatura

**Resultado esperado:**
- Os detalhes da assinatura devem ser exibidos corretamente
- A alteração de plano deve ser processada com sucesso
- O novo plano deve ser refletido na página de assinatura
- O novo cartão deve ser adicionado com sucesso
- O cartão padrão deve ser atualizado
- Deve receber um email de confirmação das alterações

### Teste de Cancelamento de Assinatura

**Pré-requisitos:**
- Ter uma assinatura ativa
- Estar logado como Admin Cliente

**Passos:**
1. No Dashboard, clique em "Assinatura" no menu lateral
2. Clique em "Cancelar Assinatura"
3. Selecione um motivo para o cancelamento
4. Forneça feedback adicional no campo de texto
5. Clique em "Confirmar Cancelamento"
6. Observe a página de assinatura atualizada

**Resultado esperado:**
- Deve aparecer uma confirmação antes do cancelamento
- Após confirmar, o status deve mudar para "Cancelada - Ativa até o final do período"
- A data de término da assinatura deve ser exibida
- Você deve manter acesso às funcionalidades até o final do período pago
- Deve receber um email confirmando o cancelamento

## Testes do Painel de Administração

### Teste de Admin Master

**Pré-requisitos:**
- Estar logado como Admin Master (admin@stry.live)

**Passos:**
1. No Dashboard, clique em "Administração" no menu lateral
2. Selecione "Painel Admin Master"
3. Teste as seguintes funcionalidades:
   - Visualizar lista de todos os clientes
   - Criar um novo cliente
   - Editar um cliente existente
   - Visualizar assinaturas de clientes
   - Modificar status de assinaturas
   - Acessar métricas globais do sistema
   - Configurar planos e preços
4. Crie um novo cliente:
   - Nome: "Cliente Teste"
   - Email: "cliente.teste@example.com"
   - Plano: "Básico"
5. Crie um usuário administrador para o novo cliente:
   - Nome: "Admin Teste"
   - Email: "admin.teste@example.com"
   - Nível: "Admin Cliente"

**Resultado esperado:**
- Todas as funcionalidades do Admin Master devem estar acessíveis
- Deve conseguir criar, editar e gerenciar clientes
- Deve conseguir visualizar e modificar assinaturas
- Deve conseguir acessar métricas globais
- O novo cliente e usuário administrador devem ser criados com sucesso

### Teste de Admin Cliente

**Pré-requisitos:**
- Estar logado como Admin Cliente (cliente@stry.live ou o usuário criado no teste anterior)

**Passos:**
1. No Dashboard, clique em "Administração" no menu lateral
2. Selecione "Gerenciar Usuários"
3. Teste as seguintes funcionalidades:
   - Visualizar lista de usuários da sua organização
   - Criar um novo usuário
   - Editar um usuário existente
   - Definir permissões para usuários
4. Crie um novo usuário:
   - Nome: "Usuário Teste"
   - Email: "usuario.teste@example.com"
   - Cargo: "Editor"
   - Nível de acesso: "Admin Usuário"
5. Configure as permissões:
   - Criar/editar stories: Sim
   - Gerenciar lives: Sim
   - Enviar notificações: Não
   - Acessar analytics: Sim
   - Gerenciar integrações: Não

**Resultado esperado:**
- Todas as funcionalidades do Admin Cliente devem estar acessíveis
- Deve conseguir gerenciar usuários da sua organização
- Deve conseguir definir permissões granulares
- O novo usuário deve ser criado com as permissões configuradas
- O usuário deve receber um email com instruções para definir sua senha

### Teste de Admin Usuário

**Pré-requisitos:**
- Estar logado como Admin Usuário (usuario@stry.live ou o usuário criado no teste anterior)

**Passos:**
1. Explore o Dashboard e verifique as funcionalidades disponíveis
2. Tente acessar as seguintes áreas:
   - Stories (deve ter acesso se permitido)
   - Lives (deve ter acesso se permitido)
   - Notificações (deve ter acesso se permitido)
   - Analytics (deve ter acesso se permitido)
   - Integrações (deve ter acesso se permitido)
3. Tente criar um novo story (se tiver permissão)
4. Tente criar uma nova live (se tiver permissão)
5. Tente enviar uma notificação (se tiver permissão)
6. Tente acessar analytics (se tiver permissão)
7. Tente criar uma integração (se tiver permissão)

**Resultado esperado:**
- Deve ter acesso apenas às funcionalidades permitidas pelo Admin Cliente
- Deve conseguir criar/editar stories se tiver permissão
- Deve conseguir gerenciar lives se tiver permissão
- Deve conseguir enviar notificações se tiver permissão
- Deve conseguir acessar analytics se tiver permissão
- Deve conseguir gerenciar integrações se tiver permissão
- Deve receber mensagem de "Acesso negado" ao tentar acessar áreas não permitidas

## Testes de Analytics

### Teste de Visão Geral de Analytics

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter stories e lives publicados com algumas visualizações

**Passos:**
1. No Dashboard, clique em "Analytics" no menu lateral
2. Na página inicial de analytics, observe:
   - Visualizações totais
   - Engajamento (likes, comentários, compartilhamentos)
   - Tempo médio de visualização
   - Taxa de conclusão
3. Ajuste o período de análise:
   - Últimos 7 dias
   - Últimos 30 dias
   - Último trimestre
   - Personalizado (selecione datas específicas)
4. Observe como os dados mudam conforme o período selecionado

**Resultado esperado:**
- Os dados de analytics devem ser carregados corretamente
- Os gráficos e métricas devem refletir as visualizações e interações reais
- A alteração do período deve atualizar os dados exibidos
- Deve ser possível identificar tendências e padrões nos dados

### Teste de Analytics de Stories

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter stories publicados com algumas visualizações

**Passos:**
1. No Dashboard, clique em "Analytics" no menu lateral
2. Selecione a aba "Stories"
3. Observe:
   - Desempenho por story
   - Desempenho por slide
   - Gráfico de retenção
   - Interações (likes, comentários, cliques)
4. Selecione um story específico para análise detalhada
5. Observe a análise slide por slide
6. Verifique o funil de visualização (quantos usuários viram cada slide)

**Resultado esperado:**
- Os dados de analytics de stories devem ser carregados corretamente
- Deve mostrar quais stories têm melhor desempenho
- Deve mostrar em quais slides os usuários abandonam a visualização
- Deve mostrar quais slides geram mais engajamento
- A análise detalhada deve fornecer insights úteis sobre o desempenho do story

### Teste de Analytics de Lives

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter realizado transmissões ao vivo com algumas visualizações

**Passos:**
1. No Dashboard, clique em "Analytics" no menu lateral
2. Selecione a aba "Lives"
3. Observe:
   - Número total de espectadores por transmissão
   - Pico de espectadores
   - Tempo médio de visualização
   - Gráfico de retenção
   - Interações durante a live
4. Selecione uma transmissão específica para análise detalhada
5. Observe o gráfico de espectadores ao longo do tempo
6. Verifique os momentos de maior e menor audiência

**Resultado esperado:**
- Os dados de analytics de lives devem ser carregados corretamente
- Deve mostrar quais transmissões tiveram melhor desempenho
- Deve mostrar quando os espectadores entraram e saíram da transmissão
- Deve mostrar quais momentos geraram mais engajamento
- A análise detalhada deve fornecer insights úteis sobre o desempenho da transmissão

### Teste de Exportação de Dados

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão
- Ter dados de analytics disponíveis

**Passos:**
1. No Dashboard, clique em "Analytics" no menu lateral
2. Em qualquer página de analytics, clique em "Exportar"
3. Selecione o formato desejado:
   - CSV
   - Excel
   - PDF
4. Escolha as métricas a serem incluídas
5. Defina o período dos dados
6. Clique em "Exportar"
7. Abra o arquivo exportado e verifique os dados

**Resultado esperado:**
- O arquivo deve ser gerado e baixado corretamente
- O formato do arquivo deve corresponder ao selecionado
- Os dados no arquivo devem corresponder aos exibidos na interface
- Todas as métricas selecionadas devem estar incluídas
- O período dos dados deve corresponder ao definido

## Testes de Performance

### Teste de Carregamento de Página

**Pré-requisitos:**
- Acesso ao ambiente de teste
- Ferramenta de desenvolvedor do navegador (Chrome DevTools, Firefox Developer Tools, etc.)

**Passos:**
1. Abra as ferramentas de desenvolvedor do navegador
2. Vá para a aba "Network" (Rede)
3. Ative a opção para limpar o cache e recarregar a página (Ctrl+F5 ou Cmd+Shift+R)
4. Acesse a página inicial do Stry.live
5. Observe o tempo de carregamento e o tamanho dos recursos
6. Repita o processo para outras páginas principais:
   - Dashboard
   - Lista de Stories
   - Editor de Stories
   - Lista de Lives
   - Analytics

**Resultado esperado:**
- A página inicial deve carregar em menos de 3 segundos
- O Dashboard deve carregar em menos de 5 segundos
- As outras páginas devem carregar em menos de 4 segundos
- O tamanho total dos recursos deve ser razoável (menos de 5MB por página)
- Não deve haver erros de carregamento de recursos

### Teste de Responsividade

**Pré-requisitos:**
- Acesso ao ambiente de teste
- Dispositivos de diferentes tamanhos ou ferramenta de emulação de dispositivos

**Passos:**
1. Acesse o Stry.live em um desktop
2. Navegue pelas principais páginas e verifique a aparência
3. Redimensione a janela do navegador para diferentes tamanhos
4. Acesse o Stry.live em um tablet (ou emule um)
5. Navegue pelas principais páginas e verifique a aparência
6. Acesse o Stry.live em um smartphone (ou emule um)
7. Navegue pelas principais páginas e verifique a aparência
8. Teste a orientação retrato e paisagem em dispositivos móveis

**Resultado esperado:**
- A interface deve se adaptar corretamente a diferentes tamanhos de tela
- Todos os elementos devem ser visíveis e utilizáveis em qualquer dispositivo
- Não deve haver sobreposição de elementos ou texto cortado
- A navegação deve ser intuitiva em dispositivos móveis
- A orientação retrato e paisagem deve funcionar corretamente

### Teste de Carga

**Pré-requisitos:**
- Estar logado como Admin Master
- Ter acesso à ferramenta de teste de carga no ambiente de teste

**Passos:**
1. No Dashboard, acesse a seção de ferramentas administrativas
2. Selecione "Teste de Carga"
3. Configure o teste:
   - Número de usuários simultâneos: 100
   - Duração: 5 minutos
   - Páginas a testar: Dashboard, Stories, Lives
4. Inicie o teste
5. Observe os resultados:
   - Tempo de resposta
   - Taxa de erro
   - Throughput (requisições por segundo)

**Resultado esperado:**
- O sistema deve suportar 100 usuários simultâneos sem degradação significativa
- O tempo médio de resposta deve permanecer abaixo de 1 segundo
- A taxa de erro deve ser menor que 1%
- Não deve haver falhas de servidor durante o teste
- Os resultados devem estar dentro dos limites aceitáveis definidos

## Testes de Segurança

### Teste de Autenticação e Autorização

**Pré-requisitos:**
- Contas de diferentes níveis de acesso (Admin Master, Admin Cliente, Admin Usuário, Usuário Regular)

**Passos:**
1. Tente acessar páginas protegidas sem estar logado
2. Faça login como Usuário Regular e tente acessar páginas administrativas
3. Faça login como Admin Usuário e tente acessar funcionalidades para as quais não tem permissão
4. Faça login como Admin Cliente e tente acessar funcionalidades exclusivas do Admin Master
5. Tente modificar o token JWT no localStorage e acessar páginas protegidas
6. Tente acessar a API diretamente com um token inválido ou expirado

**Resultado esperado:**
- Páginas protegidas devem redirecionar para o login quando não autenticado
- Usuários não devem conseguir acessar funcionalidades para as quais não têm permissão
- Tentativas de manipular o token JWT devem resultar em falha de autenticação
- A API deve rejeitar requisições com tokens inválidos ou expirados
- Todas as tentativas de acesso não autorizado devem ser registradas nos logs

### Teste de Validação de Entrada

**Pré-requisitos:**
- Estar logado como Admin Cliente ou Admin Usuário com permissão

**Passos:**
1. Teste formulários com entradas inválidas:
   - Campos em branco
   - Valores muito longos
   - Caracteres especiais
   - Scripts maliciosos (XSS)
   - Comandos SQL (SQL Injection)
2. Teste o upload de arquivos:
   - Arquivos muito grandes
   - Tipos de arquivo não permitidos
   - Arquivos com nomes maliciosos
   - Arquivos com conteúdo malicioso
3. Teste URLs com parâmetros manipulados
4. Teste requisições API com dados inválidos

**Resultado esperado:**
- Todos os formulários devem validar entradas corretamente
- Entradas inválidas devem ser rejeitadas com mensagens de erro apropriadas
- Scripts e comandos maliciosos não devem ser executados
- Uploads de arquivos devem ser validados quanto a tipo, tamanho e conteúdo
- Parâmetros de URL manipulados não devem causar comportamento inesperado
- A API deve validar todas as entradas e rejeitar dados inválidos

### Teste de Proteção de Dados

**Pré-requisitos:**
- Estar logado como Admin Cliente
- Ter dados sensíveis no sistema (informações de pagamento, etc.)

**Passos:**
1. Verifique se dados sensíveis são exibidos de forma segura:
   - Informações de cartão de crédito (devem ser mascaradas)
   - Senhas (nunca devem ser exibidas)
2. Verifique se as comunicações são criptografadas:
   - Conexão HTTPS em todas as páginas
   - Certificado SSL válido
3. Verifique o armazenamento de dados no navegador:
   - Cookies (flags secure e httpOnly)
   - localStorage (não deve conter dados sensíveis)
   - sessionStorage (não deve conter dados sensíveis)
4. Tente acessar dados de outros usuários ou clientes

**Resultado esperado:**
- Dados sensíveis devem ser mascarados ou não exibidos
- Todas as comunicações devem ser criptografadas via HTTPS
- Cookies sensíveis devem ter as flags secure e httpOnly
- localStorage e sessionStorage não devem conter dados sensíveis
- Não deve ser possível acessar dados de outros usuários ou clientes

## Relatório de Bugs

### Como Reportar Bugs

Se encontrar algum problema durante os testes, siga estas etapas para reportá-lo:

1. Acesse a seção "Suporte" no menu lateral
2. Clique em "Reportar Problema"
3. Selecione a categoria do problema
4. Forneça uma descrição detalhada:
   - O que você estava fazendo
   - O que esperava que acontecesse
   - O que aconteceu de fato
   - Passos para reproduzir o problema
5. Anexe capturas de tela, se possível
6. Inclua informações do ambiente:
   - Navegador e versão
   - Sistema operacional
   - Dispositivo
   - Resolução de tela
7. Clique em "Enviar"

Você receberá um número de ticket para acompanhamento do seu problema.

### Priorização de Bugs

Os bugs são classificados nas seguintes categorias:

1. **Crítico**: Impede o uso do sistema ou causa perda de dados
2. **Alto**: Afeta funcionalidades principais, mas existem alternativas
3. **Médio**: Afeta funcionalidades secundárias
4. **Baixo**: Problemas menores de interface ou usabilidade

A equipe de desenvolvimento priorizará a correção com base nessa classificação.

### Acompanhamento de Bugs

Para acompanhar o status dos bugs reportados:

1. Acesse a seção "Suporte" no menu lateral
2. Clique em "Meus Tickets"
3. Localize o ticket pelo número ou descrição
4. Verifique o status atual
5. Adicione comentários adicionais, se necessário

---

Este guia de teste fornece instruções detalhadas para verificar todas as funcionalidades do Stry.live. Ao seguir estes procedimentos, você pode garantir que o sistema está funcionando corretamente antes da implantação em produção.

Para qualquer dúvida ou suporte adicional, entre em contato com a equipe de desenvolvimento em dev@stry.live.
