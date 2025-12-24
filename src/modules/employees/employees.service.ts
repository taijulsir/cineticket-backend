import { Injectable } from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';

@Injectable()
export class EmployeesService {
  constructor(private readonly repository: EmployeesRepository) {}

  healthCheck() {
    return { module: 'employees', status: 'ok' };
  }
}
