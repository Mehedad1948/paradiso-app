import { Suspense } from "react";
import { connection } from "next/server";
import MoviePage from "@/features/movies/MoviePage";

/** Renders nothing; tells Next the request-time metadata in the layout is intentional. */
async function RequestTime() {
  await connection();
  return null;
}

export default function Page() {
  return (
    <>
      <MoviePage />
      <Suspense>
        <RequestTime />
      </Suspense>
    </>
  );
}
