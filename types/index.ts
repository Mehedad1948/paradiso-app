import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type MovieWithRatings = {
  id: string;
  title: string;
  releaseDate: string;
  imdbRate: number;
  image: string;
  isWatchedTogether: boolean;
  isIn: boolean;
  addedBy: {
    id: number;
  };
  createdAt: string;
  updatedAt: string;
  ratings: {
    rate: number;
    user: {
      id: number;
      username: string;
      avatar: string | null;
    };
  }[];
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

export type UserType = {
  id: string;
  username: string;
  avatar: string | null;
};

// Usage:
