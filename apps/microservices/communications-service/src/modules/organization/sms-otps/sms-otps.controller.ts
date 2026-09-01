import { SmsOtpDto } from '@domain/sms-otps/dto/entity/sms-otp.dto';
import { SendSmsOtpResultDto, VerifySmsOtpResultDto } from '@domain/sms-otps/dto/entity/sms-otp-result.dto';
import { SmsOtpStatsDto } from '@domain/sms-otps/dto/entity/sms-otp-stats.dto';
import { SendSmsOtpDto } from '@domain/sms-otps/dto/request/send-sms-otp.dto';
import { VerifySmsOtpDto } from '@domain/sms-otps/dto/request/verify-sms-otp.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';
import { SmsOtpsService } from './services/sms-otps.service';

@Controller()
export class SmsOtpsController {
  private readonly logger = new Logger(SmsOtpsController.name);

  constructor(private readonly service: SmsOtpsService) {}

  @MessagePattern({ cmd: 'org.smsOtps.send' })
  async send(@Payload() dto: SendSmsOtpDto): Promise<SendSmsOtpResultDto> {
    this.logger.log(`smsOtps.send — app: ${dto.appId}`);
    return this.service.send(dto);
  }

  @MessagePattern({ cmd: 'org.smsOtps.verify' })
  async verify(@Payload() dto: VerifySmsOtpDto): Promise<VerifySmsOtpResultDto> {
    this.logger.log(`smsOtps.verify — app: ${dto.appId}`);
    return this.service.verify(dto);
  }

  @MessagePattern({ cmd: 'org.smsOtps.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: SmsOtpDto[]; count: number }> {
    this.logger.log('smsOtps.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'org.smsOtps.stats' })
  async stats(): Promise<SmsOtpStatsDto> {
    this.logger.log('smsOtps.stats');
    return this.service.stats();
  }

  @MessagePattern({ cmd: 'org.smsOtps.countForProvider' })
  async countForProvider(@Payload() data: { providerId: string }): Promise<{ count: number }> {
    this.logger.log(`smsOtps.countForProvider — provider: ${data.providerId}`);
    return { count: await this.service.countForProvider(data.providerId) };
  }
}
