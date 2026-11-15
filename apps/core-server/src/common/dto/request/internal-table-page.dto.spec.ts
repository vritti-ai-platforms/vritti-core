import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { InternalTablePageDto } from './internal-table-page.dto';

const VALIDATION = { whitelist: true, forbidNonWhitelisted: true };

// The property paths that fail validation for a body, with nested errors flattened
function failures(body: unknown): string[] {
  const dto = plainToInstance(InternalTablePageDto, body);
  const paths: string[] = [];
  const walk = (errors: ReturnType<typeof validateSync>, prefix: string) => {
    for (const error of errors) {
      const path = prefix ? `${prefix}.${error.property}` : error.property;
      if (error.constraints) paths.push(path);
      walk(error.children ?? [], path);
    }
  };
  walk(validateSync(dto, VALIDATION), '');
  return paths;
}

const page = {
  filters: {
    panel: [
      { field: 'status', operator: 'isAnyOf', value: ['ACTIVE', 'PENDING'] },
      { field: 'name', operator: 'contains', value: 'acme' },
    ],
    context: [{ field: 'amount', operator: 'gte', value: 100 }],
  },
  search: { columnId: 'name', value: 'acme' },
  sort: [{ field: 'createdAt', direction: 'desc' }],
  pagination: { limit: 20, offset: 40 },
};

describe('InternalTablePageDto', () => {
  it('accepts a page request with every value kind', () => {
    expect(failures(page)).toEqual([]);
  });

  it('accepts no search and empty lists', () => {
    const noFilters = { panel: [], context: [] };
    expect(failures({ ...page, filters: noFilters, sort: [], search: null })).toEqual([]);
    expect(failures({ filters: noFilters, sort: [], pagination: page.pagination })).toEqual([]);
  });

  it('rejects filters sent as a JSON string', () => {
    expect(failures({ ...page, filters: JSON.stringify(page.filters) })).toContain('filters');
  });

  it('rejects an unknown operator, an empty field and a non-string list item', () => {
    const bad = [
      { field: 'status', operator: 'resembles', value: ['a', 'b'] },
      { field: '', operator: 'equals', value: 'x' },
      { field: 'status', operator: 'isAnyOf', value: ['ACTIVE', 1] },
    ];
    expect(failures({ ...page, filters: { panel: bad, context: [] } })).toEqual([
      'filters.panel.0.operator',
      'filters.panel.1.field',
      'filters.panel.2.value',
    ]);
  });

  it('rejects an object value and a non-finite number', () => {
    const bad = [
      { field: 'amount', operator: 'gte', value: { currency: 'INR', value: '100' } },
      { field: 'amount', operator: 'gte', value: Number.POSITIVE_INFINITY },
    ];
    expect(failures({ ...page, filters: { panel: [], context: bad } })).toEqual([
      'filters.context.0.value',
      'filters.context.1.value',
    ]);
  });

  it('rejects a bad sort direction and out-of-range paging', () => {
    expect(failures({ ...page, sort: [{ field: 'name', direction: 'up' }] })).toEqual(['sort.0.direction']);
    expect(failures({ ...page, pagination: { limit: 500, offset: -1 } })).toEqual([
      'pagination.limit',
      'pagination.offset',
    ]);
  });

  it('rejects keys outside the page request, such as the rest of a saved view state', () => {
    expect(failures({ ...page, columnVisibility: { name: false } })).toEqual(['columnVisibility']);
  });
});
