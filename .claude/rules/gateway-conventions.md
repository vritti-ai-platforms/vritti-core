---
description: Gateway controller/service conventions for core-server commerce-gateway (NATS forwarding layer)
paths:
  - "apps/core-server/src/modules/commerce-gateway/**/*.ts"
---

# Gateway Conventions

Gateway modules in core-server forward HTTP requests to microservices via NATS. They mirror cloud-server controller conventions.

## Folder structure — flat & unified per feature

A gateway feature folder is **flat and unified**: ONE controller + ONE service + resolver(s) per
feature, with sub-resources folded into the SAME files. This is the opposite of the microservice
API layer (which splits sub-resources into `root/` + submodule folders — see
`backend-module-structure.md`). Mirror `org-api/inventory-items` / `site-api/inventory-items`.

```
org-api/uom/
├── uom-gateway.controller.ts        # ONE @Controller('uom') — serves uom/* AND uom/dimensions/*
├── uom-gateway.resolver.ts          # ONE resolver — uom + dimension GraphQL (mobile)
├── services/
│   └── uom-gateway.service.ts       # ONE service — sub-resource methods NAMESPACED
│                                    #   (listDimensions, createDimension, findDimensionById, …)
├── dto/request/ · dto/response/     # shared — uom + dimension DTOs together
└── graphql/                         # shared
```

- **No `root/`, no per-sub-resource subfolders.** A sub-path (e.g. `uom/dimensions`) is just more
  routes on the parent controller (`@Get('dimensions')`, `@Patch('dimensions/:id')`, …) and more
  namespaced methods on the parent service. Fastify's radix router resolves `dimensions/count`
  vs `dimensions/:id` regardless of declaration order.
- **Resolver sits parallel to the controller** — at the feature-folder root, NEVER in a
  `resolvers/` subfolder. Multiple resolvers per feature are fine, but they all inject the one
  gateway service.
- **No per-feature `*.module.ts`.** Every gateway controller/resolver/service registers directly
  in the single `commerce-gateway.module.ts`.
- NATS `cmd` namespaces nest to match the microservice: `org.uom.*` (root) + `org.uom.dimensions.*`
  (sub-resource). The gateway `send(...)` cmd MUST match the microservice `@MessagePattern` exactly.

## Controller — thin HTTP layer with logs

Every endpoint must log `METHOD /commerce-api/<path>` before calling the service:

```typescript
@Get('base')
findBaseUnits(@Query() query: UomBaseQueryDto): Promise<UomResponseDto[]> {
  this.logger.log('GET /commerce-api/uom/base');
  return this.uomGatewayService.findBaseUnits(query.search);
}

@Delete(':id')
delete(@Param('id') id: string): Promise<SuccessResponseDto> {
  this.logger.log(`DELETE /commerce-api/uom/${id}`);
  return this.uomGatewayService.delete(id);
}
```

## Query parameters — always use a DTO class

Never use inline `@Query('field')`. Create a proper DTO with validation + Swagger decorators:

```typescript
// WRONG
@Get('base')
findBaseUnits(@Query('search') search?: string) { ... }

// CORRECT
@Get('base')
findBaseUnits(@Query() query: UomBaseQueryDto) { ... }

// dto/request/uom-base-query.dto.ts
export class UomBaseQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or symbol' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

## Service — NATS forwarding with pattern logs

Services log the NATS pattern and key params:

```typescript
async findBaseUnits(search?: string): Promise<UomResponseDto[]> {
  this.logger.log('uom.base');
  return this.nats.send('commerce', 'uom.base', { search });
}

async create(dto: CreateUomDto): Promise<CreateResponseDto<UomResponseDto>> {
  this.logger.log(`uom.create — name: ${dto.name}, symbol: ${dto.symbol}`);
  return this.nats.send('commerce', 'uom.create', dto);
}
```

## Response types

| Method | Return Type |
|--------|------------|
| `create()` | `CreateResponseDto<EntityResponseDto>` |
| `update()` | `SuccessResponseDto` |
| `delete()` | `SuccessResponseDto` |
| `findById()` | `EntityResponseDto` |
| `list()` / `findBaseUnits()` | `EntityResponseDto[]` |
| `findForTable()` | `EntityTableResponseDto` (extends `TableResponseDto<T>`) |
| `select()` | `SelectQueryResult` |

## Success messages — include entity name

```typescript
// WRONG
return { success: true, message: 'Unit of measure created successfully.' };

// CORRECT
return { success: true, message: `Unit "${entity.name}" (${entity.symbol}) created successfully.` };
```

## Response DTOs

Every gateway module has `dto/response/` with:
- `{entity}-response.dto.ts` — entity shape with `@ApiProperty` decorators
- `{entity}-table-response.dto.ts` — (only if DataTable is used) extends `TableResponseDto<T>`

## Request DTOs

Mirror the commerce-service request DTOs with Swagger decorators added:
- `dto/request/create-{entity}.dto.ts`
- `dto/request/update-{entity}.dto.ts`
- `dto/request/{entity}-{action}-query.dto.ts` — for query params

## canDelete pattern

When an entity has FK references that prevent deletion:
1. Repository: `hasReferences(id)` method checking all FK tables
2. Entity DTO: `canDelete: boolean` field
3. Service list methods: set `canDelete` per entity
4. Service delete: check references before attempting delete, throw `ConflictException` if in use
5. Frontend: disable delete button/DangerZone when `canDelete` is false
