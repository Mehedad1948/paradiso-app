export type RequestResult<T> = {
  result: T | null;
  response: {
    ok: boolean;
    status: number;
    statusText: string;
    message?: string;
  };
  error?: string;
};

export type PaginationMeta = {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

export type PaginationLinks = {
  first: string;
  current: string;
  next: string;
  previous: string;
  last: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
};
