// Track list. `id` matches the file stem in assets/audio and the key in
// data/features.json, so keep them in sync if you add songs.

const ARTIST = 'Ishaan Kaushik';

function track(id, title, original, genre, mood, duration, coverExt = 'png') {
  return {
    id,
    title,
    original,
    artist: ARTIST,
    genre,
    mood,
    duration,
    src: `assets/audio/${id}.mp3`,
    cover: `assets/covers/${id}.${coverExt}`,
    banner: `assets/banners/${id}.png`,
  };
}

export const TRACKS = [
  track('01', 'I Took a Pill in Ibiza', 'Mike Posner', 'Pop', 'Chill', 227),
  track('02', 'Ghar', 'Jasleen Royal', 'Bollywood', 'Nostalgic', 227),
  track('03', 'Kahin To Hogi Woh', 'Rashid Ali', 'Bollywood', 'Romantic', 221),
  track('04', 'Kasoor', 'Prateek Kuhad', 'Indie', 'Melancholic', 164, 'jpg'),
  track('05', 'Tu Hai Kahan', null, 'Indie', 'Longing', 180),
  track('06', 'Baarishein', 'Anuv Jain', 'Indie', 'Rainy', 195),
  track('07', 'Waqt Ki Baatein', 'Dream Note', 'Indie', 'Reflective', 178),
  track('08', 'Lovely (ft. Anika Vidyarthi)', 'Billie Eilish & Khalid', 'Pop', 'Soft', 173),
  track('09', 'Let Me Down Slowly', 'Alec Benjamin', 'Pop', 'Gentle', 175),
  track('10', 'Jee Le Zara', 'Vishal Dadlani', 'Bollywood', 'Uplifting', 176),
];

export const byId = new Map(TRACKS.map(t => [t.id, t]));

export function subtitle(t) {
  return t.original ? `${t.artist} · cover of ${t.original}` : `${t.artist} · original`;
}
