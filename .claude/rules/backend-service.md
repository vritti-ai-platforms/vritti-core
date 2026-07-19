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
