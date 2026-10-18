import { type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  offeringAttributes,
  offeringAttributeValues,
  offeringDimensions,
  offeringDimensionValues,
  offeringVariantAttributeValues,
  offeringVariants,
  offeringVariantValues,
} from '@/db/schema';

// offering_variants.dimensions and .attributes are a rendered copy of the junction tables, kept so a row that
// merely references a variant can show it without joining four tables. These two expressions are the only
// definition of that copy: whoever changes a junction, or a name one points at, assigns one of them.
// Correlated on offering_variants.id, so both belong in an UPDATE over that table.

export function dimensionsFacetSql(): SQL {
  return sql`(
    select coalesce(
      jsonb_agg(jsonb_build_object('code', f.code, 'label', f.label, 'values', f.values) order by f.sort_order),
      '[]'::jsonb
    )
    from (
      select ${offeringDimensions.code} as code,
             ${offeringDimensions.name} as label,
             ${offeringDimensions.sortOrder} as sort_order,
             jsonb_agg(
               jsonb_build_object('code', ${offeringDimensionValues.code}, 'value', ${offeringDimensionValues.value})
               order by ${offeringDimensionValues.sortOrder}
             ) as values
      from ${offeringVariantValues}
      join ${offeringDimensions} on ${offeringDimensions.id} = ${offeringVariantValues.dimensionId}
      join ${offeringDimensionValues} on ${offeringDimensionValues.id} = ${offeringVariantValues.valueId}
      where ${offeringVariantValues.variantId} = ${offeringVariants.id}
      group by ${offeringDimensions.id}, ${offeringDimensions.code}, ${offeringDimensions.name}, ${offeringDimensions.sortOrder}
    ) f
  )`;
}

export function attributesFacetSql(): SQL {
  return sql`(
    select coalesce(
      jsonb_agg(jsonb_build_object('code', f.code, 'label', f.label, 'values', f.values) order by f.sort_order),
      '[]'::jsonb
    )
    from (
      select ${offeringAttributes.code} as code,
             ${offeringAttributes.name} as label,
             ${offeringAttributes.sortOrder} as sort_order,
             jsonb_agg(
               jsonb_build_object('code', ${offeringAttributeValues.code}, 'value', ${offeringAttributeValues.value})
               order by ${offeringAttributeValues.sortOrder}
             ) as values
      from ${offeringVariantAttributeValues}
      join ${offeringAttributes} on ${offeringAttributes.id} = ${offeringVariantAttributeValues.attributeId}
      join ${offeringAttributeValues} on ${offeringAttributeValues.id} = ${offeringVariantAttributeValues.valueId}
      where ${offeringVariantAttributeValues.variantId} = ${offeringVariants.id}
      group by ${offeringAttributes.id}, ${offeringAttributes.code}, ${offeringAttributes.name}, ${offeringAttributes.sortOrder}
    ) f
  )`;
}
