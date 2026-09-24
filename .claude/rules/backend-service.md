---
description: Backend service layer conventions
paths:
  - "src/**/*.service.ts"
---

# Backend Service Files

Services contain all business logic. They are the core of the application.

## Responsibilities

- Validate business rules and throw exceptions
- Orchestrate calls to repositories and other services
- Transform data between layers (entity → DTO)
- Handle cross-domain logic by calling other services

## Never access database directly

```typescript
// WRONG — direct Drizzle query in service
async findUser(email: string) {
  return this.db.select().from(users).where(eq(users.email, email));
}

// CORRECT — use repository
async findUser(email: string) {
  return this.userRepository.findByEmail(email);
}
```

## Exceptions from `@vritti/api-sdk`

```typescript
import { BadRequestException, UnauthorizedException, NotFoundException, ConflictException } from '@vritti/api-sdk';

// NOT from @nestjs/common
```

## Dependency injection via constructor

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly encryptionService: EncryptionService,
  ) {}
}
```

Use `forwardRef()` only for circular dependencies.

## Input and output DTOs come from the service's OWN domain module

A domain service accepts request DTOs from its own `../dto/request/` and returns entity DTOs
from its own `../dto/entity/`. NEVER import a request DTO up from an API layer
(`@/modules/site/...`, `@/modules/organization/...`, gateway, `*-api`) — that inverts the
dependency direction. See `backend-module-structure.md` → "Dependency direction".

```typescript
// WRONG — service reaches up into the API layer for its input type
import type { CreateXDto } from '@/modules/site/x/dto/request/create-x.dto';

// CORRECT — the DTO lives in this domain; import it locally
import type { CreateXDto } from '../dto/request/create-x.dto';
```

## Guard a write with ONE read that does double duty

Before an update or delete, load the row once through a private `requireOwned(id)`. It is not a
security control — RLS is, and it refuses the write regardless. What it buys, at zero extra query
cost, is a precise 404-vs-403 with the row's own name in the message, instead of the base
`update`/`delete` throwing a bare `Error` that surfaces as a 500.

```typescript
private async requireOwned(id: string): Promise<OfferingWithOwnership> {
  const existing = await this.repository.findById(id);
  if (!existing) throw new NotFoundException('Offering not found.');
  if (!existing.isOwned) {
    throw new ForbiddenException({
      label: 'Not Your Offering',
      detail: `"${existing.name}" belongs to a wider scope. Switch to the workspace that owns it, or create your own.`,
    });
  }
  return existing;
}
```

The row it returns is the *only* read the action gets. Child counts, ownership and delete-eligibility
all arrive on it from the repository's `selection()` — never fire a second query to fetch a count
the guard read already carried.

Do not add a `requireOwned?: boolean` option to a repository finder. Reads want reach, writes want
ownership, and the branch belongs in the service where the 403 is thrown.

## Validate before opening a transaction

Everything that can reject the request — conflict checks, business-rule checks, the guard read —
runs first. The transaction then contains only writes, so it is short and cannot roll back on a
validation throw.

## Never catch a unique violation to detect a conflict

Ask the repository for a conflict report (`findConflicts`) and throw a field-attributed
`ConflictException` per key. See `backend-repository.md` → "Report conflicts in one query".

## Return DTOs for API-facing methods

```typescript
// Public method (called by controller) — returns DTO
async findById(id: string): Promise<UserResponseDto> {
  const user = await this.userRepository.findById(id);
  if (!user) throw new NotFoundException('User not found.');
  return UserResponseDto.from(user);
}

// Internal method (called by other services) — returns entity
async findByEmail(email: string): Promise<User | undefined> {
  return this.userRepository.findByEmail(email);
}
```
