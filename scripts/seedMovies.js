/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const movies = [
  { title: 'Dune: Part Two', slug: 'dune-part-two', posterUrl: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/5YZbUmjbMa3ClvSW1Wj3D6XGolb.jpg', trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w', runtime: 166, genres: ['Sci-Fi', 'Adventure'], language: 'English', rating: 8.8, synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge and destiny.', releaseDate: '2024-03-01' },
  { title: 'Oppenheimer', slug: 'oppenheimer', posterUrl: 'https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg', trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg', runtime: 180, genres: ['Drama', 'History'], language: 'English', rating: 8.4, synopsis: 'The story of J. Robert Oppenheimer and the race to build the atomic bomb.', releaseDate: '2023-07-21' },
  { title: 'Barbie', slug: 'barbie', posterUrl: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/nHf61UzkfFno5X1ofIhugCPus2R.jpg', trailerUrl: 'https://www.youtube.com/watch?v=pBk4NYhWNMM', runtime: 114, genres: ['Comedy', 'Fantasy'], language: 'English', rating: 7.0, synopsis: 'Barbie and Ken journey from Barbie Land into the real world.', releaseDate: '2023-07-21' },
  { title: 'Spider-Man: Across the Spider-Verse', slug: 'spider-man-across-the-spider-verse', posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/nGxUxi3PfXDRm7Vg95VBNgNM8yc.jpg', trailerUrl: 'https://www.youtube.com/watch?v=shW9i6k8cB0', runtime: 140, genres: ['Animation', 'Action'], language: 'English', rating: 8.6, synopsis: 'Miles Morales goes on an epic multiverse adventure with Gwen Stacy.', releaseDate: '2023-06-02' },
  { title: 'John Wick: Chapter 4', slug: 'john-wick-chapter-4', posterUrl: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg', trailerUrl: 'https://www.youtube.com/watch?v=qEVUtrk8_B4', runtime: 170, genres: ['Action', 'Thriller'], language: 'English', rating: 8.1, synopsis: 'John Wick uncovers a path to defeating The High Table.', releaseDate: '2023-03-24' },
  { title: 'The Batman', slug: 'the-batman', posterUrl: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg', trailerUrl: 'https://www.youtube.com/watch?v=mqqft2x_Aa4', runtime: 176, genres: ['Crime', 'Mystery'], language: 'English', rating: 7.8, synopsis: 'Batman ventures into Gotham’s underworld when a sadistic killer leaves clues.', releaseDate: '2022-03-04' },
  { title: 'Interstellar', slug: 'interstellar', posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg', trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E', runtime: 169, genres: ['Sci-Fi', 'Drama'], language: 'English', rating: 8.7, synopsis: 'A group of explorers travel through a wormhole in space to ensure humanity’s survival.', releaseDate: '2014-11-07' },
  { title: 'Inception', slug: 'inception', posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg', trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0', runtime: 148, genres: ['Sci-Fi', 'Thriller'], language: 'English', rating: 8.8, synopsis: 'A thief who steals corporate secrets through dream-sharing technology gets a final chance.', releaseDate: '2010-07-16' },
  { title: 'Avatar: The Way of Water', slug: 'avatar-the-way-of-water', posterUrl: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg', trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0', runtime: 192, genres: ['Sci-Fi', 'Adventure'], language: 'English', rating: 7.6, synopsis: 'Jake Sully lives with his family on Pandora and must protect them from a familiar threat.', releaseDate: '2022-12-16' },
  { title: 'Top Gun: Maverick', slug: 'top-gun-maverick', posterUrl: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg', trailerUrl: 'https://www.youtube.com/watch?v=giXco2jaZ_4', runtime: 131, genres: ['Action', 'Drama'], language: 'English', rating: 8.3, synopsis: 'After thirty years, Maverick trains a new generation of elite pilots for a dangerous mission.', releaseDate: '2022-05-27' },
  { title: 'The Dark Knight', slug: 'the-dark-knight', posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg', trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY', runtime: 152, genres: ['Action', 'Crime'], language: 'English', rating: 9.0, synopsis: 'Batman raises the stakes in his war on crime as the Joker wreaks havoc on Gotham.', releaseDate: '2008-07-18' },
  { title: 'Mad Max: Fury Road', slug: 'mad-max-fury-road', posterUrl: 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg', trailerUrl: 'https://www.youtube.com/watch?v=hEJnMQG9ev8', runtime: 120, genres: ['Action', 'Adventure'], language: 'English', rating: 8.1, synopsis: 'In a post-apocalyptic wasteland, Max teams up with Furiosa to flee a tyrant.', releaseDate: '2015-05-15' },
  { title: 'Gladiator II', slug: 'gladiator-ii', posterUrl: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/xj0oD6f5Q2z0F2q7prnQ9vyvye6.jpg', trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo', runtime: 150, genres: ['Action', 'Drama'], language: 'English', rating: 7.2, synopsis: 'A new hero rises in Rome to challenge corruption and reclaim honor.', releaseDate: '2024-11-22' },
  { title: 'Mission: Impossible - Dead Reckoning Part One', slug: 'mission-impossible-dead-reckoning-part-one', posterUrl: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/628Dep6AxEtDxjZoGP78TsOxYbK.jpg', trailerUrl: 'https://www.youtube.com/watch?v=avz06PDqDbM', runtime: 163, genres: ['Action', 'Spy'], language: 'English', rating: 7.7, synopsis: 'Ethan Hunt and team race to stop a terrifying weapon before it falls into the wrong hands.', releaseDate: '2023-07-12' },
  { title: 'No Time to Die', slug: 'no-time-to-die', posterUrl: 'https://image.tmdb.org/t/p/w500/iUgygt3fscRoKWCV1d0C7FbM9TP.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/rurhkVVdDWWM4o8Fh9w3a6Q6M0s.jpg', trailerUrl: 'https://www.youtube.com/watch?v=BIhNsAtPbPI', runtime: 163, genres: ['Action', 'Thriller'], language: 'English', rating: 7.3, synopsis: 'James Bond is pulled out of retirement to rescue a kidnapped scientist.', releaseDate: '2021-10-08' },
  { title: 'The Matrix Resurrections', slug: 'the-matrix-resurrections', posterUrl: 'https://image.tmdb.org/t/p/w500/8c4a8kE7PizaGQQnditMmI1xbRp.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/eNI7PtK6DEYgZmHWP9gQNuff8pv.jpg', trailerUrl: 'https://www.youtube.com/watch?v=9ix7TUGVYIo', runtime: 148, genres: ['Sci-Fi', 'Action'], language: 'English', rating: 5.7, synopsis: 'Neo’s reality unravels again as old allies return and new threats emerge.', releaseDate: '2021-12-22' },
  { title: 'Everything Everywhere All at Once', slug: 'everything-everywhere-all-at-once', posterUrl: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/z5A5W3WYJc3UVEWljSGwdjDgQ0j.jpg', trailerUrl: 'https://www.youtube.com/watch?v=wxN1T1uxQ2g', runtime: 139, genres: ['Sci-Fi', 'Comedy'], language: 'English', rating: 8.0, synopsis: 'A laundromat owner must connect with alternate-universe versions of herself.', releaseDate: '2022-03-25' },
  { title: 'The Super Mario Bros. Movie', slug: 'the-super-mario-bros-movie', posterUrl: 'https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/9n2tJBplPbgR2ca05hS5CKXwP2c.jpg', trailerUrl: 'https://www.youtube.com/watch?v=TnGl01FkMMo', runtime: 92, genres: ['Animation', 'Family'], language: 'English', rating: 7.1, synopsis: 'Mario and Luigi enter a magical world to save the Mushroom Kingdom.', releaseDate: '2023-04-05' },
  { title: 'Kung Fu Panda 4', slug: 'kung-fu-panda-4', posterUrl: 'https://image.tmdb.org/t/p/w500/nqXsAaQsKw2gKpkfhIgjXNDRqg7.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/6X2QCyF3rXz6rPfJ9Q9PFQScn2v.jpg', trailerUrl: 'https://www.youtube.com/watch?v=_inKs4eeHiI', runtime: 94, genres: ['Animation', 'Action'], language: 'English', rating: 7.0, synopsis: 'Po must become the Spiritual Leader and train a new Dragon Warrior.', releaseDate: '2024-03-08' },
  { title: 'Godzilla x Kong: The New Empire', slug: 'godzilla-x-kong-the-new-empire', posterUrl: 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/6Wjz4Qj8v8h9ME8fUm4fHYPrJ8R.jpg', trailerUrl: 'https://www.youtube.com/watch?v=qqrpMRDuPfc', runtime: 115, genres: ['Action', 'Sci-Fi'], language: 'English', rating: 6.8, synopsis: 'Godzilla and Kong confront a colossal hidden threat from the Hollow Earth.', releaseDate: '2024-03-29' },
];

function resolveStatus(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  if (date > now) return 'UPCOMING';
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 120) return 'NOW_SELLING';
  return 'PAST';
}

async function seed() {
  const shouldClear = process.env.CLEAR_EXISTING_MOVIES === 'true';
  if (shouldClear) {
    await prisma.event.deleteMany({
      where: { organizer: { in: ['Movie Seed', 'TMDB'] }, type: 'MOVIE' },
    });
    console.log('Cleared existing seeded movie events');
  }

  let created = 0;
  let updated = 0;
  for (const movie of movies) {
    const data = {
      name: movie.title,
      slug: movie.slug,
      releaseType: 'THEATRICAL',
      trailerVideoLink: movie.trailerUrl,
      status: resolveStatus(movie.releaseDate),
      description: `${movie.synopsis}\n\nLanguage: ${movie.language}\nRating: ${movie.rating}\nGenres: ${movie.genres.join(', ')}`,
      location: movie.language,
      organizer: 'Movie Seed',
      type: 'MOVIE',
      cardImage: movie.posterUrl,
      bannerImage: movie.backdropUrl,
      releaseDate: new Date(movie.releaseDate),
      duration: `${movie.runtime} min`,
      eventCurrency: 'AUD',
      isArchive: false,
    };
    const existing = await prisma.event.findUnique({ where: { slug: movie.slug } });
    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.event.create({ data });
      created += 1;
    }
  }

  console.log(`Movie seeding complete: created=${created}, updated=${updated}, total=${movies.length}`);
}

seed()
  .catch((error) => {
    console.error('Movie seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
