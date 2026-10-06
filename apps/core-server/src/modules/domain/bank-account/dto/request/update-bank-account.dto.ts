import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBankAccountDto } from './create-bank-account.dto';

export class UpdateBankAccountDto extends PartialType(OmitType(CreateBankAccountDto, ['legalEntityId'] as const)) {}
