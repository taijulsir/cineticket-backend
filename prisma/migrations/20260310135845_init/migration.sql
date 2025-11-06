-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Employee', 'Customer');

-- CreateEnum
CREATE TYPE "EventReleaseType" AS ENUM ('PRIVATE_SCREEN', 'THEATRICAL');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('NOW_SELLING', 'UPCOMING', 'VOTE_TO_BRING', 'PAST');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MOVIE', 'OTHERS');

-- CreateEnum
CREATE TYPE "SeatCategory" AS ENUM ('KIDS', 'WHEELCHAIR', 'STANDARD', 'RECLINER', 'PREMIUM', 'STAIR', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENTAGE', 'AMOUNT', 'FREE_TICKET');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "mobile" VARCHAR(32),
    "dp" TEXT,
    "gender" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_social" BOOLEAN NOT NULL DEFAULT false,
    "google_id" TEXT,
    "country" TEXT,
    "city" TEXT,
    "street" TEXT,
    "zip_code" TEXT,
    "role" "Role" NOT NULL DEFAULT 'Customer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "dp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_invites" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "level" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employee_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" UUID NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "state_id" UUID NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theaters" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "city_id" UUID NOT NULL,
    "state_id" UUID NOT NULL,
    "zip_code" TEXT NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "theaters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "halls" (
    "id" UUID NOT NULL,
    "theater_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "number_of_rows" INTEGER NOT NULL,
    "number_of_columns" INTEGER NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "halls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_seats" (
    "id" UUID NOT NULL,
    "hall_id" UUID NOT NULL,
    "seat_name" TEXT,
    "seat_id" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "seat_type" "SeatCategory" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hall_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "release_type" "EventReleaseType" NOT NULL,
    "theatrical_link" TEXT,
    "trailer_video_link" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "vote_of_bring" INTEGER NOT NULL DEFAULT 0,
    "card_image" TEXT NOT NULL,
    "banner_image" TEXT NOT NULL,
    "release_date" TIMESTAMP(3) NOT NULL,
    "duration" TEXT NOT NULL,
    "event_currency" TEXT NOT NULL DEFAULT 'AUD',
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crews" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_prices" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "event_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shows" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "hall_id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "state_id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "theater_id" UUID NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "total_seats" INTEGER,
    "total_sold_tickets" INTEGER,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "show_seats" (
    "id" UUID NOT NULL,
    "show_id" UUID NOT NULL,
    "hall_seat_id" UUID NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "reserved_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "show_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "show_prices" (
    "id" UUID NOT NULL,
    "show_id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "SeatCategory" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "show_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocodes" (
    "id" UUID NOT NULL,
    "promo_code" TEXT NOT NULL,
    "maxlimit" INTEGER NOT NULL,
    "discount_type" "PromoDiscountType" NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "promocodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_code" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "mobile_number" TEXT,
    "customer_id" UUID,
    "event_id" UUID NOT NULL,
    "show_id" UUID NOT NULL,
    "promo_code_id" UUID,
    "discount" DECIMAL(10,2),
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "state" "OrderState" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "seat_id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_orders" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "mobile_number" TEXT,
    "customer_id" UUID,
    "event_id" UUID NOT NULL,
    "selected_shows_id" UUID NOT NULL,
    "promo_code_id" UUID,
    "discount" DECIMAL(10,2),
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripe_session_id" TEXT,
    "ticket_items" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pending_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_upvotes" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "event_upvotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_producers" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "producer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "event_producers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_sliders" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "precedence" INTEGER NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hero_sliders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "visibility" BOOLEAN NOT NULL,
    "link" TEXT NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_category_featured" BOOLEAN NOT NULL,
    "image" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" UUID NOT NULL,
    "poster" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "precedence" INTEGER NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "is_archive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toofan_at_hoyts_in_australia" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "mobile_number" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "toofan_at_hoyts_in_australia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "device" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_created_at_idx" ON "customers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_created_at_idx" ON "employees"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "employee_invites_email_key" ON "employee_invites"("email");

-- CreateIndex
CREATE INDEX "employee_invites_employee_id_idx" ON "employee_invites"("employee_id");

-- CreateIndex
CREATE INDEX "employee_invites_created_at_idx" ON "employee_invites"("created_at");

-- CreateIndex
CREATE INDEX "countries_is_archive_idx" ON "countries"("is_archive");

-- CreateIndex
CREATE INDEX "states_country_id_idx" ON "states"("country_id");

-- CreateIndex
CREATE INDEX "states_is_archive_idx" ON "states"("is_archive");

-- CreateIndex
CREATE INDEX "cities_state_id_idx" ON "cities"("state_id");

-- CreateIndex
CREATE INDEX "cities_is_archive_idx" ON "cities"("is_archive");

-- CreateIndex
CREATE INDEX "theaters_country_id_idx" ON "theaters"("country_id");

-- CreateIndex
CREATE INDEX "theaters_city_id_idx" ON "theaters"("city_id");

-- CreateIndex
CREATE INDEX "theaters_state_id_idx" ON "theaters"("state_id");

-- CreateIndex
CREATE INDEX "theaters_is_archive_idx" ON "theaters"("is_archive");

-- CreateIndex
CREATE INDEX "halls_theater_id_idx" ON "halls"("theater_id");

-- CreateIndex
CREATE INDEX "halls_is_archive_idx" ON "halls"("is_archive");

-- CreateIndex
CREATE INDEX "hall_seats_hall_id_idx" ON "hall_seats"("hall_id");

-- CreateIndex
CREATE UNIQUE INDEX "hall_seats_hall_id_row_column_key" ON "hall_seats"("hall_id", "row", "column");

-- CreateIndex
CREATE UNIQUE INDEX "hall_seats_hall_id_seat_id_key" ON "hall_seats"("hall_id", "seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_status_is_archive_idx" ON "events"("status", "is_archive");

-- CreateIndex
CREATE INDEX "events_release_date_idx" ON "events"("release_date");

-- CreateIndex
CREATE INDEX "events_created_at_idx" ON "events"("created_at");

-- CreateIndex
CREATE INDEX "crews_event_id_idx" ON "crews"("event_id");

-- CreateIndex
CREATE INDEX "crews_is_archive_idx" ON "crews"("is_archive");

-- CreateIndex
CREATE INDEX "event_prices_event_id_idx" ON "event_prices"("event_id");

-- CreateIndex
CREATE INDEX "shows_event_id_date_idx" ON "shows"("event_id", "date");

-- CreateIndex
CREATE INDEX "shows_city_id_state_id_country_id_idx" ON "shows"("city_id", "state_id", "country_id");

-- CreateIndex
CREATE INDEX "shows_theater_id_hall_id_date_idx" ON "shows"("theater_id", "hall_id", "date");

-- CreateIndex
CREATE INDEX "shows_created_at_idx" ON "shows"("created_at");

-- CreateIndex
CREATE INDEX "show_seats_show_id_status_idx" ON "show_seats"("show_id", "status");

-- CreateIndex
CREATE INDEX "show_seats_show_id_reserved_until_idx" ON "show_seats"("show_id", "reserved_until");

-- CreateIndex
CREATE INDEX "show_seats_created_at_idx" ON "show_seats"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "show_seats_show_id_hall_seat_id_key" ON "show_seats"("show_id", "hall_seat_id");

-- CreateIndex
CREATE INDEX "show_prices_show_id_idx" ON "show_prices"("show_id");

-- CreateIndex
CREATE UNIQUE INDEX "promocodes_promo_code_key" ON "promocodes"("promo_code");

-- CreateIndex
CREATE INDEX "promocodes_is_active_idx" ON "promocodes"("is_active");

-- CreateIndex
CREATE INDEX "promocodes_created_at_idx" ON "promocodes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");

-- CreateIndex
CREATE INDEX "orders_customer_id_created_at_idx" ON "orders"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_event_id_idx" ON "orders"("event_id");

-- CreateIndex
CREATE INDEX "orders_show_id_idx" ON "orders"("show_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_seat_id_idx" ON "order_items"("seat_id");

-- CreateIndex
CREATE INDEX "order_items_is_active_idx" ON "order_items"("is_active");

-- CreateIndex
CREATE INDEX "order_items_created_at_idx" ON "order_items"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "pending_orders_stripe_session_id_key" ON "pending_orders"("stripe_session_id");

-- CreateIndex
CREATE INDEX "pending_orders_customer_id_idx" ON "pending_orders"("customer_id");

-- CreateIndex
CREATE INDEX "pending_orders_event_id_idx" ON "pending_orders"("event_id");

-- CreateIndex
CREATE INDEX "pending_orders_selected_shows_id_idx" ON "pending_orders"("selected_shows_id");

-- CreateIndex
CREATE INDEX "pending_orders_status_idx" ON "pending_orders"("status");

-- CreateIndex
CREATE INDEX "pending_orders_created_at_idx" ON "pending_orders"("created_at");

-- CreateIndex
CREATE INDEX "event_upvotes_event_id_idx" ON "event_upvotes"("event_id");

-- CreateIndex
CREATE INDEX "event_upvotes_customer_id_idx" ON "event_upvotes"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_upvotes_event_id_customer_id_key" ON "event_upvotes"("event_id", "customer_id");

-- CreateIndex
CREATE INDEX "event_producers_event_id_idx" ON "event_producers"("event_id");

-- CreateIndex
CREATE INDEX "event_producers_producer_id_idx" ON "event_producers"("producer_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_producers_event_id_producer_id_key" ON "event_producers"("event_id", "producer_id");

-- CreateIndex
CREATE INDEX "hero_sliders_event_id_idx" ON "hero_sliders"("event_id");

-- CreateIndex
CREATE INDEX "hero_sliders_precedence_idx" ON "hero_sliders"("precedence");

-- CreateIndex
CREATE INDEX "social_links_visibility_idx" ON "social_links"("visibility");

-- CreateIndex
CREATE INDEX "ads_precedence_idx" ON "ads"("precedence");

-- CreateIndex
CREATE INDEX "ticket_categories_is_archive_idx" ON "ticket_categories"("is_archive");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_role_idx" ON "refresh_tokens"("role");

-- CreateIndex
CREATE INDEX "refresh_tokens_ip_address_idx" ON "refresh_tokens"("ip_address");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "employee_invites" ADD CONSTRAINT "employee_invites_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theaters" ADD CONSTRAINT "theaters_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theaters" ADD CONSTRAINT "theaters_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theaters" ADD CONSTRAINT "theaters_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halls" ADD CONSTRAINT "halls_theater_id_fkey" FOREIGN KEY ("theater_id") REFERENCES "theaters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_seats" ADD CONSTRAINT "hall_seats_hall_id_fkey" FOREIGN KEY ("hall_id") REFERENCES "halls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crews" ADD CONSTRAINT "crews_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_prices" ADD CONSTRAINT "event_prices_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_hall_id_fkey" FOREIGN KEY ("hall_id") REFERENCES "halls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_theater_id_fkey" FOREIGN KEY ("theater_id") REFERENCES "theaters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_seats" ADD CONSTRAINT "show_seats_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_seats" ADD CONSTRAINT "show_seats_hall_seat_id_fkey" FOREIGN KEY ("hall_seat_id") REFERENCES "hall_seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_prices" ADD CONSTRAINT "show_prices_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promocodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "show_seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_orders" ADD CONSTRAINT "pending_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_orders" ADD CONSTRAINT "pending_orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_orders" ADD CONSTRAINT "pending_orders_selected_shows_id_fkey" FOREIGN KEY ("selected_shows_id") REFERENCES "shows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_orders" ADD CONSTRAINT "pending_orders_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promocodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_upvotes" ADD CONSTRAINT "event_upvotes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_upvotes" ADD CONSTRAINT "event_upvotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_producers" ADD CONSTRAINT "event_producers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_producers" ADD CONSTRAINT "event_producers_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_sliders" ADD CONSTRAINT "hero_sliders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
