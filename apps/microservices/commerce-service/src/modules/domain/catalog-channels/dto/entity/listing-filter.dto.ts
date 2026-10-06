export const ListingFilterKindValues = { DIMENSION: 'DIMENSION', ATTRIBUTE: 'ATTRIBUTE' } as const;
export type ListingFilterKind = (typeof ListingFilterKindValues)[keyof typeof ListingFilterKindValues];

export interface ListingFilterRow {
  code: string;
  name: string;
  sortOrder: number;
  valueCode: string;
  valueName: string;
  valueSortOrder: number;
  count: number;
}

export class ListingFilterValueDto {
  code: string;
  name: string;
  count: number;
}

export class ListingFilterDto {
  kind: ListingFilterKind;
  code: string;
  name: string;
  sortOrder: number;
  values: ListingFilterValueDto[];

  // Rows arrive one per (group, value) already ordered, so grouping is a single pass. A group's name
  // comes from whichever row the ordering put first — several offerings can spell one code's name
  // differently, and the heading has to be deterministic rather than whatever the planner returned.
  static group(rows: ListingFilterRow[], kind: ListingFilterKind): ListingFilterDto[] {
    const groups = new Map<string, ListingFilterDto>();
    for (const row of rows) {
      let group = groups.get(row.code);
      if (!group) {
        group = new ListingFilterDto();
        group.kind = kind;
        group.code = row.code;
        group.name = row.name;
        group.sortOrder = row.sortOrder;
        group.values = [];
        groups.set(row.code, group);
      }
      group.values.push({ code: row.valueCode, name: row.valueName, count: row.count });
    }
    return [...groups.values()];
  }
}
