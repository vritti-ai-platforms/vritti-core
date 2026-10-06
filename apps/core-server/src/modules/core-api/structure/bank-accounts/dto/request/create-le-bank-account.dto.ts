import { CreateBankAccountDto } from '@domain/bank-account/dto/request/create-bank-account.dto';
import { OmitType } from '@nestjs/swagger';

export class CreateLeBankAccountDto extends OmitType(CreateBankAccountDto, ['legalEntityId'] as const) {}
