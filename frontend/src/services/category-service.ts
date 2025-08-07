import { apiClient } from './api-client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  leadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export const categoryService = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  // Get active categories only
  async getActive(): Promise<Category[]> {
    const response = await apiClient.get('/categories/active');
    return response.data;
  },

  // Get category by ID
  async getById(id: string): Promise<Category> {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  // Create new category
  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  // Update category
  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },

  // Get lead count for category
  async getLeadCount(id: string): Promise<{ categoryId: string; leadCount: number }> {
    const response = await apiClient.get(`/categories/${id}/lead-count`);
    return response.data;
  },
};