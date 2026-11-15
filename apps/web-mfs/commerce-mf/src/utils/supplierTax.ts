import type { SupplierRegistrationData } from '@/schemas/suppliers';

const SALES_TAX_REGISTRATION_TYPES = new Set(['GSTIN', 'VAT']);

// Whether any of a supplier's registrations is an active sales-tax (GSTIN or VAT) one a site enrollment can be invoiced under
export function hasActiveSalesTaxRegistration(registrations: SupplierRegistrationData[]): boolean {
  return registrations.some(
    (registration) => registration.isActive && SALES_TAX_REGISTRATION_TYPES.has(registration.registrationType),
  );
}
