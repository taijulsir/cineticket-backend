import { EventReleaseType, EventStatus, EventType, OrderState, PrismaClient, PromoDiscountType, Role, SeatCategory, SeatStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pendingOrder.deleteMany();
  await prisma.showSeat.deleteMany();
  await prisma.showPrice.deleteMany();
  await prisma.show.deleteMany();
  await prisma.eventPrice.deleteMany();
  await prisma.crew.deleteMany();
  await prisma.eventProducer.deleteMany();
  await prisma.eventUpvote.deleteMany();
  await prisma.heroSlider.deleteMany();
  await prisma.event.deleteMany();
  await prisma.hallSeat.deleteMany();
  await prisma.hall.deleteMany();
  await prisma.theater.deleteMany();
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();
  await prisma.country.deleteMany();
  await prisma.employee.deleteMany();

  const country = await prisma.country.create({ data: { name: 'Australia' } });
  const state = await prisma.state.create({ data: { name: 'New South Wales', countryId: country.id } });
  const city = await prisma.city.create({ data: { name: 'Sydney', stateId: state.id } });

  const theater = await prisma.theater.create({
    data: {
      name: 'CineTicket Central',
      countryId: country.id,
      stateId: state.id,
      cityId: city.id,
      address: '100 George St',
      zipCode: '2000',
    },
  });

  const hall = await prisma.hall.create({
    data: { theaterId: theater.id, name: 'Hall 1', numberOfRows: 5, numberOfColumns: 10 },
  });

  const rowNames = ['A', 'B', 'C', 'D', 'E'];
  const hallSeats = rowNames.flatMap((row, rIdx) =>
    Array.from({ length: 10 }).map((_, cIdx) => ({
      hallId: hall.id,
      row: rIdx + 1,
      column: cIdx + 1,
      seatName: `${row}${cIdx + 1}`,
      seatId: `${row}${cIdx + 1}`,
      seatType: SeatCategory.STANDARD,
    })),
  );
  await prisma.hallSeat.createMany({ data: hallSeats });
  const createdHallSeats = await prisma.hallSeat.findMany({ where: { hallId: hall.id }, orderBy: [{ row: 'asc' }, { column: 'asc' }] });

  const adminPassword = await bcrypt.hash('Password@123', 10);
  await prisma.employee.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: Role.Admin,
    },
  });

  const event = await prisma.event.create({
    data: {
      name: 'Sample Premiere',
      slug: 'sample-premiere',
      releaseType: EventReleaseType.THEATRICAL,
      trailerVideoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: EventStatus.NOW_SELLING,
      description: 'Seed event for local runtime verification',
      location: 'Sydney',
      organizer: 'CineTicket',
      type: EventType.MOVIE,
      cardImage: 'https://example.com/card.jpg',
      bannerImage: 'https://example.com/banner.jpg',
      releaseDate: new Date(),
      duration: '2h 10m',
      eventCurrency: 'AUD',
    },
  });

  const showDate = new Date();
  showDate.setDate(showDate.getDate() + 1);

  const show = await prisma.show.create({
    data: {
      eventId: event.id,
      hallId: hall.id,
      cityId: city.id,
      stateId: state.id,
      countryId: country.id,
      theaterId: theater.id,
      startTime: '18:00',
      endTime: '20:10',
      date: showDate,
      totalSeats: createdHallSeats.length,
      totalSoldTickets: 1,
    },
  });

  await prisma.showSeat.createMany({
    data: createdHallSeats.map((seat, idx) => ({
      showId: show.id,
      hallSeatId: seat.id,
      status: idx === 0 ? SeatStatus.BOOKED : SeatStatus.AVAILABLE,
    })),
  });

  const customerPassword = await bcrypt.hash('Customer@123', 10);
  const customer = await prisma.customer.create({
    data: {
      name: 'Test Customer',
      email: 'customer@example.com',
      passwordHash: customerPassword,
      mobile: '+610400000000',
      role: Role.Customer,
      isVerified: true,
    },
  });

  const promo = await prisma.promocode.create({
    data: {
      promoCode: 'WELCOME10',
      maxlimit: 100,
      discountType: PromoDiscountType.PERCENTAGE,
      discountAmount: 10,
      isActive: true,
    },
  });

  const bookedShowSeat = await prisma.showSeat.findFirstOrThrow({
    where: { showId: show.id, status: SeatStatus.BOOKED },
    orderBy: { createdAt: 'asc' },
  });

  const order = await prisma.order.create({
    data: {
      orderCode: `ORD-${new Date().getFullYear()}-000001`,
      name: customer.name,
      email: customer.email,
      mobileNumber: customer.mobile,
      customerId: customer.id,
      eventId: event.id,
      showId: show.id,
      promoCodeId: promo.id,
      discount: 2,
      total: 18,
      paymentMethod: 'CARD',
      transactionId: 'txn_seed_001',
      state: OrderState.CONFIRMED,
      isActive: true,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      seatId: bookedShowSeat.id,
      price: 20,
      isActive: true,
    },
  });

  await prisma.pendingOrder.create({
    data: {
      name: 'Guest Customer',
      email: 'guest@example.com',
      mobileNumber: '+610411111111',
      eventId: event.id,
      selectedShowsId: show.id,
      total: 20,
      status: 'pending',
      ticketItems: [{ seatId: bookedShowSeat.id, price: 20 }],
    },
  });

  console.log(`Created theater ${theater.name}, hall ${hall.name}, show ${show.id}, and sample orders.`);

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
