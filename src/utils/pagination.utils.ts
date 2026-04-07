export interface PaginationParams {
  page: number;
  limit: number;
}

export const getPaginationParams = (
  page?: string | number | any,
  limit?: string | number | any
): PaginationParams => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  return {
    page: pageNum > 0 ? pageNum : 1,
    limit: limitNum > 0 && limitNum <= 100 ? limitNum : 10,
  };
};

export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};
