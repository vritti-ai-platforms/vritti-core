import { WhatsappAccountDto } from '@domain/whatsapp-accounts/dto/entity/whatsapp-account.dto';
import { ConnectEmbeddedSignupDto } from '@domain/whatsapp-embedded-signup/dto/request/connect-embedded-signup.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { WhatsappEmbeddedSignupService } from './services/whatsapp-embedded-signup.service';

@Controller()
export class WhatsappAccountsEmbeddedSignupController {
  private readonly logger = new Logger(WhatsappAccountsEmbeddedSignupController.name);

  constructor(private readonly service: WhatsappEmbeddedSignupService) {}

  @MessagePattern({ cmd: 'org.whatsappAccounts.connectEmbedded' })
  async connect(@Payload() dto: ConnectEmbeddedSignupDto): Promise<CreateResponseDto<WhatsappAccountDto>> {
    // The code is single-use and short-lived, so it is never logged
    this.logger.log(`whatsappAccounts.connectEmbedded — waba: ${dto.wabaId}, event: ${dto.event}`);
    return this.service.connect(dto);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.reconnectEmbedded' })
  async reconnect(@Payload() data: { id: string } & ConnectEmbeddedSignupDto): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    this.logger.log(`whatsappAccounts.reconnectEmbedded — id: ${id}, waba: ${dto.wabaId}`);
    return this.service.reconnect(id, dto);
  }
}
