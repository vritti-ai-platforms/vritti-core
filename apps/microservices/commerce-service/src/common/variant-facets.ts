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

// Renders the dimension junction as the cached column holds it, correlated for an UPDATE over the variants
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

// Renders the attribute junction as the cached column holds it, correlated for an UPDATE over the variants
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
