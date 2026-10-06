import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type User, users } from '@/db/schema';

@Injectable()
export class UserDomainRepository extends PrimaryBaseRepository<typeof users> {
  constructor(database: PrimaryDatabaseService) {
    super(database, users);
  }

  // Finds a user by email address (first match across all orgs)
  async findByEmail(email: string): Promise<User | undefined> {
    return this.model.findFirst({
      where: { email },
    });
  }

  // Finds all users with the given email across all organizations, including organization data
  async findAllByEmailWithOrg(email: string): Promise<
    (User & {
      organization: {
        id: string;
        name: string;
        subdomain: string;
        logoLightUrl: string | null;
        logoDarkUrl: string | null;
      };
    })[]
  > {
    return this.model.findMany({
      where: { email },
      with: { organization: true },
    }) as Promise<
      (User & {
        organization: {
          id: string;
          name: string;
          subdomain: string;
          logoLightUrl: string | null;
          logoDarkUrl: string | null;
        };
      })[]
    >;
  }

  // Finds a user by email within a specific organization
  async findByEmailAndOrg(email: string, organizationId: string): Promise<User | undefined> {
    return this.model.findFirst({
      where: { email, organizationId },
    });
  }

  // Updates the last login timestamp for a user
  async updateLastLogin(id: string): Promise<User> {
    return this.update(id, { lastLoginAt: new Date() });
  }

  // Sets the password hash for a user and marks status as ACTIVE
  async setPassword(id: string, passwordHash: string): Promise<User> {
    return this.update(id, { passwordHash, status: 'ACTIVE', updatedAt: new Date() });
  }

  // Finds paginated users with filtering, sorting, and search for table display
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL;
    limit: number;
    offset: number;
  }): Promise<{ rows: User[]; total: number }> {
    const [countResult, rows] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(users).where(params.where),
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
