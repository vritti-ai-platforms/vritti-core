import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { ApplyCreditNoteDto } from './dto/request/apply-credit-note.dto';
import { CreateCreditNoteDto } from './dto/request/create-credit-note.dto';
import type { CreditNoteDetailResponseDto, CreditNoteResponseDto } from './dto/response/credit-note-response.dto';
import { CreditNotesGatewayService } from './services/credit-notes-gateway.service';

@ApiTags('Commerce - Credit Notes')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('credit-notes')
export class CreditNotesGatewayController {
  constructor(private readonly creditNotesGatewayService: CreditNotesGatewayService) {}

  // Creates a new credit note
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCreditNoteDto): Promise<CreditNoteResponseDto> {
    return this.creditNotesGatewayService.create(dto);
  }

  // Returns a credit note by ID with applications
  @Get(':id')
  findById(@Param('id') id: string): Promise<CreditNoteDetailResponseDto> {
    return this.creditNotesGatewayService.findById(id);
  }

  // Applies a credit note to an invoice
  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  apply(@Param('id') id: string, @Body() dto: ApplyCreditNoteDto): Promise<{ success: boolean; message: string }> {
    return this.creditNotesGatewayService.apply(id, dto);
  }
}
