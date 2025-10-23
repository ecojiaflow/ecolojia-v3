class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byStatus: {},
        byRoute: {},
        avgResponseTime: 0
      },
      scans: {
        total: 0,
        successful: 0,
        failed: 0,
        byType: { barcode: 0, ocr: 0, manual: 0 }
      },
      database: {
        queries: 0,
        errors: 0,
        avgQueryTime: 0
      },
      memory: {
        usage: 0,
        peak: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };
    
    this.startTime = Date.now();
    this.responseTimes = [];
    this.queryTimes = [];
  }

  recordRequest(method, route, status, responseTime) {
    this.metrics.requests.total++;
    
    this.metrics.requests.byStatus[status] = (this.metrics.requests.byStatus[status] || 0) + 1;
    
    const routeKey = method + ' ' + route;
    this.metrics.requests.byRoute[routeKey] = (this.metrics.requests.byRoute[routeKey] || 0) + 1;
    
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
    
    this.metrics.requests.avgResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  recordScan(type, success, details = {}) {
    this.metrics.scans.total++;
    this.metrics.scans.byType[type] = (this.metrics.scans.byType[type] || 0) + 1;
    
    if (success) {
      this.metrics.scans.successful++;
    } else {
      this.metrics.scans.failed++;
    }
    
    console.log('Scan ' + type + ': ' + (success ? 'SUCCESS' : 'FAILED'), details);
  }

  recordQuery(queryTime, success = true) {
    this.metrics.database.queries++;
    
    if (!success) {
      this.metrics.database.errors++;
    }
    
    this.queryTimes.push(queryTime);
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
    
    this.metrics.database.avgQueryTime = 
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
  }

  recordError(error, type = 'unknown') {
    this.metrics.errors.total++;
    this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1;
    
    console.log('Error recorded: ' + type + ' - ' + error.message);
  }

  updateSystemMetrics() {
    const used = process.memoryUsage();
    this.metrics.memory.usage = Math.round(used.heapUsed / 1024 / 1024);
    this.metrics.memory.peak = Math.max(this.metrics.memory.peak, this.metrics.memory.usage);
  }

  getReport() {
    this.updateSystemMetrics();
    
    const uptime = Date.now() - this.startTime;
    const uptimeHours = Math.round(uptime / (1000 * 60 * 60) * 100) / 100;
    
    return {
      timestamp: new Date().toISOString(),
      uptime: {
        ms: uptime,
        hours: uptimeHours,
        human: this.formatUptime(uptime)
      },
      performance: {
        requestsPerHour: Math.round(this.metrics.requests.total / uptimeHours),
        avgResponseTime: Math.round(this.metrics.requests.avgResponseTime),
        avgQueryTime: Math.round(this.metrics.database.avgQueryTime),
        errorRate: this.metrics.requests.total > 0 ? 
          Math.round((this.metrics.errors.total / this.metrics.requests.total) * 100 * 100) / 100 : 0
      },
      ...this.metrics
    };
  }

  getHealthMetrics() {
    this.updateSystemMetrics();
    
    const errorRate = this.metrics.requests.total > 0 ? 
      (this.metrics.errors.total / this.metrics.requests.total) * 100 : 0;
    
    const scanSuccessRate = this.metrics.scans.total > 0 ?
      (this.metrics.scans.successful / this.metrics.scans.total) * 100 : 100;
    
    const status = this.determineHealthStatus(errorRate, scanSuccessRate);
    
    return {
      status,
      metrics: {
        totalRequests: this.metrics.requests.total,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(this.metrics.requests.avgResponseTime),
        scanSuccessRate: Math.round(scanSuccessRate * 100) / 100,
        memoryUsage: this.metrics.memory.usage,
        uptime: Date.now() - this.startTime
      }
    };
  }

  determineHealthStatus(errorRate, scanSuccessRate) {
    if (errorRate > 10 || scanSuccessRate < 80 || this.metrics.memory.usage > 500) {
      return 'unhealthy';
    } else if (errorRate > 5 || scanSuccessRate < 90 || this.metrics.memory.usage > 300) {
      return 'degraded';
    }
    return 'healthy';
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return days + 'd ' + (hours % 24) + 'h ' + (minutes % 60) + 'm';
    if (hours > 0) return hours + 'h ' + (minutes % 60) + 'm';
    if (minutes > 0) return minutes + 'm ' + (seconds % 60) + 's';
    return seconds + 's';
  }

  reset() {
    this.metrics = {
      requests: { total: 0, byStatus: {}, byRoute: {}, avgResponseTime: 0 },
      scans: { total: 0, successful: 0, failed: 0, byType: { barcode: 0, ocr: 0, manual: 0 } },
      database: { queries: 0, errors: 0, avgQueryTime: 0 },
      memory: { usage: 0, peak: 0 },
      errors: { total: 0, byType: {} }
    };
    this.startTime = Date.now();
    this.responseTimes = [];
    this.queryTimes = [];
  }
}

const metrics = new MetricsCollector();

const metricsMiddleware = (req, res, next) => {
  if (!process.env.METRICS_ENABLED) {
    return next();
  }

  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    
    metrics.recordRequest(req.method, route, res.statusCode, responseTime);
  });
  
  next();
};

const startMetricsCollection = () => {
  if (process.env.METRICS_ENABLED === 'true') {
    setInterval(() => {
      metrics.updateSystemMetrics();
    }, 30000);
    
    console.log('Collecte de métriques démarrée');
  }
};

module.exports = {
  metrics,
  metricsMiddleware,
  startMetricsCollection,
  MetricsCollector
};
