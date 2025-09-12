import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type MovieWithRatings = {
  id: string;
  title: string;
  release_date: string;
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



export type UserType = {
  id: number;
  username: string;
  avatar: string | null;
};

// Usage:
