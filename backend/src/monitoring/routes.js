const express = require('express');
const { metrics } = require('../monitoring/metrics');
const { logInfo } = require('../monitoring/logs');
const router = express.Router();

/**
 * Routes de monitoring pour ECOLOJIA V3
 * Module M12 - Monitoring & Production
 */

// GET /api/monitoring/health - Santé détaillée
router.get('/health', (req, res) => {
  try {
    const healthMetrics = metrics.getHealthMetrics();
    
    // Vérifications supplémentaires
    const checks = {
      database: true, // TODO: ping MongoDB
      redis: true,    // TODO: ping Redis si utilisé
      external: true  // TODO: ping services externes
    };
    
    const overallHealth = healthMetrics.status === 'healthy' && 
                         Object.values(checks).every(Boolean);
    
    logInfo('Health check requested', {
      status: healthMetrics.status,
      checks,
      requestIP: req.ip
    });
    
    res.status(overallHealth ? 200 : 503).json({
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'ecolojia-backend',
      version: '3.0.0',
      module: 'M12',
      health: healthMetrics,
      checks
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// GET /api/monitoring/metrics - Métriques complètes
router.get('/metrics', (req, res) => {
  try {
    const report = metrics.getReport();
    
    logInfo('Metrics requested', {
      requestIP: req.ip,
      totalRequests: report.requests.total
    });
    
    res.json({
      service: 'ecolojia-backend',
      version: '3.0.0',
      module: 'M12',
      ...report
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// GET /api/monitoring/stats - Stats simples pour dashboard
router.get('/stats', (req, res) => {
  try {
    const healthMetrics = metrics.getHealthMetrics();
    const report = metrics.getReport();
    
    res.json({
      status: healthMetrics.status,
      requests: {
        total: report.requests.total,
        perHour: report.performance.requestsPerHour,
        errorRate: report.performance.errorRate
      },
      scans: {
        total: report.scans.total,
        successRate: report.scans.total > 0 ? 
          Math.round((report.scans.successful / report.scans.total) * 100) : 100
      },
      performance: {
        avgResponseTime: report.performance.avgResponseTime,
        memoryUsage: report.memory.usage
      },
      uptime: report.uptime.human
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve stats',
      message: error.message
    });
  }
});

// POST /api/monitoring/reset - Reset métriques (dev only)
router.post('/reset', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'Reset only available in development'
    });
  }
  
  try {
    metrics.reset();
    logInfo('Metrics reset requested', { requestIP: req.ip });
    
    res.json({
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset metrics',
      message: error.message
    });
  }
});

// GET /api/monitoring/version - Info version
router.get('/version', (req, res) => {
  res.json({
    service: 'ecolojia-backend',
    version: '3.0.0',
    module: 'M12-monitoring',
    environment: process.env.NODE_ENV,
    buildHash: process.env.BUILD_HASH || 'local-dev',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
