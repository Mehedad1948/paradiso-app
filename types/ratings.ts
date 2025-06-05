export type MovieWithRatings = {
  id: string;
  title: string;
  releaseDate: string; // ISO date string
  imdbRate: number;
  image: string;
  isWatchedTogether: boolean;
  isIn: boolean;
  addedBy: {
    id: number;
  };
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  ratings: {
    rate: number;
    user: {
      id: number;
      username: string;
      avatar: string | null;
    };
  }[];
};
