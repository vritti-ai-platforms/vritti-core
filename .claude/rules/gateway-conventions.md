---
description: Gateway controller/service conventions for core-server commerce-gateway (NATS forwarding layer)
paths:
  - "apps/core-server/src/modules/commerce-gateway/**/*.ts"
---

# Gateway Conventions

Gateway modules in core-server forward HTTP requests to microservices via NATS. They mirror cloud-server controller conventions.

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
