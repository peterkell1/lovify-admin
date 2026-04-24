// Curated emoji catalog for funnel option rows and hero slots.
// Handpicked around the Lovify quiz universe — mood, goals, wellness,
// music, numbers/time. Kept small on purpose so the picker is scannable
// in two clicks; marketers can still paste any other emoji into the
// field by hand.

export type EmojiGroup = {
  name: string
  emojis: { char: string; keywords: string[] }[]
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: 'Faces',
    emojis: [
      { char: '🙂', keywords: ['smile', 'happy', 'neutral'] },
      { char: '😊', keywords: ['smile', 'blush', 'happy'] },
      { char: '😃', keywords: ['smile', 'grin', 'happy'] },
      { char: '😎', keywords: ['cool', 'sunglasses'] },
      { char: '🥹', keywords: ['touched', 'emotion'] },
      { char: '😌', keywords: ['relaxed', 'calm'] },
      { char: '🤔', keywords: ['think', 'wonder', 'curious'] },
      { char: '😔', keywords: ['sad', 'down', 'pensive'] },
      { char: '😤', keywords: ['determined', 'huff'] },
      { char: '🥺', keywords: ['please', 'begging'] },
    ],
  },
  {
    name: 'Mood & Energy',
    emojis: [
      { char: '✨', keywords: ['sparkle', 'magic', 'star'] },
      { char: '🔥', keywords: ['fire', 'hot', 'streak', 'energy'] },
      { char: '💫', keywords: ['dizzy', 'sparkle', 'star'] },
      { char: '⚡', keywords: ['bolt', 'electric', 'energy'] },
      { char: '☀️', keywords: ['sun', 'sunny'] },
      { char: '🌈', keywords: ['rainbow', 'colorful'] },
      { char: '🌟', keywords: ['star', 'glowing'] },
      { char: '💥', keywords: ['boom', 'impact'] },
      { char: '🌿', keywords: ['leaf', 'plant', 'nature'] },
      { char: '🕊', keywords: ['dove', 'peace', 'calm'] },
    ],
  },
  {
    name: 'Love & Confidence',
    emojis: [
      { char: '💖', keywords: ['sparkling', 'heart', 'love'] },
      { char: '❤️', keywords: ['heart', 'love'] },
      { char: '💪', keywords: ['strong', 'flex', 'power'] },
      { char: '🙌', keywords: ['praise', 'celebrate'] },
      { char: '🤝', keywords: ['handshake', 'team'] },
      { char: '💎', keywords: ['gem', 'diamond', 'premium'] },
      { char: '👑', keywords: ['crown', 'royal'] },
      { char: '🌹', keywords: ['rose', 'romance'] },
      { char: '💘', keywords: ['heart', 'arrow', 'love'] },
      { char: '😍', keywords: ['love', 'eyes', 'smitten'] },
    ],
  },
  {
    name: 'Goals & Growth',
    emojis: [
      { char: '🎯', keywords: ['target', 'goal', 'bullseye'] },
      { char: '🚀', keywords: ['rocket', 'launch', 'grow'] },
      { char: '📈', keywords: ['chart', 'growth', 'up'] },
      { char: '💰', keywords: ['money', 'wealth', 'bag'] },
      { char: '🏆', keywords: ['trophy', 'win', 'success'] },
      { char: '🎓', keywords: ['graduation', 'learn'] },
      { char: '🧠', keywords: ['brain', 'mind', 'think'] },
      { char: '🌱', keywords: ['sprout', 'grow', 'new'] },
      { char: '🗝', keywords: ['key', 'unlock'] },
      { char: '💡', keywords: ['idea', 'lightbulb'] },
    ],
  },
  {
    name: 'Music',
    emojis: [
      { char: '🎵', keywords: ['note', 'music'] },
      { char: '🎶', keywords: ['notes', 'music'] },
      { char: '🎤', keywords: ['mic', 'sing', 'pop'] },
      { char: '🎧', keywords: ['headphones', 'listen'] },
      { char: '🎸', keywords: ['guitar', 'rock'] },
      { char: '🎹', keywords: ['piano', 'electronic'] },
      { char: '🎷', keywords: ['saxophone', 'jazz'] },
      { char: '🥁', keywords: ['drum'] },
      { char: '🎻', keywords: ['violin', 'classical'] },
      { char: '🪗', keywords: ['accordion', 'folk'] },
    ],
  },
  {
    name: 'Wellness & Body',
    emojis: [
      { char: '🧘', keywords: ['meditate', 'yoga', 'calm'] },
      { char: '🏃', keywords: ['run', 'exercise'] },
      { char: '🏋️', keywords: ['lift', 'gym', 'strong'] },
      { char: '🚴', keywords: ['cycle', 'bike'] },
      { char: '🥗', keywords: ['salad', 'healthy'] },
      { char: '💧', keywords: ['water', 'drop', 'hydrate'] },
      { char: '😴', keywords: ['sleep', 'rest', 'zzz'] },
      { char: '🧖', keywords: ['spa', 'relax'] },
      { char: '🌙', keywords: ['moon', 'night'] },
      { char: '☕', keywords: ['coffee', 'morning'] },
    ],
  },
  {
    name: 'Numbers & Time',
    emojis: [
      { char: '⏰', keywords: ['alarm', 'time', 'clock'] },
      { char: '⏳', keywords: ['hourglass', 'wait'] },
      { char: '📅', keywords: ['calendar', 'date'] },
      { char: '🗓', keywords: ['calendar', 'schedule'] },
      { char: '1️⃣', keywords: ['one', '1'] },
      { char: '2️⃣', keywords: ['two', '2'] },
      { char: '3️⃣', keywords: ['three', '3'] },
      { char: '✅', keywords: ['check', 'done'] },
      { char: '❌', keywords: ['x', 'no'] },
      { char: '🔄', keywords: ['cycle', 'repeat'] },
    ],
  },
  {
    name: 'Symbols',
    emojis: [
      { char: '🎁', keywords: ['gift', 'present'] },
      { char: '🎉', keywords: ['party', 'celebrate'] },
      { char: '💬', keywords: ['speech', 'chat'] },
      { char: '📱', keywords: ['phone', 'mobile'] },
      { char: '🔔', keywords: ['bell', 'notify'] },
      { char: '📝', keywords: ['note', 'write'] },
      { char: '🔒', keywords: ['lock', 'private'] },
      { char: '⭐', keywords: ['star', 'favorite'] },
      { char: '💯', keywords: ['hundred', 'full'] },
      { char: '🎨', keywords: ['art', 'paint'] },
    ],
  },
]

// Flat list for search.
export const ALL_EMOJIS = EMOJI_GROUPS.flatMap((g) =>
  g.emojis.map((e) => ({ ...e, group: g.name })),
)

export function searchEmojis(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return null // signal "show grouped view"
  return ALL_EMOJIS.filter(
    (e) =>
      e.char.includes(q) ||
      e.keywords.some((k) => k.includes(q)) ||
      e.group.toLowerCase().includes(q),
  )
}
