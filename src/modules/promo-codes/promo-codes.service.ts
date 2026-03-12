import { BadRequestException, Injectable } from '@nestjs/common';
import { PromoCategory, PromoDiscountType } from '@prisma/client';
import { ApplyPromoCodeDto } from './dto';
import { PromoCodesRepository } from './promo-codes.repository';

@Injectable()
export class PromoCodesService {
  constructor(private readonly repository: PromoCodesRepository) {}

  healthCheck() {
    return { module: 'promo-codes', status: 'ok' };
  }

  async listOffers() {
    const now = new Date();
    const rows = await this.repository.listActiveOffers(now);
    const categoryCounts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.category] = (acc[row.category] ?? 0) + 1;
      return acc;
    }, {});
    return {
      categories: this.getCategoryMeta().map((item) => ({
        key: item.key,
        label: item.label,
        count: categoryCounts[item.key] ?? 0,
      })),
      offers: rows.map((row) => ({
        id: row.id,
        title: row.description || row.promoCode,
        description: row.description || `Use ${row.promoCode} on checkout`,
        code: row.promoCode,
        category: this.getCategoryLabel(row.category),
        categoryKey: row.category,
        discountType: row.discountType,
        discountAmount: Number(row.discountAmount),
        minOrderAmount: Number(row.minOrderAmount),
        validUntil: row.expiresAt,
        startsAt: row.startsAt,
        maxlimit: row.maxlimit,
        usageCount: row.usageCount,
      })),
    };
  }

  async applyPromoCode(dto: ApplyPromoCodeDto) {
    const promo = await this.repository.findByCode(dto.promoCode.trim());
    if (!promo) throw new BadRequestException('Invalid promo code');
    if (!promo.isActive) throw new BadRequestException('Promo code is inactive');
    if (promo.maxlimit <= 0) throw new BadRequestException('Promo code max limit reached');
    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) throw new BadRequestException('Promo code is not started yet');
    if (promo.expiresAt && promo.expiresAt < now) throw new BadRequestException('Promo code has expired');
    const total = Number(dto.totalPrice || 0);
    const minOrder = Number(promo.minOrderAmount);
    if (total < minOrder) {
      throw new BadRequestException(`Minimum order amount is ${minOrder}`);
    }

    let discount = 0;
    if (promo.discountType === PromoDiscountType.PERCENTAGE) {
      discount = (total * Number(promo.discountAmount)) / 100;
    } else if (promo.discountType === PromoDiscountType.AMOUNT) {
      discount = Number(promo.discountAmount);
    } else {
      const seatPrices = (dto.selectedSeats ?? [])
        .map((seat) => Number(seat?.price || 0))
        .filter((price) => Number.isFinite(price) && price > 0);
      discount = seatPrices.length ? Math.min(...seatPrices) : Number(promo.discountAmount || 0);
    }

    discount = Math.max(0, Math.min(total, Number(discount.toFixed(2))));
    const totalPrice = Number((total - discount).toFixed(2));
    return {
      promoCodeId: promo.id,
      promoCode: promo.promoCode,
      discount,
      totalPrice,
      discountType: promo.discountType,
    };
  }

  private getCategoryMeta() {
    return [
      { key: PromoCategory.TICKET_DISCOUNTS, label: 'Ticket Discounts' },
      { key: PromoCategory.FOOD_SNACKS, label: 'Food & Snacks' },
      { key: PromoCategory.PREMIUM_UPGRADES, label: 'Premium Upgrades' },
      { key: PromoCategory.STUDENT_OFFERS, label: 'Student Offers' },
      { key: PromoCategory.WEEKEND_DEALS, label: 'Weekend Deals' },
    ];
  }

  private getCategoryLabel(category: PromoCategory) {
    return this.getCategoryMeta().find((item) => item.key === category)?.label ?? 'Ticket Discounts';
  }
}
