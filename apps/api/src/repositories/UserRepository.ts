import { FilterQuery } from 'mongoose';
import { User } from '../models/User.js';
import { BaseRepository } from './BaseRepository.js';
import type { IUser } from '../models/User.js';

export interface UserFilter {
  email?: string;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED';
  createdAtFrom?: Date;
  createdAtTo?: Date;
  search?: string;
}

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Find users with advanced filtering
   */
  async findUsers(filter: UserFilter = {}): Promise<IUser[]> {
    const query: FilterQuery<IUser> = {};

    if (filter.email) {
      query.email = { $regex: filter.email, $options: 'i' };
    }

    if (filter.role) {
      query.role = filter.role;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.createdAtFrom || filter.createdAtTo) {
      query.createdAt = {};
      if (filter.createdAtFrom) {
        query.createdAt.$gte = filter.createdAtFrom;
      }
      if (filter.createdAtTo) {
        query.createdAt.$lte = filter.createdAtTo;
      }
    }

    if (filter.search) {
      query.$or = [
        { email: { $regex: filter.search, $options: 'i' } }
      ];
    }

    return this.findAll(query, { sort: { createdAt: -1 } });
  }

  /**
   * Find active users
   */
  async findActiveUsers(): Promise<IUser[]> {
    return this.findUsers({ status: 'ACTIVE' });
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<IUser | null> {
    return this.update(userId, { status });
  }

  /**
   * Update user role
   */
  async updateRole(userId: string, role: 'USER' | 'ADMIN'): Promise<IUser | null> {
    return this.update(userId, { role });
  }

  /**
   * Update user password hash
   */
  async updatePassword(userId: string, passwordHash: string): Promise<IUser | null> {
    return this.update(userId, { passwordHash });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase().trim() });
  }

  /**
   * Create user with validation
   */
  async createUser(userData: { email: string; passwordHash: string; role?: 'USER' | 'ADMIN' }): Promise<IUser> {
    const { email, passwordHash, role = 'USER' } = userData;
    
    // Check if email already exists
    if (await this.emailExists(email)) {
      throw new Error('Email already exists');
    }

    return this.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      status: 'ACTIVE'
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    admins: number;
    users: number;
  }> {
    const [total, active, suspended, admins, users] = await Promise.all([
      this.count(),
      this.count({ status: 'ACTIVE' }),
      this.count({ status: 'SUSPENDED' }),
      this.count({ role: 'ADMIN' }),
      this.count({ role: 'USER' })
    ]);

    return { total, active, suspended, admins, users };
  }

  /**
   * Search users by email or other criteria
   */
  async searchUsers(searchTerm: string, limit: number = 20): Promise<IUser[]> {
    return this.findAll(
      {
        $or: [
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      },
      { limit, sort: { createdAt: -1 } }
    );
  }
}

// Singleton instance for dependency injection
export const userRepository = new UserRepository();