import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  isUUID,
  registerDecorator,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';
import { WorkspaceContextService } from '../services/workspace-context.service';

@Injectable()
@ValidatorConstraint({ name: 'isLeSite', async: true })
export class IsLeSiteConstraint implements ValidatorConstraintInterface {
  constructor(
    private readonly workspaceContext: WorkspaceContextService,
    private readonly siteContextResolver: SiteContextResolverService,
  ) {}

  // Accepts a site of the legal entity the user is working in
  async validate(siteId: unknown): Promise<boolean> {
    const legalEntityId = this.workspaceContext.legalEntityId;
    if (!legalEntityId || typeof siteId !== 'string' || !isUUID(siteId)) return false;
    try {
      const site = await this.siteContextResolver.resolve(siteId);
      return site.legalEntityId === legalEntityId;
    } catch (error) {
      if (error instanceof NotFoundException) return false;
      throw error;
    }
  }

  defaultMessage(): string {
    return 'Not one of your sites';
  }
}

// Validates that a site belongs to the legal entity the user is working in
export function IsLeSite(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      target: target.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      validator: IsLeSiteConstraint,
    });
  };
}
