import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, inArray, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type User, users } from '@/db/schema';

export type UserName = Pick<User, 'id' | 'fullName'>;

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

  // Finds the full names of an organization's users among the given ids
  async findNamesByIds(organizationId: string, ids: string[]): Promise<UserName[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(and(eq(users.organizationId, organizationId), inArray(users.id, ids)));
  }

  // Updates the last login timestamp for a user
  async updateLastLogin(id: string): Promise<User> {
    return this.update(id, { lastLoginAt: new Date() });
  }

  // Sets the password hash for a user and marks status as ACTIVE
  async setPassword(id: string, passwordHash: string): Promise<User> {
    return this.update(id, { passwordHash, status: 'ACTIVE', updatedAt: new Date() });
  }

  // Finds a page of users with its total, newest first unless the caller sorts
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: User[]; count: number }> {
    return this.findAllAndCount({
      where: params.where,
      orderBy: params.orderBy.length > 0 ? params.orderBy : [desc(users.createdAt)],
      limit: params.limit,
      offset: params.offset,
    });
  }
}
