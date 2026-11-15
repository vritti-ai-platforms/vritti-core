---
description: Method order in backend controllers and services — create, update, update-related, findById, table, other finds, delete
paths:
  - "apps/core-server/src/**/*.controller.ts"
  - "apps/core-server/src/**/*.service.ts"
  - "apps/microservices/**/src/**/*.controller.ts"
  - "apps/microservices/**/src/**/*.service.ts"
---

# Method Order

Every controller (HTTP and NATS `@MessagePattern`) and service orders its public methods in one fixed sequence, so
the same kind of method is always in the same place:

| # | Group | Method names |
|---|---|---|
| 1 | **Create** | `create…`, `add…`, `request…` (e.g. `requestQuotation`), `generate…`, `enroll…`, `import…`, `duplicate…` |
| 2 | **Update** | `update…`, `upsert…`, `replace…` |
| 3 | **Update-related** | state changes and field actions: `submit…`, `cancel…`, `approve…`, `reject…`, `confirm…`, `post…`, `close…`, `complete…`, `publish…`, `activate…`, `set…`, `bulkSet…`, `change…`, `clear…`, `sync…`, `reorder…`, `release…`, `link…` |
| 4 | **findById** | `findById` first, then the other `find…ById` lookups |
| 5 | **Table** | `findForTable` / `getTable` first, then the other `…Table` / `…ForTable` reads |
| 6 | **Other finds** | everything else that reads: `find…`, `get…`, `list…`, `select…`, feeds, exports, previews, read-only domain helpers (`assert…`, `require…`, `summarize…`) |
| 7 | **Delete** | `delete…`, `remove…`, `discard…`, `unlink…`, `bulkDelete…`, `bulkRemove…` — always last |

## Rules

- **The root method leads its group** — `create`, `update`, `findById`, `findForTable`, `delete` come before their
  sub-resource siblings (`createItem`, `updateItem`, `deleteItem`). Within a group, keep sub-resources in a stable order.
- **Fields and the constructor stay on top**; **private / protected / static helpers stay at the bottom**, after `delete`.
- **`clear…` is not a delete.** An endpoint that unsets a value (`clearListingPrice`, even on HTTP `DELETE`) is
  update-related; Delete is for removing a record.
- **Controller and service mirror each other** — a gateway service lists its methods in the same order as its
  controller.
- **New methods go into their group**, never appended at the end of the class.

Route declaration order does not affect matching: core-server runs on Fastify, whose router matches static segments
(`table`) before parameters (`:id`) regardless of order, and NATS patterns are exact-match.

## Example

```typescript
@Controller('le/purchases')
export class LePurchasesGatewayController {
  constructor(private readonly service: LePurchasesGatewayService) {}

  create() {}               // 1 Create
  createItem() {}
  requestQuotation() {}
  update() {}               // 2 Update
  updateItem() {}
  cancel() {}               // 3 Update-related
  submitItems() {}
  approveLeg() {}
  findById() {}             // 4 findById
  getTable() {}             // 5 Table
  findItems() {}            // 6 Other finds
  findSuppliers() {}
  delete() {}               // 7 Delete
  deleteItem() {}
  discardReceiveWithInvoice() {}
}
```
