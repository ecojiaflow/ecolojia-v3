// POST /api/algolia/configure - Configurer l'index
router.post('/configure', asyncHandler(async (req, res) => {
  try {
    await algoliaService.configureIndex();
    res.json({ success: true, message: 'Index configuré' });
  } catch (error) {
    console.log('Configuration échouée, mais index utilisable:', error.message);
    res.json({ 
      success: true, 
      message: 'Index déjà configuré ou configuration partielle',
      warning: error.message 
    });
  }
}));
