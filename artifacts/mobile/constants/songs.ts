export interface SongMeta {
  id: string;
  titleRussian: string;
  titleEnglish: string;
  artist: string;
  albumArt: any;
  dataFile: any;
  audioFile: any;
}

export const SONGS: SongMeta[] = [
  {
    id: "ya_svoboden",
    titleRussian: "Я Свободен",
    titleEnglish: "I Am Free",
    artist: "Кипелов",
    albumArt: require("@/assets/images/albums/ya_svoboden.jpg"),
    dataFile: require("@/assets/data/ya_svoboden.json"),
    audioFile: require("@/assets/songs/ya_svoboden.mp3"),
  },
];
