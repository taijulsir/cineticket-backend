/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { PrismaClient, EventReleaseType, EventType, SeatCategory, SeatStatus } = require('@prisma/client');

function loadEnv() {
  const candidates = ['.env', '.env.development', '.env.production'];
  for (const file of candidates) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const raw = trimmed.slice(idx + 1).trim();
      if (!key || process.env[key]) continue;
      process.env[key] = raw.replace(/^"(.*)"$/, '$1');
    }
  }
}

loadEnv();
const prisma = new PrismaClient();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const LANGUAGE_MAP = { en: 'English', hi: 'Hindi', bn: 'Bangla', es: 'Spanish', fr: 'French' };
const GENRE_MAP = {
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
const THEATERS = [
  { name: 'CineTicket Central', address: '100 George St' },
  { name: 'CineTicket Downtown', address: '220 Pitt St' },
  { name: 'CineTicket Mall Cinema', address: '5 Mall Rd' },
  { name: 'CineTicket IMAX Arena', address: '88 Harbour Ave' },
  { name: 'CineTicket Grand Cinema', address: '17 King St' },
];
const HALLS = ['Hall A', 'Hall B', 'Hall C'];
const SHOW_TIMES = [
  { start: '10:30', end: '12:45' },
  { start: '14:30', end: '16:45' },
  { start: '19:30', end: '21:45' },
];
const ROWS = 8;
const COLUMNS = 12;
const MOVIE_LIMIT = Number(process.env.TMDB_MOVIE_LIMIT || 120);

function mapLanguage(code) {
  const key = String(code || '').trim().toLowerCase();
  return LANGUAGE_MAP[key] || (key ? key.toUpperCase() : 'Unknown');
}

function genreNames(details) {
  const namesFromObjects = Array.isArray(details.genres)
    ? details.genres.map((x) => String(x?.name || '').trim()).filter(Boolean)
    : [];
  if (namesFromObjects.length) return [...new Set(namesFromObjects)];
  const namesFromIds = Array.isArray(details.genre_ids)
    ? details.genre_ids.map((id) => GENRE_MAP[id]).filter(Boolean)
    : [];
  return [...new Set(namesFromIds)];
}

function resolveStatus(releaseDateString) {
  const date = releaseDateString ? new Date(releaseDateString) : new Date();
  const now = new Date();
  if (date > now) return 'UPCOMING';
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 90) return 'NOW_SELLING';
  return 'PAST';
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function pickTrailer(videos) {
  const youtube = (videos || []).filter((v) => v.site === 'YouTube');
  const best = youtube.find((v) => v.type === 'Trailer' && v.official) || youtube.find((v) => v.type === 'Trailer') || youtube[0];
  return best?.key ? `https://www.youtube.com/watch?v=${best.key}` : 'https://www.youtube.com';
}

function toSeatType(rowNumber) {
  if (rowNumber <= 2) return SeatCategory.PREMIUM;
  if (rowNumber <= 6) return SeatCategory.STANDARD;
  return SeatCategory.RECLINER;
}

async function tmdb(pathName, params = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error('TMDB_API_KEY is missing');
  const url = new URL(`${TMDB_BASE}${pathName}`);
  url.searchParams.set('api_key', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`TMDB request failed: ${pathName}`);
  return response.json();
}

async function mapWithConcurrency(items, concurrency, worker) {
  const out = new Array(items.length);
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const current = idx;
      idx += 1;
      out[current] = await worker(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, run));
  return out;
}

async function clearGeneratedData() {
  const generatedTheaters = await prisma.theater.findMany({
    where: { name: { in: THEATERS.map((t) => t.name) }, deletedAt: null },
    select: { id: true },
  });
  const generatedTheaterIds = generatedTheaters.map((x) => x.id);
  const hallRows = generatedTheaterIds.length
    ? await prisma.hall.findMany({ where: { theaterId: { in: generatedTheaterIds } }, select: { id: true } })
    : [];
  const hallIds = hallRows.map((x) => x.id);
  const tmdbEvents = await prisma.event.findMany({
    where: { organizer: 'TMDB', type: EventType.MOVIE, deletedAt: null },
    select: { id: true },
  });
  const tmdbEventIds = tmdbEvents.map((x) => x.id);
  const showRows = await prisma.show.findMany({
    where: {
      OR: [{ hallId: { in: hallIds.length ? hallIds : ['00000000-0000-0000-0000-000000000000'] } }, { eventId: { in: tmdbEventIds } }],
    },
    select: { id: true },
  });
  const showIds = showRows.map((x) => x.id);

  if (showIds.length) {
    await prisma.orderItem.deleteMany({ where: { OR: [{ order: { showId: { in: showIds } } }, { seat: { showId: { in: showIds } } }] } });
    await prisma.order.deleteMany({ where: { showId: { in: showIds } } });
    await prisma.pendingOrder.deleteMany({ where: { selectedShowsId: { in: showIds } } });
    await prisma.showSeat.deleteMany({ where: { showId: { in: showIds } } });
    await prisma.showPrice.deleteMany({ where: { showId: { in: showIds } } });
    await prisma.show.deleteMany({ where: { id: { in: showIds } } });
  }
  if (tmdbEventIds.length) {
    await prisma.crew.deleteMany({ where: { eventId: { in: tmdbEventIds } } });
    await prisma.eventPrice.deleteMany({ where: { eventId: { in: tmdbEventIds } } });
    await prisma.eventProducer.deleteMany({ where: { eventId: { in: tmdbEventIds } } });
    await prisma.eventUpvote.deleteMany({ where: { eventId: { in: tmdbEventIds } } });
    await prisma.heroSlider.deleteMany({ where: { eventId: { in: tmdbEventIds } } });
    await prisma.event.deleteMany({ where: { id: { in: tmdbEventIds } } });
  }
  if (hallIds.length) {
    await prisma.hallSeat.deleteMany({ where: { hallId: { in: hallIds } } });
    await prisma.hall.deleteMany({ where: { id: { in: hallIds } } });
  }
  if (generatedTheaterIds.length) {
    await prisma.theater.deleteMany({ where: { id: { in: generatedTheaterIds } } });
  }
}

async function ensureLocation() {
  let country = await prisma.country.findFirst({ where: { name: 'Australia', deletedAt: null } });
  if (!country) country = await prisma.country.create({ data: { name: 'Australia', isArchive: false } });
  let state = await prisma.state.findFirst({ where: { name: 'New South Wales', countryId: country.id, deletedAt: null } });
  if (!state) state = await prisma.state.create({ data: { name: 'New South Wales', countryId: country.id, isArchive: false } });
  let city = await prisma.city.findFirst({ where: { name: 'Sydney', stateId: state.id, deletedAt: null } });
  if (!city) city = await prisma.city.create({ data: { name: 'Sydney', stateId: state.id, isArchive: false } });
  return { country, state, city };
}

async function createTheatersHallsAndSeats(location) {
  const theaters = [];
  for (const theaterInput of THEATERS) {
    const theater = await prisma.theater.create({
      data: {
        name: theaterInput.name,
        address: theaterInput.address,
        zipCode: '2000',
        countryId: location.country.id,
        stateId: location.state.id,
        cityId: location.city.id,
        isArchive: false,
      },
    });

    const halls = [];
    for (const hallName of HALLS) {
      const hall = await prisma.hall.create({
        data: {
          theaterId: theater.id,
          name: hallName,
          numberOfRows: ROWS,
          numberOfColumns: COLUMNS,
          isArchive: false,
        },
      });

      const seats = [];
      for (let r = 1; r <= ROWS; r += 1) {
        const rowLabel = String.fromCharCode(64 + r);
        for (let c = 1; c <= COLUMNS; c += 1) {
          seats.push({
            hallId: hall.id,
            row: r,
            column: c,
            seatId: `${rowLabel}${c}`,
            seatName: `${rowLabel}${c}`,
            seatType: toSeatType(r),
          });
        }
      }
      await prisma.hallSeat.createMany({ data: seats });
      const hallSeats = await prisma.hallSeat.findMany({
        where: { hallId: hall.id, deletedAt: null },
        orderBy: [{ row: 'asc' }, { column: 'asc' }],
        select: { id: true, seatType: true },
      });
      halls.push({ ...hall, seats: hallSeats });
    }
    theaters.push({ ...theater, halls });
  }
  return theaters;
}

async function importMoviesFromTmdb() {
  const listingEndpoints = ['/movie/popular', '/movie/top_rated', '/movie/now_playing', '/movie/upcoming'];
  const pages = [1, 2, 3];
  const lists = await Promise.all(listingEndpoints.flatMap((pathName) => pages.map((page) => tmdb(pathName, { page }))));
  const ids = [...new Set(lists.flatMap((payload) => payload.results || []).map((movie) => String(movie.id)).filter(Boolean))].slice(
    0,
    MOVIE_LIMIT,
  );
  console.log(`TMDB fetched IDs: ${ids.length}`);

  const mapped = await mapWithConcurrency(ids, 6, async (movieId) => {
    const [details, videos] = await Promise.all([tmdb(`/movie/${movieId}`), tmdb(`/movie/${movieId}/videos`)]);
    const title = String(details.title || `TMDB Movie ${movieId}`).trim();
    const releaseDate = details.release_date ? new Date(details.release_date) : new Date();
    const year = releaseDate.getUTCFullYear();
    const genres = genreNames(details);
    return {
      slug: slugify(`${title}-${movieId}`),
      data: {
        name: title,
        slug: slugify(`${title}-${movieId}`),
        releaseType: EventReleaseType.THEATRICAL,
        theatricalLink: details.homepage || null,
        trailerVideoLink: pickTrailer(videos.results || []),
        status: resolveStatus(details.release_date),
        description: `${details.overview || `${title} imported from TMDB`}\n\nFormat: 2D\nYear: ${year}\nGenres: ${genres.join(', ')}`,
        location: mapLanguage(details.original_language),
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
      },
      genres,
    };
  });

  let created = 0;
  const events = [];
  for (const item of mapped) {
    const event = await prisma.event.create({ data: item.data });
    if (item.genres.length) {
      await prisma.crew.createMany({
        data: item.genres.map((genre) => ({ eventId: event.id, name: genre, type: 'GENRE' })),
      });
    }
    events.push(event);
    created += 1;
  }
  console.log(`TMDB movies imported: ${created}`);
  return events;
}

async function createShows(events, theaters, location) {
  let showCount = 0;
  let showSeatCount = 0;
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const showsPerMovie = 3;
    for (let s = 0; s < showsPerMovie; s += 1) {
      const theater = theaters[(i + s) % theaters.length];
      const hall = theater.halls[(i + s) % theater.halls.length];
      const time = SHOW_TIMES[s % SHOW_TIMES.length];
      const dayOffset = event.status === 'UPCOMING' ? 4 + ((i + s) % 18) : (i + s) % 7;
      const showDate = new Date();
      showDate.setHours(0, 0, 0, 0);
      showDate.setDate(showDate.getDate() + dayOffset);

      const show = await prisma.show.create({
        data: {
          eventId: event.id,
          theaterId: theater.id,
          hallId: hall.id,
          cityId: location.city.id,
          stateId: location.state.id,
          countryId: location.country.id,
          date: showDate,
          startTime: time.start,
          endTime: time.end,
          totalSeats: ROWS * COLUMNS,
          totalSoldTickets: 0,
          isArchive: false,
        },
      });

      await prisma.showPrice.createMany({
        data: [
          { showId: show.id, status: SeatCategory.STANDARD, price: 8 },
          { showId: show.id, status: SeatCategory.PREMIUM, price: 12 },
          { showId: show.id, status: SeatCategory.RECLINER, price: 18 },
        ],
      });

      await prisma.showSeat.createMany({
        data: hall.seats.map((seat) => ({
          showId: show.id,
          hallSeatId: seat.id,
          status: SeatStatus.AVAILABLE,
        })),
      });

      showCount += 1;
      showSeatCount += hall.seats.length;
    }
  }
  return { showCount, showSeatCount };
}

async function generateCinemaData() {
  console.log('Starting full cinema data generation...');
  await clearGeneratedData();
  const location = await ensureLocation();
  const theaters = await createTheatersHallsAndSeats(location);
  const events = await importMoviesFromTmdb();
  const { showCount, showSeatCount } = await createShows(events, theaters, location);

  console.log('Cinema dataset generation completed.');
  console.log(
    JSON.stringify(
      {
        theaters: theaters.length,
        halls: theaters.length * HALLS.length,
        seatsPerHall: ROWS * COLUMNS,
        movies: events.length,
        shows: showCount,
        showSeats: showSeatCount,
      },
      null,
      2,
    ),
  );
}

generateCinemaData()
  .catch((error) => {
    console.error('generateCinemaData failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
