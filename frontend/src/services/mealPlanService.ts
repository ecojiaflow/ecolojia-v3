import axios from 'axios';
import type { MealPlan, AddMealData, MealPlanStats } from '../types/mealPlan';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('ecolojia_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const mealPlanService = {
  async createMealPlan(data: Partial<MealPlan>): Promise<MealPlan> {
    const response = await axios.post(
      `${API_URL}/api/meal-plan`,
      data,
      getAuthHeaders()
    );
    return response.data.mealPlan;
  },

  async getMealPlans(): Promise<MealPlan[]> {
    const response = await axios.get(
      `${API_URL}/api/meal-plan`,
      getAuthHeaders()
    );
    return response.data.mealPlans;
  },

  async getMealPlanById(id: string): Promise<MealPlan> {
    const response = await axios.get(
      `${API_URL}/api/meal-plan/${id}`,
      getAuthHeaders()
    );
    return response.data.mealPlan;
  },

  async addMealToPlan(planId: string, mealData: AddMealData): Promise<MealPlan> {
    const response = await axios.post(
      `${API_URL}/api/meal-plan/${planId}/meals`,
      mealData,
      getAuthHeaders()
    );
    return response.data.mealPlan;
  },

  async removeMeal(planId: string, mealId: string): Promise<MealPlan> {
    const response = await axios.delete(
      `${API_URL}/api/meal-plan/${planId}/meals/${mealId}`,
      getAuthHeaders()
    );
    return response.data.mealPlan;
  },

  async updateMeal(planId: string, mealId: string, updates: Partial<AddMealData>): Promise<MealPlan> {
    const response = await axios.put(
      `${API_URL}/api/meal-plan/${planId}/meals/${mealId}`,
      updates,
      getAuthHeaders()
    );
    return response.data.mealPlan;
  },

  async deleteMealPlan(planId: string): Promise<void> {
    await axios.delete(
      `${API_URL}/api/meal-plan/${planId}`,
      getAuthHeaders()
    );
  },

  async getStats(planId: string): Promise<MealPlanStats> {
    const response = await axios.get(
      `${API_URL}/api/meal-plan/${planId}/stats`,
      getAuthHeaders()
    );
    return response.data.stats;
  }
};