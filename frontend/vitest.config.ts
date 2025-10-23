// PATH: frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

---

// PATH: frontend/src/test/setup.ts
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup aprÃ¨s chaque test
afterEach(() => {
  cleanup();
});

// Mock des API du navigateur
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock de fetch
global.fetch = vi.fn();

---

// PATH: frontend/src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Wrapper pour les tests avec React Router
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

---

// PATH: frontend/src/services/__tests__/analysisService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeByBarcode, analyzeManual } from '../analysisService';
import api from '../apiClient';

vi.mock('../apiClient');

describe('analysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeByBarcode', () => {
    it('should analyze product by barcode', async () => {
      const mockResponse = {
        product: { name: 'Test Product', ean: '1234567890' },
        score: { nutriScore: 'A', novaGroup: 1, ecoScore: 'A' }
      };
      
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);
      
      const result = await analyzeByBarcode('1234567890');
      
      expect(api.get).toHaveBeenCalledWith('/analysis/by-barcode', {
        params: { barcode: '1234567890' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('analyzeManual', () => {
    it('should analyze product manually', async () => {
      const mockResponse = {
        product: { name: 'Manual Product' },
        score: { nutriScore: 'B' }
      };
      
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);
      
      const payload = {
        name: 'Manual Product',
        category: 'food' as const,
        ingredients: 'Water, Sugar'
      };
      
      const result = await analyzeManual(payload);
      
      expect(api.post).toHaveBeenCalledWith('/analysis', {
        mode: 'manual',
        category: 'food',
        name: 'Manual Product',
        ingredients: ['Water', 'Sugar']
      });
      expect(result).toEqual(mockResponse);
    });
  });
});

---

// PATH: frontend/src/components/__tests__/ScoreDisplay.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import ScoreDisplay from '../analysis/ScoreDisplay';

describe('ScoreDisplay', () => {
  it('renders score with correct tone', () => {
    render(<ScoreDisplay label="Test Score" value="A" tone="success" />);
    
    expect(screen.getByText('Test Score')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    
    const container = screen.getByText('Test Score').parentElement;
    expect(container).toHaveClass('bg-green-soft');
  });

  it('renders dash when no value', () => {
    render(<ScoreDisplay label="Empty Score" />);
    
    expect(screen.getByText('â€”')).toBeInTheDocument();
  });

  it('renders hint when provided', () => {
    render(<ScoreDisplay label="Score" value="B" hint="Good choice" />);
    
    expect(screen.getByText('Good choice')).toBeInTheDocument();
  });
});

---

// PATH: frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});

---

// PATH: frontend/e2e/scan-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Scan Flow', () => {
  test('should complete manual analysis', async ({ page }) => {
    // Aller Ã  la page de scan
    await page.goto('/');
    
    // VÃ©rifier que la page charge
    await expect(page.locator('h1')).toContainText('ECOLOJIA');
    
    // SÃ©lectionner l'onglet manuel
    await page.click('text=Saisie manuelle');
    
    // Remplir le formulaire
    await page.fill('input[placeholder*="Yaourt"]', 'Yaourt test');
    await page.selectOption('select', 'food');
    await page.fill('textarea', 'Lait, Sucre, ArÃ´me vanille, E330');
    
    // Soumettre
    await page.click('button:has-text("Analyser")');
    
    // VÃ©rifier la redirection vers les rÃ©sultats
    await expect(page).toHaveURL(/\/result/);
    
    // VÃ©rifier l'affichage des rÃ©sultats
    await expect(page.locator('h1')).toContainText('Yaourt test');
    await expect(page.locator('text=Nutri-Score')).toBeVisible();
    await expect(page.locator('text=NOVA')).toBeVisible();
    await expect(page.locator('text=Eco-Score')).toBeVisible();
  });

  test('should show error for empty form', async ({ page }) => {
    await page.goto('/');
    
    // Essayer de soumettre sans remplir
    await page.click('button:has-text("Analyser")');
    
    // Le formulaire HTML5 devrait empÃªcher la soumission
    await expect(page).toHaveURL('/'); // Toujours sur la mÃªme page
  });
});

---

// PATH: frontend/package.json (mise Ã  jour avec scripts de test)
{
  "name": "ecolojia-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@ericblade/quagga2": "^1.4.1",
    "axios": "^1.7.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.1",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.3.3",
    "@vitest/coverage-v8": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "jsdom": "^23.0.1",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.5.4",
    "vite": "^5.4.8",
    "vite-plugin-pwa": "^0.20.5",
    "vitest": "^1.0.4"
  }
}