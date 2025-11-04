-- Run after prisma migrate to enforce seat uniqueness only for active order items.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_seat
ON order_items (seat_id)
WHERE is_active = true;
