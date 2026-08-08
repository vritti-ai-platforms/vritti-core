import { MediaDomainService } from '@domain/media/services/media.service';
import { Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserId } from '@vritti/api-sdk/auth';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { FastifyRequest } from 'fastify';
import { OrgId } from '@/security/decorators';
import { ApiDeleteMedia, ApiGetMediaUrl, ApiUploadMedia, ApiUploadPublicMedia } from '../docs/media.docs';
import type { UploadMediaQueryDto } from '../dto/request/upload-media.dto';
import {
  MediaResponseDto,
  type PresignedUrlResponseDto,
  PublicMediaResponseDto,
} from '../dto/response/media-response.dto';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaDomainService) {}

  // Uploads a file into the organization's own bucket
  @Post('upload')
  @ApiUploadMedia()
  async upload(
    @OrgId() orgId: string,
    @UserId() userId: string,
    @Req() request: FastifyRequest,
    @Query() query: UploadMediaQueryDto,
  ): Promise<MediaResponseDto> {
    const file = await request.file();
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    // Buffered rather than streamed because the checksum has to be known before the upload: it is what decides
    // whether this is a duplicate of something the org already stored. The Fastify multipart limit caps the cost.
    const buffer = await file.toBuffer();
    const result = await this.mediaService.upload(
      { buffer, filename: file.filename, mimetype: file.mimetype },
      orgId,
      userId,
      query,
    );

    this.logger.log(`POST /media/upload — ${query.entityType}/${query.entityId} (${buffer.length} bytes)`);
    return MediaResponseDto.from(result);
  }

  // Uploads a file into the organization's public bucket and returns its permanent URL
  @Post('upload/public')
  @ApiUploadPublicMedia()
  async uploadPublic(
    @OrgId() orgId: string,
    @UserId() userId: string,
    @Req() request: FastifyRequest,
    @Query() query: UploadMediaQueryDto,
  ): Promise<PublicMediaResponseDto> {
    const file = await request.file();
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const buffer = await file.toBuffer();
    const result = await this.mediaService.uploadPublic(
      { buffer, filename: file.filename, mimetype: file.mimetype },
      orgId,
      userId,
      query,
    );

    this.logger.log(`POST /media/upload/public — ${query.entityType}/${query.entityId} (${buffer.length} bytes)`);
    return PublicMediaResponseDto.fromPublic(result);
  }

  // Returns a time-limited download URL
  @Get(':id/url')
  @ApiGetMediaUrl()
  async getUrl(@Param('id') id: string): Promise<PresignedUrlResponseDto> {
    this.logger.log(`GET /media/${id}/url`);
    return this.mediaService.getPresignedUrl(id);
  }

  // Deletes the record, and the object once nothing else references it
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteMedia()
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /media/${id}`);
    return this.mediaService.delete(id);
  }
}
