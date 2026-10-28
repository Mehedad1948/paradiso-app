// Keep the original poster files supplied in public/posters.
export const posters = {
  vertigo: "/posters/Vertigomovie_restoration-991x1536.jpeg.webp",
  arrival: "/posters/b608fb00a68eb35033f2feef435efcb0.jpg",
  fellowship: "/posters/movie-posters-phantom-city-creative-14.webp",
  dune: "/posters/vzo4SpJYAVBaimKgsRw7vA-1200-80.jpg.webp",
  livesOfOthers:
    "/posters/MV5BZTBlZmU5YTctY2QyZC00ODc4LThhNDYtYjU4ODg3MDE2NWMxXkEyXkFqcGc@._V1_FMjpg_UX500_.jpg",
};

// Public-domain poster editions; see public/posters/classics/SOURCES.md.
export const landingPosters = [
  { title: "Metropolis", image: "/posters/classics/metropolis.webp", position: "center 40%" },
  { title: "The General", image: "/posters/classics/the-general.webp", position: "center 35%" },
  { title: "His Girl Friday", image: "/posters/classics/his-girl-friday.webp", position: "center 35%" },
  { title: "Charade", image: "/posters/classics/charade.webp", position: "center 40%" },
  { title: "Night of the Living Dead", image: "/posters/classics/night-of-the-living-dead.webp", position: "center 50%" },
];

// tmdbId ties each frame to its film, so a click can open the details.
const gridPoster = (title: string, tmdbId: number, file: string, position = "center") => ({
  title,
  tmdbId,
  image: `/posters/grids/${file}`,
  position,
});

export const gridPosters = {
  divingBell: gridPoster("The Diving Bell and the Butterfly", 2013, "green/diving-bell.jpg", "center 40%"),
  matrix: gridPoster("The Matrix", 603, "green/matrix.jpg", "center 35%"),
  stalker: gridPoster("Stalker", 1398, "green/stalker.jpg"),
  ilPostino: gridPoster("Il Postino", 11010, "blue/il-postino.jpg"),
  johnWick: gridPoster("John Wick", 245891, "blue/jhon-weak.jpg", "center 30%"),
  oceanHeaven: gridPoster("Ocean Heaven", 54328, "blue/ocean-heaven.jpg"),
  cinemaParadiso: gridPoster("Cinema Paradiso", 11216, "blue/paradiso.jpg"),
  parisTexas: gridPoster("Paris, Texas", 655, "blue/paris-texas.jpg", "center 35%"),
  treeOfLife: gridPoster("The Tree of Life", 8967, "blue/tree-of-life.jpg"),
  trumanShow: gridPoster("The Truman Show", 37165, "blue/trueman-show.jpg", "center 35%"),
  walterMitty: gridPoster("The Secret Life of Walter Mitty", 116745, "blue/walter-mitty.jpg"),
  wingsOfDesire: gridPoster("Wings of Desire", 144, "blue/wings-of-desire.jpg"),
  laLaLand: gridPoster("La La Land", 313369, "purple/lalaland.jpg"),
  rearWindow: gridPoster("Rear Window", 567, "purple/rear-window.jpg"),
  amelie: gridPoster("Amélie", 194, "red/ameli.jpg"),
  colorsRed: gridPoster("Three Colors: Red", 110, "red/color-red.jpg", "center 35%"),
  dune: gridPoster("Dune: Part Two", 693134, "red/dune.webp"),
  goodTime: gridPoster("Good Time", 429200, "red/good-times.jpg"),
  her: gridPoster("Her", 152601, "her.jpg", "center 30%"),
  livesOfOthers: gridPoster("The Lives of Others", 582, "red/life-of-others.jpg"),
  memento: gridPoster("Memento", 77, "red/meemnto.jpg", "center 35%"),
  stalag17: gridPoster("Stalag 17", 632, "red/stalag-17.jpg"),
  vertigo: gridPoster("Vertigo", 426, "red/vertigo.jpg"),
  twelveAngryMen: gridPoster("12 Angry Men", 389, "yellow/12-angry-man.jpg"),
  fantasticMrFox: gridPoster("Fantastic Mr. Fox", 10315, "yellow/fantastic-fox.jpg"),
  killBill: gridPoster("Kill Bill", 24, "yellow/kill-bill.jpg"),
  taxiDriver: gridPoster("Taxi Driver", 103, "yellow/taxi-driver.jpg"),
};
