// PATH: frontend/src/services/historyService.ts
import { API_BASE_URL } from '../config/constants';

interface HistoryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  category?: string;
}

class HistoryService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getHistory(options: HistoryOptions = {}): Promise<any> {
    const params = new URLSearchParams({
      page: String(options.page || 1),
      limit: String(options.limit || 12),
      sortBy: options.sortBy || 'date',
      sortOrder: options.sortOrder || 'desc',
      ...(options.category && { category: options.category })
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/history?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`History error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }

  async getHistoryCount(category?: string): Promise<number> {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '1',
        ...(category && { category })
      });

      const response = await fetch(`${API_BASE_URL}/api/history?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.pagination?.total || data.total || 0;
    } catch (error) {
      console.error('Error fetching history count:', error);
      return 0;
    }
  }
}

export const historyService = new HistoryService();

export default historyService;
