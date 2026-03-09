export type Pagination = { page: number; limit: number; skip: number };

export function getPagination(page?: number, limit?: number): Pagination {
  const safePage = Math.max(1, page ?? 1);
  const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}
