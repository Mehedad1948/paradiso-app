export type MovieWithRatings = {
  id: string;
  dbId: number;
  title: string;
  poster_path: string;
  vote_average: number | null;
  releaseDate: string;
  original_title: string;
  video: string;
  release_date: string;
  imdbRate: string | null;
  imdbLink: string | null; // ISO date string
  ratings: {
    rate: number;
    user: {
      id: number;
      username: string;
      avatar: string | null;
    };
  }[];
};
