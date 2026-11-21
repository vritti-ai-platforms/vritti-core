import { PersonCountsResponseDto } from '@commerce/parties/dto/response/person-counts-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ID = { name: 'id', description: 'Person ID' };

export function ApiFindPersonCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a person's tab rows",
      description:
        "One count per tab of the person's detail page (addresses, communications, social profiles, companies, tax registrations, licenses, bank accounts, wishlist, identifiers), so each tab can show how many rows it lists.",
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: PersonCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Person not found.' }),
  );
}
