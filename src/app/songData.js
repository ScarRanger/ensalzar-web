const SONG_DATA_URL = 'https://cgs-songs-config.s3.ap-south-1.amazonaws.com/songsData.json';

export async function fetchSongData() {
  const res = await fetch(SONG_DATA_URL);
  if (!res.ok) throw new Error('Failed to fetch song data');
  return res.json();
}

export const songs = [
  {
    title: "Vasundharega",
    category: "Entrance",
    fileName: "vasundharega.html",
  },
  {
    title: "Mala Gau De",
    category: "Praise",
    fileName: "mala-gau-de.html",
   },
];
