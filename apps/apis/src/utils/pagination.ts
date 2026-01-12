export function getPagination(query: {
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 10);
  const offset = (page - 1) * limit;

  return { limit, offset, page };
}
