export const getPaginationParams = (
  query: any
) => {
  const page =
    Math.max(
      1,
      Number(query.page) || 1
    );

  const limit =
    Math.min(
      100,
      Math.max(
        1,
        Number(query.limit) || 20
      )
    );

  const skip =
    (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};


export const buildPaginationMeta = ({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}) => {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / limit
      )
    );

  return {
    page,
    limit,
    total,
    totalPages,

    hasNextPage:
      page < totalPages,

    hasPrevPage:
      page > 1,
  };
};