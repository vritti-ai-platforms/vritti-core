import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { type NewUser, type User, users } from '@/db/schema';

@Injectable()
export class UserRepository extends PrimaryBaseRepository<typeof users> {
  constructor(database: PrimaryDatabaseService) {
    super(database, users);
  }

  // Finds a user by email address
  async findByEmail(email: string): Promise<User | undefined> {
    return this.model.findFirst({
      where: { email },
    });
  }

  // Creates or updates a portal user by email (idempotent)
  async upsertByEmail(data: NewUser): Promise<User> {
    const results = await this.db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          fullName: data.fullName,
          role: data.role,
          organizationId: data.organizationId,
          updatedAt: new Date(),
        },
      })
      .returning();
    return results[0] as User;
  }

  // Updates the last login timestamp for a user
  async updateLastLogin(id: string): Promise<User> {
    return this.update(id, { lastLoginAt: new Date() });
  }

  // Sets the password hash for a user and marks status as ACTIVE
  async setPassword(id: string, passwordHash: string): Promise<User> {
    return this.update(id, { passwordHash, status: 'ACTIVE', updatedAt: new Date() });
  }

  // Finds all users belonging to an organisation
  async findByOrganizationId(organizationId: string): Promise<User[]> {
    return this.model.findMany({
      where: { organizationId },
    });
  }
}
