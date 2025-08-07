import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // Check if category with this name already exists
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: createCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException(`Category with name "${createCategoryDto.name}" already exists`);
      }

      const category = this.categoryRepository.create(createCategoryDto);
      const savedCategory = await this.categoryRepository.save(category);
      
      this.logger.log(`Created new category: ${savedCategory.name}`);
      return savedCategory;
    } catch (error) {
      this.logger.error(`Failed to create category: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      return await this.categoryRepository.find({
        order: { name: 'ASC' },
        relations: ['leads'],
      });
    } catch (error) {
      this.logger.error(`Failed to fetch categories: ${error.message}`);
      throw error;
    }
  }

  async findActive(): Promise<Category[]> {
    try {
      return await this.categoryRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch active categories: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
        relations: ['leads'],
      });

      if (!category) {
        throw new NotFoundException(`Category with ID "${id}" not found`);
      }

      return category;
    } catch (error) {
      this.logger.error(`Failed to fetch category ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      const category = await this.findOne(id);

      // Check if updating name and it already exists
      if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
        const existingCategory = await this.categoryRepository.findOne({
          where: { name: updateCategoryDto.name },
        });

        if (existingCategory) {
          throw new ConflictException(`Category with name "${updateCategoryDto.name}" already exists`);
        }
      }

      Object.assign(category, updateCategoryDto);
      const savedCategory = await this.categoryRepository.save(category);
      
      this.logger.log(`Updated category: ${savedCategory.name}`);
      return savedCategory;
    } catch (error) {
      this.logger.error(`Failed to update category ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const category = await this.findOne(id);
      
      // Check if category has leads
      if (category.leads && category.leads.length > 0) {
        throw new ConflictException(`Cannot delete category "${category.name}" because it has ${category.leads.length} associated leads`);
      }

      await this.categoryRepository.remove(category);
      this.logger.log(`Deleted category: ${category.name}`);
    } catch (error) {
      this.logger.error(`Failed to delete category ${id}: ${error.message}`);
      throw error;
    }
  }

  async getLeadCount(id: string): Promise<number> {
    try {
      const result = await this.categoryRepository
        .createQueryBuilder('category')
        .leftJoin('category.leads', 'lead')
        .where('category.id = :id', { id })
        .select('COUNT(lead.id)', 'count')
        .getRawOne();

      return parseInt(result.count) || 0;
    } catch (error) {
      this.logger.error(`Failed to get lead count for category ${id}: ${error.message}`);
      throw error;
    }
  }
}