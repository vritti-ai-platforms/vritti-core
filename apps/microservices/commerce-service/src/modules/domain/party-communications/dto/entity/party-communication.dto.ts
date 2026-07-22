import type { MessagingApp, PartyCommunication, PartyCommunicationChannel } from '@/db/schema';

export interface PartyCommunicationAppDto {
  app: MessagingApp;
  handle: string | null;
}

export class PartyCommunicationDto {
  id: string;
  partyId: string;
  channel: PartyCommunicationChannel;
  value: string;
  isPrimary: boolean;
  isActive: boolean;
  apps: PartyCommunicationAppDto[];
  createdAt: string;
  updatedAt: string;

  // Maps a PartyCommunication entity (with its optional messaging apps) to a PartyCommunicationDto
  static from(entity: PartyCommunication, apps: PartyCommunicationAppDto[] = []): PartyCommunicationDto {
    const dto = new PartyCommunicationDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.channel = entity.channel;
    dto.value = entity.value;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.apps = apps;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
