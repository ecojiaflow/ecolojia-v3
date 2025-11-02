export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  _id: string;
  productId: string;
  productName: string;
  productScore: number;
  category: MealCategory;
  date: Date | string;
  portion: number;
  notes?: string;
}

export interface MealPlan {
  _id: string;
  userId: string;
  name: string;
  meals: MealItem[];
  startDate: Date | string;
  endDate: Date | string;
  dietaryPreferences: string[];
  targetScore: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MealPlanStats {
  averageScore: number;
  totalMeals: number;
  mealsByCategory: Record<MealCategory, number>;
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

export interface AddMealData {
  productId: string;
  category: MealCategory;
  date: Date | string;
  portion?: number;
  notes?: string;
}