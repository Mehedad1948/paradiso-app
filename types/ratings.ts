export type MovieWithRatings = {
  id: string;
  dbId: number;
  title: string;
  poster_path: string;
  vote_average: number | null;
  release_date: string;
  original_title: string;
  hasVoted: boolean;
  video: string;
  imdbRate: string | null;
  imdbLink: string | null; // ISO date string
  ratings: {
    rate: number | null;
    user: {
      id: number;
      username: string;
      avatar: string | null;
    };
  }[];
};

export type VoteType = {
  rate: number;
  movieId: string;
};
