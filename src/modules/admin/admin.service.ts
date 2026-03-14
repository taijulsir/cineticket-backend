import { BadGatewayException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventReleaseType, EventStatus, EventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
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

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  getActiveReservations() {
    return this.ordersService.listActiveReservations();
  }

  getPendingOrders() {
    return this.ordersService.listPendingOrders();
  }

  createEvent(dto: CreateAdminEventDto) {
    const { posterUrl, ...rest } = dto;
    return this.prisma.event.create({
      data: { ...rest, cardImage: posterUrl ?? dto.cardImage, releaseDate: new Date(dto.releaseDate) },
    });
  }

  updateEvent(id: string, dto: UpdateAdminEventDto) {
    const { posterUrl, ...rest } = dto;
    return this.prisma.event.update({
      data: {
        ...rest,
        ...(posterUrl && { cardImage: posterUrl }),
        ...(dto.releaseDate && { releaseDate: new Date(dto.releaseDate) }),
      },
      where: { id },
    });
  }

  deleteEvent(id: string) {
    return this.prisma.event.update({ where: { id }, data: { isArchive: true, deletedAt: new Date() } });
  }

  async createShow(dto: CreateAdminShowDto) {
    const location = await this.resolveLocationIds(dto.theaterId);
    return this.prisma.show.create({
      data: {
        ...dto,
        cityId: location.cityId,
        stateId: location.stateId,
        countryId: location.countryId,
        date: new Date(dto.date),
        totalSoldTickets: 0,
      },
    });
  }

  async updateShow(id: string, dto: UpdateAdminShowDto) {
    const location = dto.theaterId ? await this.resolveLocationIds(dto.theaterId) : null;
    return this.prisma.show.update({
      data: {
        ...dto,
        ...(dto.date && { date: new Date(dto.date) }),
        ...(location && { cityId: location.cityId, stateId: location.stateId, countryId: location.countryId }),
      },
      where: { id },
    });
  }

  createTheater(dto: CreateAdminTheaterDto) {
    const slug = (dto as any).slug ?? this.generateSlug((dto as any).name ?? 'theater');
    return this.prisma.theater.create({ data: { ...dto, slug } });
  }

  createHall(dto: CreateAdminHallDto) {
    return this.prisma.hall.create({ data: dto });
  }

  getHalls() {
    return this.prisma.hall.findMany({
      where: { deletedAt: null, isArchive: false },
      include: { theater: { include: { city: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  archiveHall(id: string) {
    return this.prisma.hall.update({
      where: { id },
      data: { isArchive: true, deletedAt: new Date() },
    });
  }

  async deleteHall(id: string) {
    await this.prisma.hallSeat.updateMany({
      where: { hallId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return this.prisma.hall.update({
      where: { id },
      data: { isArchive: true, deletedAt: new Date() },
    });
  }

  createHallSeat(dto: CreateAdminHallSeatDto) {
    return this.prisma.hallSeat.create({ data: dto });
  }

  getHallSeats(hallId: string) {
    return this.prisma.hallSeat.findMany({
      where: { hallId, deletedAt: null },
      orderBy: [{ row: 'asc' }, { column: 'asc' }],
    });
  }

  updateHallSeat(id: string, dto: UpdateAdminHallSeatDto) {
    return this.prisma.hallSeat.update({ where: { id }, data: dto });
  }

  getHeroSliders() {
    return this.prisma.heroSlider.findMany({
      where: { deletedAt: null, isArchive: false },
      include: { event: { select: { id: true, name: true } } },
      orderBy: { precedence: 'asc' },
    });
  }

  createHeroSlider(dto: CreateAdminHeroSliderDto) {
    return this.prisma.heroSlider.create({ data: dto });
  }

  updateHeroSlider(id: string, dto: UpdateAdminHeroSliderDto) {
    return this.prisma.heroSlider.update({ where: { id }, data: dto });
  }

  deleteHeroSlider(id: string) {
    return this.prisma.heroSlider.update({ where: { id }, data: { isArchive: true, deletedAt: new Date() } });
  }

  getAds() {
    return this.prisma.ads.findMany({
      where: { deletedAt: null, isArchive: false },
      orderBy: { precedence: 'asc' },
    });
  }

  createAds(dto: CreateAdminAdsDto) {
    return this.prisma.ads.create({ data: dto });
  }

  updateAds(id: string, dto: UpdateAdminAdsDto) {
    return this.prisma.ads.update({ where: { id }, data: dto });
  }

  deleteAds(id: string) {
    return this.prisma.ads.update({ where: { id }, data: { isArchive: true, deletedAt: new Date() } });
  }

  getSocialLinks() {
    return this.prisma.socialLink.findMany({
      where: { deletedAt: null, isArchive: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  createSocialLink(dto: CreateAdminSocialLinkDto) {
    return this.prisma.socialLink.create({ data: { ...dto, isArchive: false } });
  }

  updateSocialLink(id: string, dto: UpdateAdminSocialLinkDto) {
    return this.prisma.socialLink.update({ where: { id }, data: dto });
  }

  deleteSocialLink(id: string) {
    return this.prisma.socialLink.update({ where: { id }, data: { isArchive: true, deletedAt: new Date() } });
  }

  async searchMovies(title: string) {
    if (!title?.trim()) return [];
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!apiKey) throw new BadGatewayException('TMDB_API_KEY is not configured');
    const url = new URL('https://api.themoviedb.org/3/search/movie');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('query', title.trim());
    url.searchParams.set('include_adult', 'false');
    const response = await fetch(url.toString());
    if (!response.ok) throw new BadGatewayException('Failed to search TMDB movies');
    const payload = (await response.json()) as { results?: Array<Record<string, any>> };
    return (payload.results ?? []).map((movie) => ({
      id: String(movie.id),
      title: movie.title,
      year: movie.release_date ? String(movie.release_date).slice(0, 4) : null,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
      rating: movie.vote_average ?? 0,
      releaseDate: movie.release_date ?? null,
    }));
  }

  async importMovie(movieId: string) {
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!apiKey) throw new BadGatewayException('TMDB_API_KEY is not configured');
    const [details, videos] = await Promise.all([
      this.fetchTmdb(`/movie/${movieId}`, apiKey),
      this.fetchTmdb(`/movie/${movieId}/videos`, apiKey),
    ]);
    const payload = this.mapTmdbMovieToEvent(details, videos.results ?? [], movieId);
    const slug = payload.slug;
    const existing = await this.prisma.event.findUnique({ where: { slug } });
    const event = existing
      ? await this.prisma.event.update({ where: { id: existing.id }, data: payload })
      : await this.prisma.event.create({ data: payload });
    await this.syncEventGenres(event.id, this.extractGenreNames(details));
    return event;
  }

  async bulkRefreshMovies() {
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!apiKey) throw new BadGatewayException('TMDB_API_KEY is not configured');

    await this.prisma.event.deleteMany({
      where: { type: EventType.MOVIE, organizer: 'TMDB', shows: { none: {} } },
    });

    const endpoints = ['/movie/popular', '/movie/top_rated', '/movie/now_playing', '/movie/upcoming'];
    const pages = [1, 2, 3];
    const listingResponses = await Promise.all(
      endpoints.flatMap((path) => pages.map((page) => this.fetchTmdb(path, apiKey, { page: String(page) }))),
    );
    const fetchedRows = listingResponses.flatMap((payload) => (payload.results ?? []) as Array<Record<string, any>>);
    const movieIds = [...new Set(fetchedRows.map((row) => String(row.id)).filter(Boolean))];

    const detailRows = await this.mapWithConcurrency(movieIds, 6, async (movieId) => {
      const [details, videos] = await Promise.all([
        this.fetchTmdb(`/movie/${movieId}`, apiKey),
        this.fetchTmdb(`/movie/${movieId}/videos`, apiKey),
      ]);
      return {
        payload: this.mapTmdbMovieToEvent(details, videos.results ?? [], movieId),
        genres: this.extractGenreNames(details),
      };
    });

    const uniquePayloadBySlug = new Map<string, { payload: Prisma.EventCreateManyInput; genres: string[] }>();
    for (const item of detailRows) {
      if (!item) continue;
      if (!uniquePayloadBySlug.has(item.payload.slug)) uniquePayloadBySlug.set(item.payload.slug, item);
    }
    const prepared = [...uniquePayloadBySlug.values()];
    const toInsert = prepared.map((item) => item.payload);
    const inserted = toInsert.length
      ? await this.prisma.event.createMany({ data: toInsert, skipDuplicates: true })
      : { count: 0 };

    const insertedRows = await this.prisma.event.findMany({
      where: { slug: { in: toInsert.map((item) => item.slug) } },
      select: { id: true, slug: true },
    });
    const idBySlug = new Map(insertedRows.map((row) => [row.slug, row.id]));
    await Promise.all(
      prepared.map(async (item) => {
        const eventId = idBySlug.get(item.payload.slug);
        if (!eventId) return;
        await this.syncEventGenres(eventId, item.genres);
      }),
    );

    const statusDistribution = toInsert.reduce(
      (acc, item) => {
        if (item.status === EventStatus.NOW_SELLING) acc.nowShowing += 1;
        else if (item.status === EventStatus.UPCOMING) acc.comingSoon += 1;
        else acc.past += 1;
        return acc;
      },
      { nowShowing: 0, comingSoon: 0, past: 0 },
    );
    const skipped = prepared.length - inserted.count;

    this.logger.log(
      `TMDB bulk refresh fetched=${movieIds.length} prepared=${prepared.length} inserted=${inserted.count} skipped=${skipped} distribution=${JSON.stringify(statusDistribution)}`,
    );

    return {
      fetched: movieIds.length,
      imported: inserted.count,
      skipped,
      statusDistribution,
    };
  }

  createPromoCode(dto: CreateAdminPromoCodeDto) {
    const { usageCount, minOrderAmount, startsAt, expiresAt, ...rest } = dto;
    return this.prisma.promocode.create({
      data: {
        ...rest,
        usageCount: usageCount ?? 0,
        discountAmount: new Prisma.Decimal(dto.discountAmount),
        minOrderAmount: new Prisma.Decimal(minOrderAmount ?? 0),
        ...(startsAt && { startsAt: new Date(startsAt) }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
    });
  }

  getPromoCodes() {
    return this.prisma.promocode.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  updatePromoCode(id: string, dto: UpdateAdminPromoCodeDto) {
    return this.prisma.promocode.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.discountAmount !== undefined && { discountAmount: new Prisma.Decimal(dto.discountAmount) }),
        ...(dto.minOrderAmount !== undefined && { minOrderAmount: new Prisma.Decimal(dto.minOrderAmount) }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
      },
    });
  }

  deletePromoCode(id: string) {
    return this.prisma.promocode.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
  }

  async getStats() {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const [totalEvents, totalShows, totalOrders, todayRevenue, tickets] = await Promise.all([
      this.prisma.event.count({ where: { deletedAt: null, isArchive: false } }),
      this.prisma.show.count({ where: { deletedAt: null, isArchive: false } }),
      this.prisma.order.count({ where: { deletedAt: null } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: start }, state: 'CONFIRMED', deletedAt: null },
        _sum: { total: true },
      }),
      this.prisma.show.aggregate({ where: { deletedAt: null }, _sum: { totalSoldTickets: true } }),
    ]);
    return {
      totalEvents,
      totalShows,
      totalOrders,
      todayRevenue: Number(todayRevenue._sum.total ?? 0),
      totalTicketsSold: tickets._sum.totalSoldTickets ?? 0,
    };
  }

  getTheaters() {
    return this.prisma.theater.findMany({
      where: { deletedAt: null, isArchive: false },
      include: { country: true, state: true, city: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.auditLog.count(),
    ]);
    const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
    const [employees, customers] = await Promise.all([
      this.prisma.employee.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } }),
      this.prisma.customer.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } }),
    ]);
    const userMap = new Map([...employees, ...customers].map((u) => [u.id, u]));
    const data = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      user: row.userId ? userMap.get(row.userId) ?? null : null,
      action: row.action,
      resource: row.resource,
      resourceId: row.resourceId,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));
    return { data, meta: { page, limit, total } };
  }

  private async resolveLocationIds(theaterId: string) {
    const theater = await this.prisma.theater.findUnique({
      where: { id: theaterId },
      select: { cityId: true, stateId: true, countryId: true },
    });
    if (!theater) throw new NotFoundException('Theater not found');
    return theater;
  }

  private generateSlug(input: string) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private resolveStatus(releaseDate: Date) {
    const now = new Date();
    if (releaseDate > now) return EventStatus.UPCOMING;
    const diffDays = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 90) return EventStatus.NOW_SELLING;
    return EventStatus.PAST;
  }

  private pickTrailer(videos: Array<Record<string, any>>) {
    const youtube = videos.filter((video) => video.site === 'YouTube');
    const best =
      youtube.find((video) => video.type === 'Trailer' && video.official) ??
      youtube.find((video) => video.type === 'Trailer') ??
      youtube[0];
    return best?.key ? `https://www.youtube.com/watch?v=${best.key}` : null;
  }

  private mapTmdbMovieToEvent(
    details: Record<string, any>,
    videos: Array<Record<string, any>>,
    movieId: string,
  ): Prisma.EventCreateManyInput {
    const trailer = this.pickTrailer(videos);
    const title = String(details.title ?? `TMDB Movie ${movieId}`).trim();
    const releaseDate = details.release_date ? new Date(details.release_date) : new Date();
    const slug = this.generateSlug(`${title}-${movieId}`);
    return {
      name: title,
      slug,
      releaseType: EventReleaseType.THEATRICAL,
      theatricalLink: details.homepage || null,
      trailerVideoLink: trailer ?? 'https://www.youtube.com',
      status: this.resolveStatus(releaseDate),
      description: details.overview || `${title} imported from TMDB`,
      location: this.mapLanguageCode(details.original_language),
      organizer: 'TMDB',
      type: EventType.MOVIE,
      cardImage: details.poster_path
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Poster',
      bannerImage: details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : 'https://via.placeholder.com/1280x720?text=No+Backdrop',
      releaseDate,
      duration: details.runtime ? `${details.runtime} min` : 'N/A',
      eventCurrency: 'AUD',
      isArchive: false,
    };
  }

  private extractGenreNames(details: Record<string, any>) {
    const byObjects = Array.isArray(details.genres)
      ? details.genres.map((item: Record<string, any>) => String(item?.name ?? '').trim()).filter(Boolean)
      : [];
    if (byObjects.length) return byObjects;
    const byIds = Array.isArray(details.genre_ids)
      ? details.genre_ids
          .map((id: number) => this.genreNameById(id))
          .filter((name): name is string => Boolean(name))
      : [];
    return [...new Set(byIds)];
  }

  private genreNameById(id: number) {
    const map: Record<number, string> = {
      28: 'Action',
      12: 'Adventure',
      16: 'Animation',
      35: 'Comedy',
      18: 'Drama',
      878: 'Sci-Fi',
      53: 'Thriller',
      80: 'Crime',
      36: 'History',
    };
    return map[id];
  }

  private mapLanguageCode(code?: string) {
    const map: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      bn: 'Bangla',
      es: 'Spanish',
      fr: 'French',
    };
    const key = String(code ?? '').trim().toLowerCase();
    if (!key) return 'Unknown';
    return map[key] ?? key.toUpperCase();
  }

  private async syncEventGenres(eventId: string, genres: string[]) {
    await this.prisma.crew.deleteMany({
      where: { eventId, type: 'GENRE' },
    });
    if (!genres.length) return;
    await this.prisma.crew.createMany({
      data: genres.map((name) => ({ eventId, name, type: 'GENRE' })),
      skipDuplicates: true,
    });
  }

  private async mapWithConcurrency<TInput, TOutput>(
    input: TInput[],
    concurrency: number,
    worker: (item: TInput) => Promise<TOutput>,
  ) {
    const results: TOutput[] = [];
    let index = 0;
    const run = async () => {
      while (index < input.length) {
        const current = index;
        index += 1;
        results[current] = await worker(input[current]);
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, concurrency) }, run));
    return results;
  }

  private async fetchTmdb(path: string, apiKey: string, query: Record<string, string> = {}) {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    url.searchParams.set('api_key', apiKey);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url.toString());
    if (!response.ok) throw new BadGatewayException(`TMDB request failed: ${path}`);
    return (await response.json()) as Record<string, any>;
  }
}
