import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AdminService } from './admin.service';
import {
  CreateAdminAdsDto,
  CreateAdminEventDto,
  CreateAdminHallDto,
  CreateAdminHallSeatDto,
  CreateAdminHeroSliderDto,
  CreateAdminPromoCodeDto,
  CreateAdminSocialLinkDto,
  CreateAdminShowDto,
  CreateAdminTheaterDto,
  UpdateAdminAdsDto,
  UpdateAdminEventDto,
  UpdateAdminHallSeatDto,
  UpdateAdminHeroSliderDto,
  UpdateAdminPromoCodeDto,
  UpdateAdminSocialLinkDto,
  UpdateAdminShowDto,
} from './dto/admin-crud.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService, private readonly storage: StorageService) {}

  @Get('reservations/active')
  @ApiOkResponse({ description: 'List active RESERVED seats' })
  getActiveReservations() {
    return this.service.getActiveReservations();
  }

  @Get('orders/pending')
  @ApiOkResponse({ description: 'List pending orders' })
  getPendingOrders() {
    return this.service.getPendingOrders();
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('theaters')
  getTheaters() {
    return this.service.getTheaters();
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getAuditLogs(Number(page ?? 1), Number(limit ?? 50));
  }

  @Post('events/upload-poster')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'events');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
      }),
    }),
  )
  uploadPoster(@UploadedFile() file: { filename: string }) {
    return { imageUrl: this.storage.toPublicUrl(`events/${file.filename}`) };
  }

  @Post('events')
  createEvent(@Body() dto: CreateAdminEventDto) {
    return this.service.createEvent(dto);
  }

  @Patch('events/:id')
  updateEvent(@Param('id') id: string, @Body() dto: UpdateAdminEventDto) {
    return this.service.updateEvent(id, dto);
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.service.deleteEvent(id);
  }

  @Post('shows')
  createShow(@Body() dto: CreateAdminShowDto) {
    return this.service.createShow(dto);
  }

  @Patch('shows/:id')
  updateShow(@Param('id') id: string, @Body() dto: UpdateAdminShowDto) {
    return this.service.updateShow(id, dto);
  }

  @Post('theaters')
  createTheater(@Body() dto: CreateAdminTheaterDto) {
    return this.service.createTheater(dto);
  }

  @Post('halls')
  createHall(@Body() dto: CreateAdminHallDto) {
    return this.service.createHall(dto);
  }

  @Get('halls')
  getHalls() {
    return this.service.getHalls();
  }

  @Patch('halls/:id/archive')
  archiveHall(@Param('id') id: string) {
    return this.service.archiveHall(id);
  }

  @Delete('halls/:id')
  deleteHall(@Param('id') id: string) {
    return this.service.deleteHall(id);
  }

  @Get('halls/:id/seats')
  getHallSeats(@Param('id') id: string) {
    return this.service.getHallSeats(id);
  }

  @Post('hall-seats')
  createHallSeat(@Body() dto: CreateAdminHallSeatDto) {
    return this.service.createHallSeat(dto);
  }

  @Patch('hall-seats/:id')
  updateHallSeat(@Param('id') id: string, @Body() dto: UpdateAdminHallSeatDto) {
    return this.service.updateHallSeat(id, dto);
  }

  @Post('promo-codes')
  createPromoCode(@Body() dto: CreateAdminPromoCodeDto) {
    return this.service.createPromoCode(dto);
  }

  @Get('promo-codes')
  getPromoCodes() {
    return this.service.getPromoCodes();
  }

  @Patch('promo-codes/:id')
  updatePromoCode(@Param('id') id: string, @Body() dto: UpdateAdminPromoCodeDto) {
    return this.service.updatePromoCode(id, dto);
  }

  @Delete('promo-codes/:id')
  deletePromoCode(@Param('id') id: string) {
    return this.service.deletePromoCode(id);
  }

  @Get('hero-sliders')
  getHeroSliders() {
    return this.service.getHeroSliders();
  }

  @Post('hero-sliders')
  createHeroSlider(@Body() dto: CreateAdminHeroSliderDto) {
    return this.service.createHeroSlider(dto);
  }

  @Patch('hero-sliders/:id')
  updateHeroSlider(@Param('id') id: string, @Body() dto: UpdateAdminHeroSliderDto) {
    return this.service.updateHeroSlider(id, dto);
  }

  @Delete('hero-sliders/:id')
  deleteHeroSlider(@Param('id') id: string) {
    return this.service.deleteHeroSlider(id);
  }

  @Get('ads')
  getAds() {
    return this.service.getAds();
  }

  @Post('ads')
  createAds(@Body() dto: CreateAdminAdsDto) {
    return this.service.createAds(dto);
  }

  @Patch('ads/:id')
  updateAds(@Param('id') id: string, @Body() dto: UpdateAdminAdsDto) {
    return this.service.updateAds(id, dto);
  }

  @Delete('ads/:id')
  deleteAds(@Param('id') id: string) {
    return this.service.deleteAds(id);
  }

  @Get('social-links')
  getSocialLinks() {
    return this.service.getSocialLinks();
  }

  @Post('social-links')
  createSocialLink(@Body() dto: CreateAdminSocialLinkDto) {
    return this.service.createSocialLink(dto);
  }

  @Patch('social-links/:id')
  updateSocialLink(@Param('id') id: string, @Body() dto: UpdateAdminSocialLinkDto) {
    return this.service.updateSocialLink(id, dto);
  }

  @Delete('social-links/:id')
  deleteSocialLink(@Param('id') id: string) {
    return this.service.deleteSocialLink(id);
  }
}
