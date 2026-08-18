import { Field, ID, ObjectType } from '@nestjs/graphql';

/**
 * One scope an app may act within.
 *
 * `kind` is what the caller turns into a header — `site` → `x-site-id`,
 * `group` → `x-sg-id`, `le` → `x-le-id` — which is how core learns the scope without
 * needing a separate field for it. `@vritti/core-sdk` does that mapping.
 */
@ObjectType()
export class WorkspaceOption {
  @Field(() => String)
  kind: 'site' | 'group' | 'le';

  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  code: string;

  /**
   * The legal entity a site belongs to, and the parent group where there is one.
   *
   * Enough for a caller to render the options in their real hierarchy rather than as
   * three flat lists, without a second round trip.
   */
  @Field(() => ID, { nullable: true })
  parentId?: string | null;
}

/**
 * Every scope the calling app's organization has.
 *
 * Deliberately one query rather than three: a client picking a scope wants to see the
 * options together, and it is one round trip instead of three. Leaner than the staff
 * `StructureResponseDto`, which also carries tax registrations and organization detail
 * an app has no use for.
 *
 * The organization itself is never listed — it comes from the app credential, and
 * organization scope is expressed by sending no workspace header at all.
 */
@ObjectType()
export class Workspaces {
  @Field(() => [WorkspaceOption])
  legalEntities: WorkspaceOption[];

  @Field(() => [WorkspaceOption])
  siteGroups: WorkspaceOption[];

  @Field(() => [WorkspaceOption])
  sites: WorkspaceOption[];
}
