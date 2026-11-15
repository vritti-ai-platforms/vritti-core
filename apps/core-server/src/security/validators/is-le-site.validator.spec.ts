import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { plainToInstance } from 'class-transformer';
import { IsUUID, useContainer, validate } from 'class-validator';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';
import { WorkspaceContextService } from '../services/workspace-context.service';
import { IsLeSite, IsLeSiteConstraint } from './is-le-site.validator';

const LE_ID = '019a0000-0000-7000-8000-000000000001';
const OTHER_LE_ID = '019a0000-0000-7000-8000-000000000002';
const OWN_SITE = '019a0000-0000-7000-8000-00000000000a';
const OTHER_SITE = '019a0000-0000-7000-8000-00000000000b';
const MISSING_SITE = '019a0000-0000-7000-8000-00000000000c';

class SiteDto {
  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}

class SitesDto {
  @IsLeSite({ each: true })
  siteIds: string[];
}

const resolve = jest.fn(async (siteId: string) => {
  if (siteId === OWN_SITE) return { legalEntityId: LE_ID };
  if (siteId === OTHER_SITE) return { legalEntityId: OTHER_LE_ID };
  throw new NotFoundException('Site not found.');
});

let workspaceContext: WorkspaceContextService;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    providers: [
      WorkspaceContextService,
      IsLeSiteConstraint,
      { provide: SiteContextResolverService, useValue: { resolve } },
    ],
  }).compile();
  useContainer(moduleRef, { fallbackOnErrors: true });
  workspaceContext = moduleRef.get(WorkspaceContextService);
});

beforeEach(() => resolve.mockClear());

// The constraints that fail for a site, validated inside a workspace of the given legal entity
async function failures(siteId: unknown, legalEntityId?: string): Promise<string[]> {
  const errors = await workspaceContext.run({ legalEntityId }, () => validate(plainToInstance(SiteDto, { siteId })));
  return errors.flatMap((error) => Object.keys(error.constraints ?? {}));
}

describe('IsLeSite', () => {
  it("accepts a site of the workspace's legal entity", async () => {
    await expect(failures(OWN_SITE, LE_ID)).resolves.toEqual([]);
  });

  it('rejects a site of another legal entity', async () => {
    await expect(failures(OTHER_SITE, LE_ID)).resolves.toEqual(['isLeSite']);
  });

  it('rejects a site that does not exist', async () => {
    await expect(failures(MISSING_SITE, LE_ID)).resolves.toEqual(['isLeSite']);
  });

  it('rejects every site outside a legal entity workspace', async () => {
    await expect(failures(OWN_SITE)).resolves.toEqual(['isLeSite']);
    expect(resolve).not.toHaveBeenCalled();
  });

  it('rejects a malformed id without looking it up', async () => {
    await expect(failures('not-a-uuid', LE_ID)).resolves.toEqual(['isUuid', 'isLeSite']);
    expect(resolve).not.toHaveBeenCalled();
  });

  it('surfaces lookup failures other than a missing site', async () => {
    resolve.mockRejectedValueOnce(new Error('connection lost'));
    await expect(failures(OWN_SITE, LE_ID)).rejects.toThrow('connection lost');
  });

  it('checks every site of a list', async () => {
    const validateSites = (siteIds: string[]) =>
      workspaceContext.run({ legalEntityId: LE_ID }, () => validate(plainToInstance(SitesDto, { siteIds })));
    await expect(validateSites([OWN_SITE])).resolves.toEqual([]);
    const errors = await validateSites([OWN_SITE, OTHER_SITE]);
    expect(errors.flatMap((error) => Object.keys(error.constraints ?? {}))).toEqual(['isLeSite']);
  });
});
