import { Controller, Delete, Get, HttpCode, HttpStatus, Logger, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { FastifyRequest } from 'fastify';
import { SessionTypeValues } from '@/db/schema';
import { OrgId } from '@/security/decorators';
import { ApiGetProfile, ApiRemoveProfilePhoto, ApiUploadProfilePhoto } from '../docs/profile.docs';
import { ProfileDto } from '../dto/entity/profile.dto';
import { ProfilePhotoDto } from '../dto/response/profile-photo.dto';
import { ProfileService } from '../services/profile.service';

@ApiTags('Account - Profile')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@Controller('profile')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly profileService: ProfileService) {}

  // Returns the authenticated user's profile
  @Get()
  @ApiGetProfile()
  async getProfile(@UserId() userId: string, @OrgId() orgId: string): Promise<ProfileDto> {
    this.logger.log(`GET /account/profile - userId: ${userId}`);
    return this.profileService.getProfile(userId, orgId);
  }

  // Replaces the authenticated user's profile photo
  @Post('photo')
  @ApiUploadProfilePhoto()
  async uploadPhoto(
    @UserId() userId: string,
    @OrgId() orgId: string,
    @Req() request: FastifyRequest,
  ): Promise<ProfilePhotoDto> {
    const file = await request.file();
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    // Buffered rather than streamed for the same reason the media endpoints buffer: the checksum has to be known
    // before the object is written. The Fastify multipart limit caps the cost.
    const buffer = await file.toBuffer();
    this.logger.log(`POST /account/profile/photo - userId: ${userId} (${buffer.length} bytes)`);

    return this.profileService.uploadPhoto(userId, orgId, {
      buffer,
      filename: file.filename,
      mimetype: file.mimetype,
    });
  }

  // Removes the authenticated user's profile photo
  @Delete('photo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveProfilePhoto()
  async removePhoto(@UserId() userId: string, @OrgId() orgId: string): Promise<void> {
    this.logger.log(`DELETE /account/profile/photo - userId: ${userId}`);
    return this.profileService.removePhoto(userId, orgId);
  }
}
