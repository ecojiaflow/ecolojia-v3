// backend/src/services/circuitBreaker.js
const EventEmitter = require('events');

/**
 * Circuit Breaker Pattern pour gérer les défaillances des services externes
 * États: CLOSED (normal) -> OPEN (erreur) -> HALF_OPEN (test) -> CLOSED/OPEN
 */
class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.name = options.name || 'CircuitBreaker';
    this.timeout = options.timeout || 5000; // Timeout de requête (ms)
    this.errorThreshold = options.errorThreshold || 5; // Nombre d'erreurs avant ouverture
    this.successThreshold = options.successThreshold || 2; // Succès requis en HALF_OPEN
    this.resetTimeout = options.resetTimeout || 60000; // Temps avant de réessayer (ms)
    this.volumeThreshold = options.volumeThreshold || 10; // Requêtes min pour calculer le taux
    this.errorPercentageThreshold = options.errorPercentageThreshold || 50; // % d'erreur pour ouvrir
    
    // État
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    this.requestCount = 0;
    
    // Métriques
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalTimeouts: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      stateChanges: []
    };
    
    // Fenêtre glissante pour le calcul du taux d'erreur
    this.requestWindow = [];
    this.windowSize = 60000; // 1 minute
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTHODE PRINCIPALE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Exécute une fonction avec protection du circuit breaker
   * @param {Function} fn - Fonction à exécuter
   * @param {Function} fallback - Fonction de fallback optionnelle
   * @returns {Promise} Résultat de la fonction ou du fallback
   */
  async execute(fn, fallback) {
    // Vérifier l'état du circuit
    if (!this.canAttempt()) {
      this.metrics.totalRequests++;
      
      // Si fallback disponible, l'utiliser
      if (fallback) {
        return this.executeFallback(fallback);
      }
      
      throw new CircuitBreakerError(
        `Circuit breaker is OPEN for ${this.name}`,
        'CIRCUIT_OPEN',
        this.getStatus()
      );
    }

    try {
      // Exécuter avec timeout
      const result = await this.executeWithTimeout(fn);
      
      // Succès
      this.onSuccess();
      return result;
      
    } catch (error) {
      // Échec
      this.onFailure(error);
      
      // Si fallback disponible et circuit ouvert, l'utiliser
      if (fallback && this.state === 'OPEN') {
        return this.executeFallback(fallback);
      }
      
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GESTION DES ÉTATS
  // ═══════════════════════════════════════════════════════════════════════

  canAttempt() {
    if (this.state === 'CLOSED' || this.state === 'HALF_OPEN') {
      return true;
    }
    
    // En état OPEN, vérifier si on peut passer en HALF_OPEN
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.transitionTo('HALF_OPEN');
      return true;
    }
    
    return false;
  }

  onSuccess() {
    this.metrics.totalRequests++;
    this.metrics.totalSuccesses++;
    this.metrics.consecutiveSuccesses++;
    this.metrics.consecutiveFailures = 0;
    this.metrics.lastSuccessTime = new Date();
    
    // Ajouter à la fenêtre glissante
    this.updateRequestWindow(true);
    
    switch (this.state) {
      case 'HALF_OPEN':
        this.successes++;
        if (this.successes >= this.successThreshold) {
          this.transitionTo('CLOSED');
        }
        break;
        
      case 'CLOSED':
        this.failures = 0;
        break;
    }
    
    this.emit('success', {
      state: this.state,
      metrics: this.getMetrics()
    });
  }

  onFailure(error) {
    this.metrics.totalRequests++;
    this.metrics.totalFailures++;
    this.metrics.consecutiveFailures++;
    this.metrics.consecutiveSuccesses = 0;
    this.metrics.lastFailureTime = new Date();
    
    if (error.code === 'TIMEOUT') {
      this.metrics.totalTimeouts++;
    }
    
    // Ajouter à la fenêtre glissante
    this.updateRequestWindow(false);
    
    switch (this.state) {
      case 'CLOSED':
        this.failures++;
        
        // Vérifier le seuil basé sur le nombre OU le pourcentage
        const shouldOpen = this.shouldOpenCircuit();
        
        if (shouldOpen) {
          this.transitionTo('OPEN');
        }
        break;
        
      case 'HALF_OPEN':
        this.transitionTo('OPEN');
        break;
    }
    
    this.emit('failure', {
      error,
      state: this.state,
      metrics: this.getMetrics()
    });
  }

  shouldOpenCircuit() {
    // Seuil basé sur le nombre d'erreurs consécutives
    if (this.failures >= this.errorThreshold) {
      return true;
    }
    
    // Seuil basé sur le pourcentage d'erreurs
    const recentRequests = this.getRecentRequests();
    if (recentRequests.length >= this.volumeThreshold) {
      const errorRate = this.calculateErrorRate(recentRequests);
      return errorRate >= this.errorPercentageThreshold;
    }
    
    return false;
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    
    // Enregistrer le changement
    this.metrics.stateChanges.push({
      from: oldState,
      to: newState,
      timestamp: new Date(),
      metrics: {
        failures: this.failures,
        successes: this.successes,
        errorRate: this.calculateErrorRate(this.getRecentRequests())
      }
    });
    
    switch (newState) {
      case 'OPEN':
        this.nextAttempt = Date.now() + this.resetTimeout;
        this.emit('open', {
          previousState: oldState,
          resetTime: new Date(this.nextAttempt)
        });
        break;
        
      case 'HALF_OPEN':
        this.successes = 0;
        this.failures = 0;
        this.emit('halfOpen', {
          previousState: oldState
        });
        break;
        
      case 'CLOSED':
        this.failures = 0;
        this.successes = 0;
        this.emit('close', {
          previousState: oldState
        });
        break;
    }
    
    this.emit('stateChange', {
      from: oldState,
      to: newState,
      metrics: this.getMetrics()
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════════════════

  async executeWithTimeout(fn) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new CircuitBreakerError('Request timeout', 'TIMEOUT'));
      }, this.timeout);
      
      try {
        const result = await fn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  async executeFallback(fallback) {
    try {
      const result = await fallback();
      
      this.emit('fallback', {
        state: this.state,
        success: true
      });
      
      return result;
    } catch (error) {
      this.emit('fallback', {
        state: this.state,
        success: false,
        error
      });
      
      throw error;
    }
  }

  updateRequestWindow(success) {
    const now = Date.now();
    
    // Ajouter la nouvelle requête
    this.requestWindow.push({
      timestamp: now,
      success
    });
    
    // Nettoyer les anciennes requêtes
    this.requestWindow = this.requestWindow.filter(
      req => now - req.timestamp < this.windowSize
    );
  }

  getRecentRequests() {
    const now = Date.now();
    return this.requestWindow.filter(
      req => now - req.timestamp < this.windowSize
    );
  }

  calculateErrorRate(requests) {
    if (requests.length === 0) return 0;
    
    const failures = requests.filter(req => !req.success).length;
    return (failures / requests.length) * 100;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTHODES PUBLIQUES
  // ═══════════════════════════════════════════════════════════════════════

  getStatus() {
    const recentRequests = this.getRecentRequests();
    const errorRate = this.calculateErrorRate(recentRequests);
    
    return {
      state: this.state,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt) : null,
      metrics: {
        ...this.metrics,
        recentRequestCount: recentRequests.length,
        recentErrorRate: errorRate.toFixed(2) + '%'
      }
    };
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    this.requestWindow = [];
    
    this.emit('reset', {
      metrics: this.getMetrics()
    });
  }

  // Pour les tests
  forceOpen() {
    this.transitionTo('OPEN');
  }

  forceClosed() {
    this.transitionTo('CLOSED');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ERREUR PERSONNALISÉE
// ═══════════════════════════════════════════════════════════════════════

class CircuitBreakerError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.code = code;
    this.status = status;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// FACTORY POUR CRÉER DES CIRCUIT BREAKERS
// ═══════════════════════════════════════════════════════════════════════

class CircuitBreakerFactory {
  constructor() {
    this.breakers = new Map();
  }

  create(name, options = {}) {
    if (this.breakers.has(name)) {
      return this.breakers.get(name);
    }
    
    const breaker = new CircuitBreaker({ name, ...options });
    this.breakers.set(name, breaker);
    
    return breaker;
  }

  get(name) {
    return this.breakers.get(name);
  }

  getAll() {
    return Array.from(this.breakers.values());
  }

  getStatus() {
    const status = {};
    
    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getStatus();
    }
    
    return status;
  }

  reset(name) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION SPÉCIFIQUE POUR DEEPSEEK
// ═══════════════════════════════════════════════════════════════════════

const deepSeekCircuitBreaker = new CircuitBreaker({
  name: 'DeepSeek_AI',
  timeout: 10000, // 10 secondes
  errorThreshold: 3, // 3 erreurs consécutives
  successThreshold: 2, // 2 succès pour fermer
  resetTimeout: 30000, // 30 secondes avant retry
  volumeThreshold: 5, // Min 5 requêtes pour calculer le %
  errorPercentageThreshold: 60 // 60% d'erreur
});

// Événements spécifiques DeepSeek
deepSeekCircuitBreaker.on('open', ({ resetTime }) => {
  console.error(`[CircuitBreaker] DeepSeek AI circuit OPEN. Retry at ${resetTime}`);
});

deepSeekCircuitBreaker.on('halfOpen', () => {
  console.log('[CircuitBreaker] DeepSeek AI circuit HALF-OPEN. Testing...');
});

deepSeekCircuitBreaker.on('close', () => {
  console.log('[CircuitBreaker] DeepSeek AI circuit CLOSED. Service recovered.');
});

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

module.exports = {
  CircuitBreaker,
  CircuitBreakerError,
  CircuitBreakerFactory,
  deepSeekCircuitBreaker,
  
  // Factory singleton
  factory: new CircuitBreakerFactory()
};