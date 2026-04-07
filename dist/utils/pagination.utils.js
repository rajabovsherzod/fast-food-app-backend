export const getPaginationParams = (page, limit) => {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    return {
        page: pageNum > 0 ? pageNum : 1,
        limit: limitNum > 0 && limitNum <= 100 ? limitNum : 10,
    };
};
export const getOffset = (page, limit) => {
    return (page - 1) * limit;
};
