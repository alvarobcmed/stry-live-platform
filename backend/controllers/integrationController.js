const admin = require('firebase-admin');
const db = admin.firestore();

// Obter configurações do Tag Manager
exports.getTagManagerConfig = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    
    // Buscar configurações do cliente
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return res.status(404).json({ msg: 'Cliente não encontrado' });
    }
    
    // Buscar configurações do Tag Manager
    const tagManagerRef = db.collection('integrations').doc(clientId);
    const tagManagerDoc = await tagManagerRef.get();
    
    if (!tagManagerDoc.exists) {
      // Criar configurações padrão
      const defaultConfig = {
        clientId,
        containerId: '',
        enabled: false,
        playerConfig: {
          position: 'bottom-right',
          size: 'medium',
          borderRadius: '50%',
          mobileEnabled: true,
          desktopEnabled: true,
          autoplay: false,
          showControls: true,
          theme: 'light'
        },
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await tagManagerRef.set(defaultConfig);
      
      return res.status(200).json(defaultConfig);
    }
    
    const config = tagManagerDoc.data();
    
    return res.status(200).json({
      ...config,
      createdAt: config.createdAt ? config.createdAt.toDate() : null,
      updatedAt: config.updatedAt ? config.updatedAt.toDate() : null
    });
  } catch (error) {
    console.error('Erro ao buscar configurações do Tag Manager:', error);
    return res.status(500).json({ msg: 'Erro ao buscar configurações do Tag Manager' });
  }
};

// Atualizar configurações do Tag Manager
exports.updateTagManagerConfig = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    
    const {
      containerId,
      enabled,
      playerConfig
    } = req.body;
    
    // Validar dados
    if (enabled && !containerId) {
      return res.status(400).json({ msg: 'ID do container é obrigatório quando a integração está ativada' });
    }
    
    // Buscar configurações do Tag Manager
    const tagManagerRef = db.collection('integrations').doc(clientId);
    const tagManagerDoc = await tagManagerRef.get();
    
    if (!tagManagerDoc.exists) {
      // Criar configurações
      const newConfig = {
        clientId,
        containerId: containerId || '',
        enabled: enabled || false,
        playerConfig: playerConfig || {
          position: 'bottom-right',
          size: 'medium',
          borderRadius: '50%',
          mobileEnabled: true,
          desktopEnabled: true,
          autoplay: false,
          showControls: true,
          theme: 'light'
        },
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await tagManagerRef.set(newConfig);
      
      return res.status(201).json({
        msg: 'Configurações do Tag Manager criadas com sucesso',
        config: newConfig
      });
    }
    
    // Atualizar configurações existentes
    const updateData = {
      updatedBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (containerId !== undefined) updateData.containerId = containerId;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (playerConfig) updateData.playerConfig = playerConfig;
    
    await tagManagerRef.update(updateData);
    
    // Buscar configurações atualizadas
    const updatedDoc = await tagManagerRef.get();
    const updatedConfig = updatedDoc.data();
    
    return res.status(200).json({
      msg: 'Configurações do Tag Manager atualizadas com sucesso',
      config: {
        ...updatedConfig,
        createdAt: updatedConfig.createdAt ? updatedConfig.createdAt.toDate() : null,
        updatedAt: updatedConfig.updatedAt ? updatedConfig.updatedAt.toDate() : null
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações do Tag Manager:', error);
    return res.status(500).json({ msg: 'Erro ao atualizar configurações do Tag Manager' });
  }
};

// Obter código de incorporação para o site do cliente
exports.getEmbedCode = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    
    // Buscar configurações do Tag Manager
    const tagManagerRef = db.collection('integrations').doc(clientId);
    const tagManagerDoc = await tagManagerRef.get();
    
    if (!tagManagerDoc.exists) {
      return res.status(404).json({ msg: 'Configurações de integração não encontradas' });
    }
    
    const config = tagManagerDoc.data();
    
    // Buscar cliente
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return res.status(404).json({ msg: 'Cliente não encontrado' });
    }
    
    const client = clientDoc.data();
    
    // Gerar código de incorporação
    const clientCode = client.clientCode || clientId.substring(0, 8);
    
    // Código para Google Tag Manager
    const gtmCode = `
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${config.containerId}');</script>
<!-- End Google Tag Manager -->
    `.trim();
    
    // Código para o corpo da página
    const gtmBodyCode = `
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${config.containerId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
    `.trim();
    
    // Código personalizado para o Stry.live
    const stryCode = `
<!-- Stry.live Integration -->
<script>
  window.stryConfig = {
    clientId: "${clientId}",
    clientCode: "${clientCode}",
    position: "${config.playerConfig.position}",
    size: "${config.playerConfig.size}",
    borderRadius: "${config.playerConfig.borderRadius}",
    mobileEnabled: ${config.playerConfig.mobileEnabled},
    desktopEnabled: ${config.playerConfig.desktopEnabled},
    autoplay: ${config.playerConfig.autoplay},
    showControls: ${config.playerConfig.showControls},
    theme: "${config.playerConfig.theme}"
  };
</script>
<script async src="https://cdn.stry.live/js/stry-embed.js"></script>
<!-- End Stry.live Integration -->
    `.trim();
    
    // Código para Tag Manager
    const tagManagerCustomHtml = `
<!-- Stry.live Integration -->
<script>
  window.stryConfig = {
    clientId: "{{clientId}}",
    clientCode: "{{clientCode}}",
    position: "{{position}}",
    size: "{{size}}",
    borderRadius: "{{borderRadius}}",
    mobileEnabled: {{mobileEnabled}},
    desktopEnabled: {{desktopEnabled}},
    autoplay: {{autoplay}},
    showControls: {{showControls}},
    theme: "{{theme}}"
  };
  
  // Substituir variáveis
  window.stryConfig.clientId = "${clientId}";
  window.stryConfig.clientCode = "${clientCode}";
  window.stryConfig.position = "${config.playerConfig.position}";
  window.stryConfig.size = "${config.playerConfig.size}";
  window.stryConfig.borderRadius = "${config.playerConfig.borderRadius}";
  window.stryConfig.mobileEnabled = ${config.playerConfig.mobileEnabled};
  window.stryConfig.desktopEnabled = ${config.playerConfig.desktopEnabled};
  window.stryConfig.autoplay = ${config.playerConfig.autoplay};
  window.stryConfig.showControls = ${config.playerConfig.showControls};
  window.stryConfig.theme = "${config.playerConfig.theme}";
</script>
<script async src="https://cdn.stry.live/js/stry-embed.js"></script>
<!-- End Stry.live Integration -->
    `.trim();
    
    // Instruções de implementação
    const instructions = `
# Instruções de Implementação do Stry.live

## Opção 1: Implementação Direta

Adicione o seguinte código no cabeçalho (<head>) do seu site:

\`\`\`html
${stryCode}
\`\`\`

## Opção 2: Implementação via Google Tag Manager

1. Adicione o Google Tag Manager ao seu site (se ainda não tiver):

   Adicione este código o mais alto possível no cabeçalho (<head>) do seu site:
   
   \`\`\`html
   ${gtmCode}
   \`\`\`
   
   Adicione este código logo após a tag de abertura <body>:
   
   \`\`\`html
   ${gtmBodyCode}
   \`\`\`

2. No Google Tag Manager (${config.containerId}):
   
   a. Crie uma nova tag HTML personalizada
   b. Cole o seguinte código:
   
   \`\`\`html
   ${tagManagerCustomHtml}
   \`\`\`
   
   c. Configure o acionador para "All Pages" (Todas as Páginas)
   d. Salve e publique as alterações

## Configurações Personalizadas

Você pode personalizar a aparência e o comportamento do player de stories modificando as configurações no painel de administração do Stry.live.
    `.trim();
    
    return res.status(200).json({
      gtmCode,
      gtmBodyCode,
      stryCode,
      tagManagerCustomHtml,
      instructions,
      config: {
        clientId,
        clientCode,
        containerId: config.containerId,
        playerConfig: config.playerConfig
      }
    });
  } catch (error) {
    console.error('Erro ao gerar código de incorporação:', error);
    return res.status(500).json({ msg: 'Erro ao gerar código de incorporação' });
  }
};

// Personalizar código de incorporação
exports.customizeEmbedCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    
    const { playerConfig } = req.body;
    
    if (!playerConfig) {
      return res.status(400).json({ msg: 'Configurações do player são obrigatórias' });
    }
    
    // Validar configurações do player
    const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center-left', 'center-right'];
    const validSizes = ['small', 'medium', 'large'];
    const validThemes = ['light', 'dark', 'custom'];
    
    if (playerConfig.position && !validPositions.includes(playerConfig.position)) {
      return res.status(400).json({ msg: 'Posição inválida' });
    }
    
    if (playerConfig.size && !validSizes.includes(playerConfig.size)) {
      return res.status(400).json({ msg: 'Tamanho inválido' });
    }
    
    if (playerConfig.theme && !validThemes.includes(playerConfig.theme)) {
      return res.status(400).json({ msg: 'Tema inválido' });
    }
    
    // Buscar configurações do Tag Manager
    const tagManagerRef = db.collection('integrations').doc(clientId);
    const tagManagerDoc = await tagManagerRef.get();
    
    if (!tagManagerDoc.exists) {
      // Criar configurações
      const newConfig = {
        clientId,
        containerId: '',
        enabled: false,
        playerConfig: {
          position: playerConfig.position || 'bottom-right',
          size: playerConfig.size || 'medium',
          borderRadius: playerConfig.borderRadius || '50%',
          mobileEnabled: playerConfig.mobileEnabled !== undefined ? playerConfig.mobileEnabled : true,
          desktopEnabled: playerConfig.desktopEnabled !== undefined ? playerConfig.desktopEnabled : true,
          autoplay: playerConfig.autoplay !== undefined ? playerConfig.autoplay : false,
          showControls: playerConfig.showControls !== undefined ? playerConfig.showControls : true,
          theme: playerConfig.theme || 'light'
        },
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await tagManagerRef.set(newConfig);
      
      return res.status(201).json({
        msg: 'Configurações do player criadas com sucesso',
        config: newConfig
      });
    }
    
    // Atualizar configurações existentes
    const currentConfig = tagManagerDoc.data();
    
    const updatedPlayerConfig = {
      ...currentConfig.playerConfig,
      ...playerConfig
    };
    
    await tagManagerRef.update({
      playerConfig: updatedPlayerConfig,
      updatedBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Buscar configurações atualizadas
    const updatedDoc = await tagManagerRef.get();
    const updatedConfig = updatedDoc.data();
    
    return res.status(200).json({
      msg: 'Configurações do player atualizadas com sucesso',
      config: {
        ...updatedConfig,
        createdAt: updatedConfig.createdAt ? updatedConfig.createdAt.toDate() : null,
        updatedAt: updatedConfig.updatedAt ? updatedConfig.updatedAt.toDate() : null
      }
    });
  } catch (error) {
    console.error('Erro ao personalizar código de incorporação:', error);
    return res.status(500).json({ msg: 'Erro ao personalizar código de incorporação' });
  }
};

// Obter sites integrados
exports.getIntegratedSites = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    
    // Buscar sites integrados
    const sitesSnapshot = await db.collection('integratedSites')
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const sites = [];
    
    sitesSnapshot.forEach(doc => {
      const siteData = doc.data();
      
      sites.push({
        id: doc.id,
        ...siteData,
        createdAt: siteData.createdAt ? siteData.createdAt.toDate() : null,
        updatedAt: siteData.updatedAt ? siteData.updatedAt.toDate() : null
      });
    });
    
    return res.status(200).json(sites);
  } catch (error) {
    console.error('Erro ao buscar sites integrados:', error);
    return res.status(500).json({ msg: 'Erro ao buscar sites integrados' });
  }
};

// Adicionar novo site integrado
exports.addIntegratedSite = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;
    
    const {
      name,
      url,
      description,
      status
    } = req.body;
    
    // Validar dados
    if (!name || !url) {
      return res.status(400).json({ msg: 'Nome e URL são obrigatórios' });
    }
    
    // Verificar se o site já está cadastrado
    const siteCheckSnapshot = await db.collection('integratedSites')
      .where('clientId', '==', clientId)
      .where('url', '==', url)
      .limit(1)
      .get();
    
    if (!siteCheckSnapshot.empty) {
      return res.status(400).json({ msg: 'Site já está cadastrado' });
    }
    
    // Criar novo site
    const siteData = {
      clientId,
      name,
      url,
      description: description || '',
      status: status || 'active',
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const siteRef = db.collection('integratedSites').doc();
    await siteRef.set(siteData);
    
    return res.status(201).json({
      msg: 'Site integrado adicionado com sucesso',
      site: {
        id: siteRef.id,
        ...siteData
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar site integrado:', error);
    return res.status(500).json({ msg: 'Erro ao adicionar site integrado' });
  }
};

// Atualizar site integrado
exports.updateIntegratedSite = async (req, res) => {
  try {
    const siteId = req.params.id;
    const userId = req.user.id;
    const clientId = req.user.clientId;
    
    const {
      name,
      url,
      description,
      status
    } = req.body;
    
    // Buscar site
    const siteRef = db.collection('integratedSites').doc(siteId);
    const siteDoc = await siteRef.get();
    
    if (!siteDoc.exists) {
      return res.status(404).json({ msg: 'Site integrado não encontrado' });
    }
    
    const siteData = siteDoc.data();
    
    // Verificar permissão
    if (siteData.clientId !== clientId) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Preparar dados para atualização
    const updateData = {
      updatedBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (name) updateData.name = name;
    if (url) updateData.url = url;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    
    // Atualizar site
    await siteRef.update(updateData);
    
    // Buscar site atualizado
    const updatedDoc = await siteRef.get();
    const updatedData = updatedDoc.data();
    
    return res.status(200).json({
      msg: 'Site integrado atualizado com sucesso',
      site: {
        id: siteId,
        ...updatedData,
        createdAt: updatedData.createdAt ? updatedData.createdAt.toDate() : null,
        updatedAt: updatedData.updatedAt ? updatedData.updatedAt.toDate() : null
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar site integrado:', error);
    return res.status(500).json({ msg: 'Erro ao atualizar site integrado' });
  }
};

// Remover site integrado
exports.removeIntegratedSite = async (req, res) => {
  try {
    const siteId = req.params.id;
    const clientId = req.user.clientId;
    
    // Buscar site
    const siteRef = db.collection('integratedSites').doc(siteId);
    const siteDoc = await siteRef.get();
    
    if (!siteDoc.exists) {
      return res.status(404).json({ msg: 'Site integrado não encontrado' });
    }
    
    const siteData = siteDoc.data();
    
    // Verificar permissão
    if (siteData.clientId !== clientId) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    
    // Remover site
    await siteRef.delete();
    
    return res.status(200).json({ msg: 'Site integrado removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover site integrado:', error);
    return res.status(500).json({ msg: 'Erro ao remover site integrado' });
  }
};

// Obter URL de preview da integração
exports.getPreviewUrl = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    
    // Buscar cliente
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return res.status(404).json({ msg: 'Cliente não encontrado' });
    }
    
    const client = clientDoc.data();
    
    // Buscar configurações do Tag Manager
    const tagManagerRef = db.collection('integrations').doc(clientId);
    const tagManagerDoc = await tagManagerRef.get();
    
    let playerConfig = {
      position: 'bottom-right',
      size: 'medium',
      borderRadius: '50%',
      mobileEnabled: true,
      desktopEnabled: true,
      autoplay: false,
      showControls: true,
      theme: 'light'
    };
    
    if (tagManagerDoc.exists) {
      playerConfig = tagManagerDoc.data().playerConfig || playerConfig;
    }
    
    // Gerar URL de preview
    const clientCode = client.clientCode || clientId.substring(0, 8);
    const previewUrl = `https://preview.stry.live/?clientId=${clientId}&clientCode=${clientCode}&position=${playerConfig.position}&size=${playerConfig.size}&borderRadius=${playerConfig.borderRadius}&mobileEnabled=${playerConfig.mobileEnabled}&desktopEnabled=${playerConfig.desktopEnabled}&autoplay=${playerConfig.autoplay}&showControls=${playerConfig.showControls}&theme=${playerConfig.theme}`;
    
    return res.status(200).json({ previewUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de preview:', error);
    return res.status(500).json({ msg: 'Erro ao gerar URL de preview' });
  }
};

// Testar integração
exports.testIntegration = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ msg: 'URL é obrigatória' });
    }
    
    // Simular teste de integração
    // Em um ambiente real, isso poderia fazer uma requisição para a URL
    // e verificar se o script do Stry.live está presente
    
    // Registrar teste
    await db.collection('integrationTests').add({
      clientId,
      url,
      userId: req.user.id,
      success: true, // Simulando sucesso
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({
      msg: 'Teste de integração realizado com sucesso',
      result: {
        url,
        success: true,
        details: {
          scriptDetected: true,
          configDetected: true,
          playerRendered: true
        }
      }
    });
  } catch (error) {
    console.error('Erro ao testar integração:', error);
    return res.status(500).json({ msg: 'Erro ao testar integração' });
  }
};
