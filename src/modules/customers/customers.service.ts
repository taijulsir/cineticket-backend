import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  constructor(private readonly repository: CustomersRepository) {}

  healthCheck() {
    return { module: 'customers', status: 'ok' };
  }

  async getProfile(customerId: string) {
    const profile = await this.repository.findProfileWithOrders(customerId);
    if (!profile) throw new NotFoundException('Customer not found');
    return profile;
  }
}
