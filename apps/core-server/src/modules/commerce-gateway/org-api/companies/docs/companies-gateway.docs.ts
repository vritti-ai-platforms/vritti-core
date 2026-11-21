import { CompanyCountsResponseDto } from '@commerce/parties/dto/response/company-counts-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ID = { name: 'id', description: 'Company ID' };

export function ApiFindCompanyCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a company's tab rows",
      description:
        "One count per tab of the company's detail page (addresses, communications, social profiles, people, tax registrations, licenses, bank accounts, identifiers), so each tab can show how many rows it lists.",
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: CompanyCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Company not found.' }),
  );
}
