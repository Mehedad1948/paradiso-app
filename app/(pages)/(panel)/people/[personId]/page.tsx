import { Suspense } from "react";
import { connection } from "next/server";
import PersonPage from "@/features/people/PersonPage";

/** Renders nothing; tells Next the request-time metadata in the layout is intentional. */
async function RequestTime() {
  await connection();
  return null;
}

export default function Page() {
  return (
    <>
      <PersonPage />
      <Suspense>
        <RequestTime />
      </Suspense>
    </>
  );
}
