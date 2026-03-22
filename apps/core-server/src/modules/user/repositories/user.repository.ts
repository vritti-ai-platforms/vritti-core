import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type NewUser, type User, users } from '@/db/schema';

@Injectable()
export class UserRepository extends PrimaryBaseRepository<typeof users> {
  constructor(database: PrimaryDatabaseService) {
    super(database, users);
  }

  // Finds a user by email address (first match across all orgs)
  async findByEmail(email: string): Promise<User | undefined> {
    return this.model.findFirst({
      where: { email },
    });
  }

  // Finds a user by email within a specific organization
  async findByEmailAndOrg(email: string, organizationId: string): Promise<User | undefined> {
    return this.model.findFirst({
      where: { email, organizationId },
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

  // Finds paginated users with filtering, sorting, and search for table display
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL;
    limit: number;
    offset: number;
  }): Promise<{ rows: User[]; total: number }> {
    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(params.where),
      this.db
        .select()
        .from(users)
        .where(params.where)
        .orderBy(params.orderBy)
        .limit(params.limit)
        .offset(params.offset),
    ]);

    return {
      rows: rows as User[],
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}
