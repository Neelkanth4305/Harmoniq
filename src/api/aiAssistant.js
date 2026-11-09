import { searchYouTubeMusic } from './youtube';

/**
 * Intelligent Music Knowledge Base for instant high-quality local responses
 */
const ARTIST_DATABASE = {
  arijit: {
    name: 'Arijit Singh',
    bio: 'Arijit Singh is widely acclaimed as one of the most versatile and celebrated playback singers in contemporary Indian music. Known for his soulful, emotive voice, he rose to fame after the blockbuster track "Tum Hi Ho" from Aashiqui 2 (2013). His vocal style blends classical Indian foundations with modern pop ballads.',
    topHits: ['Tum Hi Ho', 'Kesariya', 'Channa Mereya', 'Apna Bana Le', 'Raabta'],
    genre: 'Bollywood Romantic, Acoustic, Classical Pop',
  },
  ed_sheeran: {
    name: 'Ed Sheeran',
    bio: 'Ed Sheeran is an English singer-songwriter known for his acoustic-driven storytelling, loop-pedal performances, and record-breaking pop anthems. His chart-topping albums include "+", "x", "÷", and "=", with hits spanning folk pop to dance collaborations.',
    topHits: ['Shape of You', 'Perfect', 'Thinking Out Loud', 'Bad Habits', 'Photograph'],
    genre: 'Pop, Folk Pop, Acoustic',
  },
  taylor_swift: {
    name: 'Taylor Swift',
    bio: 'Taylor Swift is a 14-time Grammy-winning artist celebrated for her autobiographical songwriting and genre transitions from country to synth-pop (1989), alternative folk (Folklore/Evermore), and pop-rock.',
    topHits: ['Cruel Summer', 'Blank Space', 'Anti-Hero', 'Love Story', 'Cardigan'],
    genre: 'Pop, Country, Folk-Pop',
  },
  coldplay: {
    name: 'Coldplay',
    bio: 'Coldplay, fronted by Chris Martin, is a British rock band formed in London in 1997. Renowned for soaring anthems, emotive piano melodies, and stadium spectacles, they have achieved universal acclaim spanning albums like Parachutes, A Rush of Blood to the Head, and Viva La Vida.',
    topHits: ['Yellow', 'Fix You', 'Viva La Vida', 'The Scientist', 'Something Just Like This'],
    genre: 'Alternative Rock, Post-Britpop, Pop Rock',
  },
  the_weeknd: {
    name: 'The Weeknd',
    bio: 'Abel Tesfaye, known as The Weeknd, is a Canadian singer-songwriter known for his dark R&B, synthwave-pop, and falsetto vocals. His record-breaking hit "Blinding Lights" became the #1 Billboard Hot 100 song of all time.',
    topHits: ['Blinding Lights', 'Starboy', 'Save Your Tears', 'The Hills', 'Can\'t Feel My Face'],
    genre: 'R&B, Synthwave, Electropop',
  },
};

/**
 * Clean and extract search queries from AI recommendations
 */
function extractSongRecommendationsFromText(text) {
  const songs = [];
  // Match patterns like "1. Title - Artist" or '"Title" by Artist' or '- Title by Artist'
  const lines = text.split('\n');
  for (const line of lines) {
    const matchQuote = line.match(/["“](.+?)["”]\s+(?:by|-)\s+([A-Za-z0-9\s&]+)/i);
    if (matchQuote) {
      songs.push(`${matchQuote[1]} ${matchQuote[2]}`.trim());
      continue;
    }

    const matchNumbered = line.match(/^\d+[\.\)]\s+["']?([^-"'\n]+)["']?\s*(?:-|by)\s*["']?([^-\n]+)["']?/i);
    if (matchNumbered) {
      songs.push(`${matchNumbered[1]} ${matchNumbered[2]}`.trim());
      continue;
    }
  }
  return songs.slice(0, 5);
}

/**
 * Call Google Gemini API if key is present
 */
async function queryGeminiApi(prompt, context) {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_KEY' || apiKey.length < 10) {
    return null;
  }

  const systemInstruction = `You are Harmoniq AI DJ, a friendly, knowledgeable, and passionate music assistant inside a modern music streaming app.
Context about current playback:
- Current Track: ${context.currentTrack?.title || 'None'}
- Artist/Channel: ${context.currentTrack?.channel || 'None'}
- Is Playing: ${context.isPlaying ? 'Yes' : 'No'}

Guidelines:
1. Provide thoughtful, informative, and engaging answers. Explain musical nuances, vibes, lyrics meanings, or artist backgrounds when asked.
2. If recommending songs, always mention 3-5 specific track titles with their artists in the format: "Song Title" by Artist.
3. Keep the tone warm, concise, and passionate about music.`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (answer && answer.trim()) {
        return answer.trim();
      }
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to local intelligence engine:', err);
  }

  return null;
}

/**
 * Built-in Intelligent Music Assistant Engine (Works offline or without API key)
 */
function generateLocalMusicResponse(userPrompt, context) {
  const q = (userPrompt || '').toLowerCase().trim();
  const currentTitle = context.currentTrack?.title || '';
  const currentArtist = context.currentTrack?.channel || '';

  // 1. Current track inquiry
  if (
    q.includes('what song') ||
    q.includes('current song') ||
    q.includes('who is singing') ||
    q.includes('playing right now') ||
    q.includes('about this song') ||
    q.includes('tell me about this track')
  ) {
    if (!currentTitle) {
      return {
        answer:
          "There is no track currently playing in Harmoniq. Select any track from Discover or Search, and I'll tell you all about its history, artist, and musical nuances!",
        recommendedQueries: ['Top Global Hits 2026', 'Acoustic Chill Hits'],
      };
    }

    return {
      answer: `You're currently enjoying "${currentTitle}" by ${currentArtist}.\n\nThis track captures great emotional energy with distinctive production and memorable rhythm. If you enjoy this vibe, I've curated a soundscape of closely matching songs with similar harmony, tempo, and vocal delivery below!`,
      recommendedQueries: [
        `${currentArtist} top hit songs`,
        `${currentTitle} acoustic cover`,
        `Songs like ${currentTitle}`,
      ],
    };
  }

  // 2. Lyrics explanation or meaning inquiry
  if (q.includes('lyric') || q.includes('meaning') || q.includes('story behind') || q.includes('explain')) {
    if (currentTitle) {
      return {
        answer: `"${currentTitle}" delves into deep themes of emotional vulnerability, connection, and atmosphere. The song balances introspective verses with a resonant hook designed to connect directly with the listener's mood.\n\nMusic theorists often highlight how its chord progressions build dynamic tension before settling into a satisfying melodic resolution. Check out these emotionally resonant companion tracks below!`,
        recommendedQueries: [
          `${currentTitle} live performance`,
          `Best acoustic songs like ${currentTitle}`,
        ],
      };
    }
    return {
      answer:
        "Song lyrics often convey layered stories—drawing from personal growth, romance, longing, or social commentary. Play any track and tap 'Lyrics' on the Now Playing screen to read synchronized lyrics in real time!",
      recommendedQueries: ['Top English acoustic hits', 'Soulful acoustic guitar ballads'],
    };
  }

  // 3. Known artist query
  for (const [key, artist] of Object.entries(ARTIST_DATABASE)) {
    if (q.includes(artist.name.toLowerCase()) || q.includes(key)) {
      return {
        answer: `${artist.name} is a standout in ${artist.genre}.\n\n${artist.bio}\n\nTop Recommended Anthems:\n` +
          artist.topHits.map((h, i) => `${i + 1}. "${h}" by ${artist.name}`).join('\n') +
          `\n\nI've loaded their greatest tracks below for you to stream instantly!`,
        recommendedQueries: artist.topHits.slice(0, 3).map((h) => `${h} ${artist.name}`),
      };
    }
  }

  // 4. Workout / High Energy
  if (q.includes('workout') || q.includes('gym') || q.includes('energy') || q.includes('cardio') || q.includes('pump') || q.includes('running')) {
    return {
      answer:
        "Time to elevate the heart rate! For workouts and cardio, the sweet spot is 125–140 BPM with heavy basslines and driving percussion to keep your adrenaline peaked.\n\nRecommended for your session:\n1. \"Stronger\" by Kanye West\n2. \"Till I Collapse\" by Eminem\n3. \"Can't Hold Us\" by Macklemore\n4. \"Levitating\" by Dua Lipa\n\nReady? Hit play below and push your limits!",
      recommendedQueries: [
        'Gym motivation workout hits',
        'High energy edm running mix',
        'Stronger Kanye West',
      ],
    };
  }

  // 5. Chill / Sleep / Study / Relax
  if (q.includes('chill') || q.includes('study') || q.includes('relax') || q.includes('sleep') || q.includes('focus') || q.includes('calm') || q.includes('rain')) {
    return {
      answer:
        "Slowing down the tempo. Gentle ambient textures, warm vinyl crackle, and acoustic frequencies help lower cortisol and promote deep alpha-wave concentration.\n\nCurated relaxing picks:\n1. \"Weightless\" by Marconi Union\n2. \"Coffee Breath\" by Sofia Mills\n3. \"Sunset Lover\" by Petit Biscuit\n4. \"Get You The Moon\" by Kina\n\nSit back, breathe, and let these soothing frequencies wash over you.",
      recommendedQueries: [
        'Acoustic chill melodies relax',
        'Deep focus ambient instrumental',
        'Peaceful piano sleep music',
      ],
    };
  }

  // 6. Bollywood / Hindi Music
  if (q.includes('bollywood') || q.includes('hindi') || q.includes('romantic') || q.includes('desi') || q.includes('punjabi')) {
    return {
      answer:
        "Bollywood melodies carry some of the richest orchestrations and emotional poetry in modern music—from classic ghazals to lush acoustic duets.\n\nHere are standout favorites:\n1. \"Kesariya\" by Arijit Singh\n2. \"Raataan Lambiyan\" by Jubin Nautiyal & Asees Kaur\n3. \"Apna Bana Le\" by Arijit Singh\n4. \"Tum Se Hi\" by Mohit Chauhan\n\nEnjoy these timeless Indian melodies below!",
      recommendedQueries: [
        'Bollywood romantic hits 2026',
        'Kesariya Brahmastra Arijit Singh',
        'Soulful Hindi acoustic songs',
      ],
    };
  }

  // 7. General music recommendation or discovery
  return {
    answer: `Here are some hand-curated tracks dialed into "${userPrompt}". I've searched live audio for the best matches with optimal fidelity and melodic flow.\n\nTap any song below to start playing, or ask me anything about the artists, chords, or lyrical backstory!`,
    recommendedQueries: [
      `${userPrompt} music hits`,
      `${userPrompt} acoustic`,
      userPrompt,
    ],
  };
}

/**
 * Main AI Assistant Question-Answering Method
 * Returns: { answer: string, tracks: Array<Track> }
 */
export async function askAIAssistant(prompt, context = {}) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) {
    return {
      answer: 'Ask me anything! I can recommend songs for any mood, explain lyrics, share artist backstories, or curate a custom mix.',
      tracks: [],
    };
  }

  // 1. Try Gemini API first if configured
  const geminiAnswer = await queryGeminiApi(cleanPrompt, context);

  let finalAnswer = geminiAnswer;
  let queriesToSearch = [];

  if (geminiAnswer) {
    // Extract song titles from Gemini's response
    queriesToSearch = extractSongRecommendationsFromText(geminiAnswer);
    if (queriesToSearch.length === 0) {
      queriesToSearch = [`${cleanPrompt} music`];
    }
  } else {
    // 2. Use local intelligent engine
    const localResult = generateLocalMusicResponse(cleanPrompt, context);
    finalAnswer = localResult.answer;
    queriesToSearch = localResult.recommendedQueries;
  }

  // 3. Search and attach playable tracks
  let suggestedTracks = [];
  try {
    const searchTasks = queriesToSearch.slice(0, 2).map((q) => searchYouTubeMusic(q));
    const results = await Promise.all(searchTasks);

    const trackMap = new Map();
    for (const res of results) {
      if (res && res.tracks) {
        for (const t of res.tracks) {
          if (!trackMap.has(t.id)) {
            trackMap.set(t.id, t);
          }
        }
      }
    }
    suggestedTracks = Array.from(trackMap.values()).slice(0, 8);
  } catch (e) {
    console.warn('Error fetching audio tracks for AI recommendations:', e);
  }

  return {
    answer: finalAnswer,
    tracks: suggestedTracks,
  };
}
