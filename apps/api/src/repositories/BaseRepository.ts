import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';

/**
 * Base repository interface for CRUD operations
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findAll(filter?: FilterQuery<T>, options?: FindAllOptions): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, updates: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: FilterQuery<T>): Promise<number>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
}

export interface FindAllOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  select?: string;
}

/**
 * Abstract base repository implementation for MongoDB with Mongoose
 */
export abstract class BaseRepository<T extends Document> implements IRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async findAll(filter: FilterQuery<T> = {}, options: FindAllOptions = {}): Promise<T[]> {
    let query = this.model.find(filter);

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.select) {
      // Use type assertion to avoid complex TypeScript inference issues
      (query as any).select(options.select);
    }

    return query.exec();
  }

  async create(entity: Partial<T>): Promise<T> {
    const created = new this.model(entity);
    return created.save();
  }

  async update(id: string, updates: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  /**
   * Find with pagination support
   */
  async findPaginated(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec()
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}