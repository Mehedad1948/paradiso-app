import { describe, expect, it } from "vitest";
import {
  customMovieErrorsFrom,
  parseCustomMovie,
} from "@/lib/movies/custom-movie";

describe("custom movie validation", () => {
  it("accepts a title and year and drops blank optional fields", () => {
    expect(
      parseCustomMovie({ title: " Home Movie ", year: 2019, imdbLink: " ", overview: "" }),
    ).toEqual({ body: { title: "Home Movie", year: 2019 }, errors: null });
  });
  it("keeps a bare IMDb ID for the backend to normalise", () => {
    expect(
      parseCustomMovie({ title: "Matrix", year: 1999, imdbLink: "tt0133093" }).body,
    ).toMatchObject({ imdbLink: "tt0133093" });
  });
  it("reports every invalid field at once", () => {
    expect(parseCustomMovie({ title: "", year: 1999.5 }).errors).toEqual({
      title: expect.any(String),
      year: expect.any(String),
    });
    expect(parseCustomMovie({ title: "x" }).errors).toHaveProperty("year");
    expect(parseCustomMovie({ title: "x", year: 2101 }).errors).toHaveProperty("year");
    expect(
      parseCustomMovie({ title: "x".repeat(256), year: 2000 }).errors,
    ).toHaveProperty("title");
  });
  it("maps only messages that name a known field", () => {
    expect(
      customMovieErrorsFrom([
        "year must not be less than 1870",
        "property dbId should not exist",
      ]),
    ).toEqual({ year: "Must not be less than 1870" });
    expect(customMovieErrorsFrom(["property dbId should not exist"])).toBeUndefined();
  });
});
