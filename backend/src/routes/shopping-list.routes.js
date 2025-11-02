const express = require('express');
const router = express.Router();
const ShoppingList = require('../models/ShoppingList');
const { authenticateUser } = require('../middleware');

// Middleware auth obligatoire pour toutes les routes
router.use(authenticateUser);

// GET /api/shopping-lists - Récupérer toutes les listes de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const lists = await ShoppingList.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();
    
    res.json({ success: true, lists });
  } catch (error) {
    console.error('Erreur GET shopping-lists:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/shopping-lists - Créer une nouvelle liste
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Nom de liste requis' });
    }
    
    const newList = new ShoppingList({
      userId: req.user._id,
      name: name.trim(),
      items: []
    });
    
    await newList.save();
    
    res.status(201).json({ success: true, list: newList });
  } catch (error) {
    console.error('Erreur POST shopping-lists:', error);
    res.status(500).json({ success: false, error: 'Erreur création liste' });
  }
});

// POST /api/shopping-lists/:listId/items - Ajouter un item
router.post('/:listId/items', async (req, res) => {
  try {
    const { listId } = req.params;
    const { productId, name, quantity, unit, category, score } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Nom du produit requis' });
    }
    
    const list = await ShoppingList.findOne({ _id: listId, userId: req.user._id });
    
    if (!list) {
      return res.status(404).json({ success: false, error: 'Liste non trouvée' });
    }
    
    const newItem = {
      productId: productId || undefined,
      name: name.trim(),
      quantity: quantity || 1,
      unit: unit || 'unite',
      category: category || 'autres',
      checked: false,
      score: score || undefined
    };
    
    list.items.push(newItem);
    await list.save();
    
    res.json({ success: true, list });
  } catch (error) {
    console.error('Erreur POST item:', error);
    res.status(500).json({ success: false, error: 'Erreur ajout item' });
  }
});

// PATCH /api/shopping-lists/:listId/items/:itemId/toggle - Toggle checked
router.patch('/:listId/items/:itemId/toggle', async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    
    const list = await ShoppingList.findOne({ _id: listId, userId: req.user._id });
    
    if (!list) {
      return res.status(404).json({ success: false, error: 'Liste non trouvée' });
    }
    
    const item = list.items.id(itemId);
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item non trouvé' });
    }
    
    item.checked = !item.checked;
    await list.save();
    
    res.json({ success: true, list });
  } catch (error) {
    console.error('Erreur PATCH toggle:', error);
    res.status(500).json({ success: false, error: 'Erreur toggle item' });
  }
});

// DELETE /api/shopping-lists/:listId/items/:itemId - Supprimer un item
router.delete('/:listId/items/:itemId', async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    
    const list = await ShoppingList.findOne({ _id: listId, userId: req.user._id });
    
    if (!list) {
      return res.status(404).json({ success: false, error: 'Liste non trouvée' });
    }
    
    list.items.pull(itemId);
    await list.save();
    
    res.json({ success: true, list });
  } catch (error) {
    console.error('Erreur DELETE item:', error);
    res.status(500).json({ success: false, error: 'Erreur suppression item' });
  }
});

// PUT /api/shopping-lists/:listId - Mettre à jour une liste entière
router.put('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, items } = req.body;
    
    const list = await ShoppingList.findOne({ _id: listId, userId: req.user._id });
    
    if (!list) {
      return res.status(404).json({ success: false, error: 'Liste non trouvée' });
    }
    
    if (name) list.name = name.trim();
    if (items) list.items = items;
    
    await list.save();
    
    res.json({ success: true, list });
  } catch (error) {
    console.error('Erreur PUT shopping-list:', error);
    res.status(500).json({ success: false, error: 'Erreur mise à jour liste' });
  }
});

// DELETE /api/shopping-lists/:listId - Supprimer une liste
router.delete('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    
    const result = await ShoppingList.deleteOne({ _id: listId, userId: req.user._id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Liste non trouvée' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE shopping-list:', error);
    res.status(500).json({ success: false, error: 'Erreur suppression liste' });
  }
});

// POST /api/shopping-lists/optimize - Optimiser liste avec IA (placeholder)
router.post('/optimize', async (req, res) => {
  try {
    // Pour l'instant, retourner un fallback
    // À implémenter avec DeepSeek si besoin
    res.json({ 
      success: true, 
      replacements: [],
      message: 'Optimisation IA en développement' 
    });
  } catch (error) {
    console.error('Erreur optimize:', error);
    res.status(500).json({ success: false, error: 'Erreur optimisation' });
  }
});

module.exports = router;