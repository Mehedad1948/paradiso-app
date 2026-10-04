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

const gridPoster = (title: string, file: string, position = "center") => ({
  title,
  image: `/posters/grids/${file}`,
  position,
});

export const gridPosters = {
  divingBell: gridPoster("The Diving Bell and the Butterfly", "green/diving-bell.jfif", "center 40%"),
  matrix: gridPoster("The Matrix", "green/matrix.jfif", "center 35%"),
  stalker: gridPoster("Stalker", "green/stalker.jfif"),
  ilPostino: gridPoster("Il Postino", "blue/il-postino.jfif"),
  johnWick: gridPoster("John Wick", "blue/jhon-weak.jfif", "center 30%"),
  oceanHeaven: gridPoster("Ocean Heaven", "blue/ocean-heaven.jfif"),
  cinemaParadiso: gridPoster("Cinema Paradiso", "blue/paradiso.jfif"),
  parisTexas: gridPoster("Paris, Texas", "blue/paris-texas.jfif", "center 35%"),
  treeOfLife: gridPoster("The Tree of Life", "blue/tree-of-life.jpg"),
  trumanShow: gridPoster("The Truman Show", "blue/trueman-show.jpg", "center 35%"),
  walterMitty: gridPoster("The Secret Life of Walter Mitty", "blue/walter-mitty.jpg"),
  wingsOfDesire: gridPoster("Wings of Desire", "blue/wings-of-desire.jfif"),
  laLaLand: gridPoster("La La Land", "purple/lalaland.jpg"),
  rearWindow: gridPoster("Rear Window", "purple/rear-window.jfif"),
  amelie: gridPoster("Amélie", "red/ameli.jfif"),
  colorsRed: gridPoster("Three Colors: Red", "red/color-red.jfif", "center 35%"),
  dune: gridPoster("Dune: Part Two", "red/dune.webp"),
  goodTime: gridPoster("Good Time", "red/good-times.jfif"),
  her: gridPoster("Her", "her.jpg", "center 30%"),
  livesOfOthers: gridPoster("The Lives of Others", "red/life-of-others.jpg"),
  memento: gridPoster("Memento", "red/meemnto.jpg", "center 35%"),
  stalag17: gridPoster("Stalag 17", "red/stalag-17.jfif"),
  vertigo: gridPoster("Vertigo", "red/vertigo.jfif"),
  twelveAngryMen: gridPoster("12 Angry Men", "yellow/12-angry-man.jfif"),
  fantasticMrFox: gridPoster("Fantastic Mr. Fox", "yellow/fantastic-fox.jfif"),
  killBill: gridPoster("Kill Bill", "yellow/kill-bill.jfif"),
  taxiDriver: gridPoster("Taxi Driver", "yellow/taxi-driver.jfif"),
};
