import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { SupplierQuotationDetail } from '@/schemas/supplier-quotations';
import { QuotationStatusBadge } from './QuotationStatusBadge';

interface QuotationOverviewProps {
  quotation: SupplierQuotationDetail;
  supplierName: string;
  // How many sites it is posted to — where every site's postings are visible (LE)
  showPostedSites?: boolean;
}

// A quotation's header: who quoted it, when, in which currency and for how long
export const QuotationOverview = ({ quotation, supplierName, showPostedSites = false }: QuotationOverviewProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Details</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-6">
        <DetailField label="Supplier" type="string" value={supplierName} />
        <DetailField label="Quotation Number" type="string" mono value={quotation.quotationNumber} />
        <DetailField label="Quotation Date" type="date" value={quotation.quotationDate} />
        <DetailField label="Currency" type="string" mono value={quotation.currencyCode} />
        <DetailField label="Status" type="string" value={<QuotationStatusBadge status={quotation.status} />} />
        <DetailField label="Valid From" type="date" value={quotation.validFrom} />
        <DetailField label="Valid To" type="date" value={quotation.validTo} />
        <DetailField label="Lines" type="number" value={quotation.items.length} />
        {showPostedSites && <DetailField label="Posted Sites" type="number" value={quotation.sites.length} />}
        <div className="col-span-2">
          <DetailField label="Note" type="string" value={quotation.note} />
        </div>
      </div>
    </CardContent>
  </Card>
);
