const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

const db = getFirestore();
const storiesCollection = db.collection('stories');
const usersCollection = db.collection('users');
const bucket = getStorage().bucket();

// Obter todas as stories (com filtros)
exports.getAllStories = async (req, res) => {
  try {
    const { status, category, search, limit = 20, page = 1 } = req.query;
    let query = storiesCollection;
    
    // Filtrar por status
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Filtrar por categoria
    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Se não for admin_master, mostrar apenas stories do usuário ou da empresa
    if (req.user.role !== 'admin_master') {
      if (req.user.role === 'admin_client') {
        // Admin client vê todas as stories da empresa
        query = query.where('companyId', '==', req.user.companyId);
      } else {
        // Usuário normal vê apenas suas próprias stories
        query = query.where('createdBy', '==', req.user.uid);
      }
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    query = query.orderBy('createdAt', 'desc');
    
    // Paginação
    const startAt = (page - 1) * parseInt(limit);
    const endAt = startAt + parseInt(limit);
    
    const snapshot = await query.get();
    const totalCount = snapshot.size;
    
    const stories = [];
    let count = 0;
    
    snapshot.forEach(doc => {
      // Aplicar paginação manualmente
      if (count >= startAt && count < endAt) {
        const storyData = doc.data();
        
        // Aplicar filtro de pesquisa se necessário
        if (!search || 
            storyData.title.toLowerCase().includes(search.toLowerCase()) || 
            storyData.description.toLowerCase().includes(search.toLowerCase())) {
          stories.push({
            id: doc.id,
            ...storyData,
            mediaCount: storyData.media ? storyData.media.length : 0
          });
        }
      }
      count++;
    });
    
    res.status(200).json({
      stories,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao obter stories:', error);
    res.status(500).json({ message: 'Erro ao obter stories', error: error.message });
  }
};

// Obter stories públicas
exports.getPublicStories = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Obter apenas stories ativas e públicas
    const snapshot = await storiesCollection
      .where('status', '==', 'active')
      .where('visibility', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const stories = [];
    
    snapshot.forEach(doc => {
      const storyData = doc.data();
      stories.push({
        id: doc.id,
        title: storyData.title,
        description: storyData.description,
        thumbnail: storyData.thumbnail,
        media: storyData.media,
        createdAt: storyData.createdAt
      });
    });
    
    res.status(200).json({ stories });
  } catch (error) {
    console.error('Erro ao obter stories públicas:', error);
    res.status(500).json({ message: 'Erro ao obter stories públicas', error: error.message });
  }
};

// Obter story por ID
exports.getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    const storyData = storyDoc.data();
    
    // Verificar permissões
    if (storyData.visibility !== 'public') {
      if (req.user.role !== 'admin_master') {
        if (req.user.role === 'admin_client' && storyData.companyId !== req.user.companyId) {
          return res.status(403).json({ message: 'Você não tem permissão para acessar esta story.' });
        } else if (req.user.role === 'user' && storyData.createdBy !== req.user.uid) {
          return res.status(403).json({ message: 'Você não tem permissão para acessar esta story.' });
        }
      }
    }
    
    // Obter estatísticas
    const viewsSnapshot = await db.collection('storyViews')
      .where('storyId', '==', id)
      .get();
    
    const likesSnapshot = await db.collection('storyLikes')
      .where('storyId', '==', id)
      .get();
    
    const commentsSnapshot = await db.collection('storyComments')
      .where('storyId', '==', id)
      .orderBy('createdAt', 'desc')
      .get();
    
    const comments = [];
    commentsSnapshot.forEach(doc => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json({
      story: {
        id: storyDoc.id,
        ...storyData,
        stats: {
          views: viewsSnapshot.size,
          likes: likesSnapshot.size,
          comments: commentsSnapshot.size
        },
        comments
      }
    });
  } catch (error) {
    console.error('Erro ao obter story:', error);
    res.status(500).json({ message: 'Erro ao obter story', error: error.message });
  }
};

// Obter story pública por ID
exports.getPublicStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    const storyData = storyDoc.data();
    
    // Verificar se a story é pública e ativa
    if (storyData.visibility !== 'public' || storyData.status !== 'active') {
      return res.status(403).json({ message: 'Esta story não está disponível publicamente.' });
    }
    
    // Obter estatísticas básicas
    const viewsSnapshot = await db.collection('storyViews')
      .where('storyId', '==', id)
      .get();
    
    const likesSnapshot = await db.collection('storyLikes')
      .where('storyId', '==', id)
      .get();
    
    res.status(200).json({
      story: {
        id: storyDoc.id,
        title: storyData.title,
        description: storyData.description,
        thumbnail: storyData.thumbnail,
        media: storyData.media,
        createdAt: storyData.createdAt,
        stats: {
          views: viewsSnapshot.size,
          likes: likesSnapshot.size
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter story pública:', error);
    res.status(500).json({ message: 'Erro ao obter story pública', error: error.message });
  }
};

// Criar nova story
exports.createStory = async (req, res) => {
  try {
    const { title, description, category, visibility, status } = req.body;
    
    // Verificar campos obrigatórios
    if (!title) {
      return res.status(400).json({ message: 'O título é obrigatório.' });
    }
    
    // Processar arquivos de mídia
    const mediaFiles = [];
    
    if (req.files && req.files.media) {
      for (const file of req.files.media) {
        // Fazer upload para o Firebase Storage
        const destination = `stories/${req.user.uid}/${Date.now()}-${file.originalname}`;
        await bucket.upload(file.path, {
          destination,
          metadata: {
            contentType: file.mimetype
          }
        });
        
        // Obter URL pública
        const [url] = await bucket.file(destination).getSignedUrl({
          action: 'read',
          expires: '01-01-2100'
        });
        
        mediaFiles.push({
          url,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          name: file.originalname,
          size: file.size,
          path: destination
        });
        
        // Remover arquivo temporário
        fs.unlinkSync(file.path);
      }
    }
    
    // Processar thumbnail
    let thumbnailUrl = null;
    
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const file = req.files.thumbnail[0];
      const destination = `stories/${req.user.uid}/thumbnails/${Date.now()}-${file.originalname}`;
      
      await bucket.upload(file.path, {
        destination,
        metadata: {
          contentType: file.mimetype
        }
      });
      
      // Obter URL pública
      const [url] = await bucket.file(destination).getSignedUrl({
        action: 'read',
        expires: '01-01-2100'
      });
      
      thumbnailUrl = url;
      
      // Remover arquivo temporário
      fs.unlinkSync(file.path);
    }
    
    // Obter informações da empresa do usuário
    const userDoc = await usersCollection.doc(req.user.uid).get();
    const userData = userDoc.data();
    
    // Criar story no Firestore
    const storyRef = await storiesCollection.add({
      title,
      description: description || '',
      category: category || 'general',
      visibility: visibility || 'public',
      status: status || 'active',
      media: mediaFiles,
      thumbnail: thumbnailUrl,
      createdBy: req.user.uid,
      createdByName: userData.name,
      companyId: userData.companyId,
      companyName: userData.company,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({
      message: 'Story criada com sucesso',
      story: {
        id: storyRef.id,
        title,
        description: description || '',
        category: category || 'general',
        visibility: visibility || 'public',
        status: status || 'active',
        media: mediaFiles,
        thumbnail: thumbnailUrl
      }
    });
  } catch (error) {
    console.error('Erro ao criar story:', error);
    res.status(500).json({ message: 'Erro ao criar story', error: error.message });
  }
};

// Atualizar story
exports.updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, visibility, status } = req.body;
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    const storyData = storyDoc.data();
    
    // Verificar permissões
    if (req.user.role !== 'admin_master') {
      if (req.user.role === 'admin_client' && storyData.companyId !== req.user.companyId) {
        return res.status(403).json({ message: 'Você não tem permissão para editar esta story.' });
      } else if (req.user.role === 'user' && storyData.createdBy !== req.user.uid) {
        return res.status(403).json({ message: 'Você não tem permissão para editar esta story.' });
      }
    }
    
    // Processar novos arquivos de mídia
    const mediaFiles = [...(storyData.media || [])];
    
    if (req.files && req.files.media) {
      for (const file of req.files.media) {
        // Fazer upload para o Firebase Storage
        const destination = `stories/${req.user.uid}/${Date.now()}-${file.originalname}`;
        await bucket.upload(file.path, {
          destination,
          metadata: {
            contentType: file.mimetype
          }
        });
        
        // Obter URL pública
        const [url] = await bucket.file(destination).getSignedUrl({
          action: 'read',
          expires: '01-01-2100'
        });
        
        mediaFiles.push({
          url,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          name: file.originalname,
          size: file.size,
          path: destination
        });
        
        // Remover arquivo temporário
        fs.unlinkSync(file.path);
      }
    }
    
    // Processar nova thumbnail
    let thumbnailUrl = storyData.thumbnail;
    
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const file = req.files.thumbnail[0];
      const destination = `stories/${req.user.uid}/thumbnails/${Date.now()}-${file.originalname}`;
      
      await bucket.upload(file.path, {
        destination,
        metadata: {
          contentType: file.mimetype
        }
      });
      
      // Obter URL pública
      const [url] = await bucket.file(destination).getSignedUrl({
        action: 'read',
        expires: '01-01-2100'
      });
      
      thumbnailUrl = url;
      
      // Remover arquivo temporário
      fs.unlinkSync(file.path);
    }
    
    // Atualizar story no Firestore
    await storiesCollection.doc(id).update({
      title: title || storyData.title,
      description: description !== undefined ? description : storyData.description,
      category: category || storyData.category,
      visibility: visibility || storyData.visibility,
      status: status || storyData.status,
      media: mediaFiles,
      thumbnail: thumbnailUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({
      message: 'Story atualizada com sucesso',
      story: {
        id,
        title: title || storyData.title,
        description: description !== undefined ? description : storyData.description,
        category: category || storyData.category,
        visibility: visibility || storyData.visibility,
        status: status || storyData.status,
        media: mediaFiles,
        thumbnail: thumbnailUrl
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar story:', error);
    res.status(500).json({ message: 'Erro ao atualizar story', error: error.message });
  }
};

// Excluir story
exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    const storyData = storyDoc.data();
    
    // Verificar permissões
    if (req.user.role !== 'admin_master') {
      if (req.user.role === 'admin_client' && storyData.companyId !== req.user.companyId) {
        return res.status(403).json({ message: 'Você não tem permissão para excluir esta story.' });
      } else if (req.user.role === 'user' && storyData.createdBy !== req.user.uid) {
        return res.status(403).json({ message: 'Você não tem permissão para excluir esta story.' });
      }
    }
    
    // Excluir arquivos de mídia do Storage
    if (storyData.media && storyData.media.length > 0) {
      for (const media of storyData.media) {
        if (media.path) {
          try {
            await bucket.file(media.path).delete();
          } catch (error) {
            console.error(`Erro ao excluir arquivo ${media.path}:`, error);
          }
        }
      }
    }
    
    // Excluir thumbnail do Storage
    if (storyData.thumbnail) {
      const thumbnailPath = storyData.thumbnail.split('?')[0].split('/o/')[1].replace(/%2F/g, '/');
      try {
        await bucket.file(decodeURIComponent(thumbnailPath)).delete();
      } catch (error) {
        console.error(`Erro ao excluir thumbnail:`, error);
      }
    }
    
    // Excluir story do Firestore
    await storiesCollection.doc(id).delete();
    
    // Excluir dados relacionados (visualizações, likes, comentários)
    const batch = db.batch();
    
    const viewsSnapshot = await db.collection('storyViews')
      .where('storyId', '==', id)
      .get();
    
    viewsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    const likesSnapshot = await db.collection('storyLikes')
      .where('storyId', '==', id)
      .get();
    
    likesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    const commentsSnapshot = await db.collection('storyComments')
      .where('storyId', '==', id)
      .get();
    
    commentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.status(200).json({ message: 'Story excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir story:', error);
    res.status(500).json({ message: 'Erro ao excluir story', error: error.message });
  }
};

// Adicionar mídia a uma story
exports.addMediaToStory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    const storyData = storyDoc.data();
    
    // Verificar permissões
    if (req.user.role !== 'admin_master') {
      if (req.user.role === 'admin_client' && storyData.companyId !== req.user.companyId) {
        return res.status(403).json({ message: 'Você não tem permissão para editar esta story.' });
      } else if (req.user.role === 'user' && storyData.createdBy !== req.user.uid) {
        return res.status(403).json({ message: 'Você não tem permissão para editar esta story.' });
      }
    }
    
    // Verificar se há um arquivo
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    
    // Fazer upload para o Firebase Storage
    const destination = `stories/${req.user.uid}/${Date.now()}-${req.file.originalname}`;
    await bucket.upload(req.file.path, {
      destination,
      metadata: {
        contentType: req.file.mimetype
      }
    });
    
    // Obter URL pública
    const [url] = await bucket.file(destination).getSignedUrl({
      action: 'read',
      expires: '01-01-2100'
    });
    
    const mediaFile = {
      url,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
      name: req.file.originalname,
      size: req.file.size,
      path: destination
    };
    
    // Remover arquivo temporário
    fs.unlinkSync(req.file.path);
    
    // Atualizar story no Firestore
    const mediaFiles = [...(storyData.media || []), mediaFile];
    
    await storiesCollection.doc(id).update({
      media: mediaFiles,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({
      message: 'Mídia adicionada com sucesso',
      media: mediaFile
    });
  } catch (error) {
    console.error('Erro ao adicionar mídia:', error);
    res.status(500).json({ message: 'Erro ao adicionar mídia', error: error.message });
  }
};

// Remover mídia de uma story
exports.removeMediaFromStory = async (req, res) => {
  try {
    const { id, mediaId } = req.params;
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    const storyData = storyDoc.data();
    
    // Verificar permissões
    if (req.user.role !== 'admin_master') {
      if (req.user.role === 'admin_client' && storyData.companyId !== req.user.companyId) {
        return res.status(403).json({ message: 'Você não tem permissão para editar esta story.' });
      } else if (req.user.role === 'user' && storyData.createdBy !== req.user.uid) {
        return res.status(403).json({ message: 'Você não tem permissão para editar esta story.' });
      }
    }
    
    // Encontrar a mídia pelo índice
    const mediaIndex = parseInt(mediaId);
    
    if (isNaN(mediaIndex) || mediaIndex < 0 || !storyData.media || mediaIndex >= storyData.media.length) {
      return res.status(404).json({ message: 'Mídia não encontrada.' });
    }
    
    const mediaToRemove = storyData.media[mediaIndex];
    
    // Excluir arquivo do Storage
    if (mediaToRemove.path) {
      try {
        await bucket.file(mediaToRemove.path).delete();
      } catch (error) {
        console.error(`Erro ao excluir arquivo ${mediaToRemove.path}:`, error);
      }
    }
    
    // Atualizar story no Firestore
    const mediaFiles = storyData.media.filter((_, index) => index !== mediaIndex);
    
    await storiesCollection.doc(id).update({
      media: mediaFiles,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({
      message: 'Mídia removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover mídia:', error);
    res.status(500).json({ message: 'Erro ao remover mídia', error: error.message });
  }
};

// Registrar visualização
exports.recordView = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, deviceId } = req.body;
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    // Verificar se a story está ativa e pública
    const storyData = storyDoc.data();
    
    if (storyData.status !== 'active') {
      return res.status(403).json({ message: 'Esta story não está disponível.' });
    }
    
    // Criar identificador único para o dispositivo
    const viewerId = userId || deviceId || req.ip;
    
    // Verificar se já visualizou nas últimas 24 horas
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const existingViewSnapshot = await db.collection('storyViews')
      .where('storyId', '==', id)
      .where('viewerId', '==', viewerId)
      .where('createdAt', '>', oneDayAgo)
      .limit(1)
      .get();
    
    if (!existingViewSnapshot.empty) {
      // Já visualizou recentemente, apenas atualizar a duração
      const viewDoc = existingViewSnapshot.docs[0];
      const viewData = viewDoc.data();
      
      await viewDoc.ref.update({
        duration: (viewData.duration || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.status(200).json({ message: 'Visualização atualizada' });
    }
    
    // Registrar nova visualização
    await db.collection('storyViews').add({
      storyId: id,
      viewerId,
      duration: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ message: 'Visualização registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
    res.status(500).json({ message: 'Erro ao registrar visualização', error: error.message });
  }
};

// Alternar like
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, deviceId } = req.body;
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    // Verificar se a story está ativa
    const storyData = storyDoc.data();
    
    if (storyData.status !== 'active') {
      return res.status(403).json({ message: 'Esta story não está disponível.' });
    }
    
    // Criar identificador único para o usuário/dispositivo
    const likerId = userId || deviceId || req.ip;
    
    // Verificar se já deu like
    const existingLikeSnapshot = await db.collection('storyLikes')
      .where('storyId', '==', id)
      .where('likerId', '==', likerId)
      .limit(1)
      .get();
    
    if (!existingLikeSnapshot.empty) {
      // Já deu like, remover
      await existingLikeSnapshot.docs[0].ref.delete();
      return res.status(200).json({ message: 'Like removido com sucesso', liked: false });
    }
    
    // Registrar novo like
    await db.collection('storyLikes').add({
      storyId: id,
      likerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ message: 'Like registrado com sucesso', liked: true });
  } catch (error) {
    console.error('Erro ao alternar like:', error);
    res.status(500).json({ message: 'Erro ao alternar like', error: error.message });
  }
};

// Adicionar comentário
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, deviceId, name, comment } = req.body;
    
    // Verificar campos obrigatórios
    if (!comment) {
      return res.status(400).json({ message: 'O comentário é obrigatório.' });
    }
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    // Verificar se a story está ativa
    const storyData = storyDoc.data();
    
    if (storyData.status !== 'active') {
      return res.status(403).json({ message: 'Esta story não está disponível.' });
    }
    
    // Criar identificador único para o usuário/dispositivo
    const commenterId = userId || deviceId || req.ip;
    
    // Registrar novo comentário
    const commentRef = await db.collection('storyComments').add({
      storyId: id,
      commenterId,
      name: name || 'Anônimo',
      comment,
      approved: false, // Comentários precisam ser aprovados
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({
      message: 'Comentário adicionado com sucesso',
      comment: {
        id: commentRef.id,
        name: name || 'Anônimo',
        comment,
        approved: false,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ message: 'Erro ao adicionar comentário', error: error.message });
  }
};

// Excluir comentário
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    
    // Verificar se o comentário existe
    const commentDoc = await db.collection('storyComments').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ message: 'Comentário não encontrado.' });
    }
    
    const commentData = commentDoc.data();
    
    // Verificar se o comentário pertence à story
    if (commentData.storyId !== id) {
      return res.status(400).json({ message: 'Comentário não pertence a esta story.' });
    }
    
    // Verificar permissões
    if (req.user.role !== 'admin_master') {
      // Obter informações da story
      const storyDoc = await storiesCollection.doc(id).get();
      
      if (!storyDoc.exists) {
        return res.status(404).json({ message: 'Story não encontrada.' });
      }
      
      const storyData = storyDoc.data();
      
      if (req.user.role === 'admin_client' && storyData.companyId !== req.user.companyId) {
        return res.status(403).json({ message: 'Você não tem permissão para excluir este comentário.' });
      } else if (req.user.role === 'user' && storyData.createdBy !== req.user.uid) {
        return res.status(403).json({ message: 'Você não tem permissão para excluir este comentário.' });
      }
    }
    
    // Excluir comentário
    await db.collection('storyComments').doc(commentId).delete();
    
    res.status(200).json({ message: 'Comentário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    res.status(500).json({ message: 'Erro ao excluir comentário', error: error.message });
  }
};

// Obter estatísticas da story
exports.getStoryStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    const storyData = storyDoc.data();
    
    // Verificar permissões
    if (req.user.role !== 'admin_master') {
      if (req.user.role === 'admin_client' && storyData.companyId !== req.user.companyId) {
        return res.status(403).json({ message: 'Você não tem permissão para acessar estas estatísticas.' });
      } else if (req.user.role === 'user' && storyData.createdBy !== req.user.uid) {
        return res.status(403).json({ message: 'Você não tem permissão para acessar estas estatísticas.' });
      }
    }
    
    // Definir período de análise
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Obter visualizações
    const viewsSnapshot = await db.collection('storyViews')
      .where('storyId', '==', id)
      .where('createdAt', '>=', startDate)
      .get();
    
    // Obter likes
    const likesSnapshot = await db.collection('storyLikes')
      .where('storyId', '==', id)
      .where('createdAt', '>=', startDate)
      .get();
    
    // Obter comentários
    const commentsSnapshot = await db.collection('storyComments')
      .where('storyId', '==', id)
      .where('createdAt', '>=', startDate)
      .get();
    
    // Calcular estatísticas
    const totalViews = viewsSnapshot.size;
    const totalLikes = likesSnapshot.size;
    const totalComments = commentsSnapshot.size;
    
    // Calcular tempo médio de visualização
    let totalDuration = 0;
    viewsSnapshot.forEach(doc => {
      totalDuration += doc.data().duration || 0;
    });
    
    const avgDuration = totalViews > 0 ? totalDuration / totalViews : 0;
    
    // Calcular taxa de engajamento
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
    
    // Agrupar visualizações por dia
    const viewsByDay = {};
    viewsSnapshot.forEach(doc => {
      const data = doc.data();
      const date = data.createdAt.toDate();
      const day = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      
      if (!viewsByDay[day]) {
        viewsByDay[day] = 0;
      }
      
      viewsByDay[day]++;
    });
    
    // Converter para array
    const viewsTimeline = Object.keys(viewsByDay).map(day => ({
      date: day,
      views: viewsByDay[day]
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    res.status(200).json({
      stats: {
        totalViews,
        totalLikes,
        totalComments,
        avgDuration,
        engagementRate,
        viewsTimeline
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas', error: error.message });
  }
};

// Obter link de compartilhamento
exports.getShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a story existe
    const storyDoc = await storiesCollection.doc(id).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ message: 'Story não encontrada.' });
    }
    
    // Verificar se a story está ativa e pública
    const storyData = storyDoc.data();
    
    if (storyData.status !== 'active') {
      return res.status(403).json({ message: 'Esta story não está disponível.' });
    }
    
    if (storyData.visibility !== 'public') {
      return res.status(403).json({ message: 'Esta story não está disponível publicamente.' });
    }
    
    // Gerar link de compartilhamento
    const shareLink = `${process.env.CLIENT_URL}/stories/${id}`;
    
    res.status(200).json({
      shareLink,
      title: storyData.title,
      description: storyData.description,
      thumbnail: storyData.thumbnail
    });
  } catch (error) {
    console.error('Erro ao obter link de compartilhamento:', error);
    res.status(500).json({ message: 'Erro ao obter link de compartilhamento', error: error.message });
  }
};
