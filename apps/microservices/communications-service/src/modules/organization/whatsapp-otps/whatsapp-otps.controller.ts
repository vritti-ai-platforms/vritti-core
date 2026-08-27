import { WhatsappOtpDto } from '@domain/whatsapp-otps/dto/entity/whatsapp-otp.dto';
import {
  SendWhatsappOtpResultDto,
  VerifyWhatsappOtpResultDto,
} from '@domain/whatsapp-otps/dto/entity/whatsapp-otp-result.dto';
import { WhatsappOtpStatsDto } from '@domain/whatsapp-otps/dto/entity/whatsapp-otp-stats.dto';
import { SendWhatsappOtpDto } from '@domain/whatsapp-otps/dto/request/send-whatsapp-otp.dto';
import { VerifyWhatsappOtpDto } from '@domain/whatsapp-otps/dto/request/verify-whatsapp-otp.dto';
import { WhatsappOtpStatusDto } from '@domain/whatsapp-otps/dto/request/whatsapp-otp-status.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';
import { WhatsappOtpsService } from './services/whatsapp-otps.service';

@Controller()
export class WhatsappOtpsController {
  private readonly logger = new Logger(WhatsappOtpsController.name);

  constructor(private readonly service: WhatsappOtpsService) {}

  @MessagePattern({ cmd: 'org.whatsappOtps.send' })
  async send(@Payload() dto: SendWhatsappOtpDto): Promise<SendWhatsappOtpResultDto> {
    this.logger.log(`whatsappOtps.send — app: ${dto.appId}`);
    return this.service.send(dto);
  }

  @MessagePattern({ cmd: 'org.whatsappOtps.verify' })
  async verify(@Payload() dto: VerifyWhatsappOtpDto): Promise<VerifyWhatsappOtpResultDto> {
    this.logger.log(`whatsappOtps.verify — app: ${dto.appId}`);
    return this.service.verify(dto);
  }

  @MessagePattern({ cmd: 'org.whatsappOtps.deliveryStatus' })
  async deliveryStatus(@Payload() dto: WhatsappOtpStatusDto): Promise<{ applied: boolean }> {
    this.logger.log(`whatsappOtps.deliveryStatus — ${dto.status} for ${dto.messageId}`);
    return { applied: await this.service.applyDeliveryStatus(dto) };
  }

  @MessagePattern({ cmd: 'org.whatsappOtps.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: WhatsappOtpDto[]; count: number }> {
    this.logger.log('whatsappOtps.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'org.whatsappOtps.stats' })
  async stats(): Promise<WhatsappOtpStatsDto> {
    this.logger.log('whatsappOtps.stats');
    return this.service.stats();
  }

  @MessagePattern({ cmd: 'org.whatsappOtps.countForAccount' })
  async countForAccount(@Payload() data: { accountId: string }): Promise<{ count: number }> {
    this.logger.log(`whatsappOtps.countForAccount — account: ${data.accountId}`);
    return { count: await this.service.countForAccount(data.accountId) };
  }
}
