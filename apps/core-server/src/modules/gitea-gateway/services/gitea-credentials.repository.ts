import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { type GiteaCredentials, giteaCredentials } from '@/db/schema';

// The fields the agent writes when it provisions or rotates the singleton credentials row
export interface GiteaCredentialsUpsert {
  baseUrl: string;
  coreToken: string;
  pullToken: string;
}

@Injectable()
export class GiteaCredentialsRepository extends PrimaryBaseRepository<typeof giteaCredentials> {
  constructor(database: PrimaryDatabaseService) {
    super(database, giteaCredentials);
  }

  // Reads the singleton credentials row, or undefined before the agent has provisioned it
  async get(): Promise<GiteaCredentials | undefined> {
    return this.model.findFirst();
  }

  // Writes the agent-provisioned tokens into the id=1 singleton, inserting the row or rotating it in place
  async upsert({ baseUrl, coreToken, pullToken }: GiteaCredentialsUpsert): Promise<void> {
    await this.db
      .insert(giteaCredentials)
      .values({ id: 1, baseUrl, coreToken, pullToken, rotatedAt: sql`now()`, updatedAt: sql`now()` })
      .onConflictDoUpdate({
        target: giteaCredentials.id,
        set: { baseUrl, coreToken, pullToken, rotatedAt: sql`now()`, updatedAt: sql`now()` },
      });
  }
}
