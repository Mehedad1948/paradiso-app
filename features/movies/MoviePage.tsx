"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import MovieDetailsView, { HeroButton } from "./MovieDetailsView";

/** A film on its own page: where shared links and refreshes land. */
export default function MoviePage() {
  const { movieId } = useParams<{ movieId: string }>();
  const router = useRouter();
  // Someone arriving from a shared link has nothing to go back to inside the app.
  const back = () => (window.history.length > 1 ? router.back() : router.push("/community"));
  return (
    <div className="mx-auto max-w-[1080px] overflow-hidden rounded-[28px] border border-line bg-elevated text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0_/_35%)] max-sm:-mx-[5vw] max-sm:rounded-none max-sm:border-x-0">
      <MovieDetailsView
        movieId={movieId}
        variant="page"
        start={
          <HeroButton label="Back" onPress={back}>
            <ArrowLeft size={19} aria-hidden="true" />
          </HeroButton>
        }
      />
    </div>
  );
}
