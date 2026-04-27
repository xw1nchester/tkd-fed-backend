export class PaginationDto<T> {
    public readonly totalPages: number;
    public readonly isLast: boolean;

    constructor(
        public readonly data: T[],
        public readonly total: number,
        public readonly page: number,
        limit: number
    ) {
        this.totalPages = Math.ceil(total / limit);
        this.isLast = page >= this.totalPages;
    }
}
