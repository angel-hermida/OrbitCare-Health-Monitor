// Memory bank: messages from home for each crew member (Isolation, I in RIDGE).
// DEMO CONTENT. Names and notes are invented. Photos live in public/memory/.
//
// Each message:
//   id          unique id
//   astronautId preset crew member (data/crew.js: a1 Maya, a2 Daniel, a3 Aiko, a4 Sam)
//   from        who sent it
//   type        'text' | 'photo' | 'audio' | 'video'
//   text        the note (always present, also for media messages)
//   mediaUrl    file for photo / audio / video, or null for text. Relative to the site root
//               (no leading slash) so it also works when the app is hosted in a subfolder.
//   dropDay     mission day the message arrived. A dropDay after the current mission day (120 in
//               the demo) would stay hidden until Presenter > Next day reaches it.

const photo = (file) => `memory/${file}`

export const MEMORY_BANK = [
  // ---------- Maya Okafor (a1) ----------
  {
    id: 'mb-a1-2',
    astronautId: 'a1',
    from: 'Ada & Zoe (your daughters)',
    type: 'photo',
    text: 'We built a blanket fort and named it Station Mom. Ada says the floor plan meets all your safety rules.',
    mediaUrl: photo('pexels-children-1869265_1920.jpg'),
    dropDay: 112,
  },
  {
    id: 'mb-a1-3',
    astronautId: 'a1',
    from: 'Home – picnic day',
    type: 'photo',
    text: 'Picnic by the lake on Sunday. We saved your spot on the blanket and crossed another day off the calendar.',
    mediaUrl: photo('2147792-mama-5098862_1920.jpg'),
    dropDay: 120,
  },

  // ---------- Daniel Reyes (a2) ----------
  {
    id: 'mb-a2-1',
    astronautId: 'a2',
    from: 'Your sisters',
    type: 'photo',
    text: 'All three of us watched the station pass over last night. We waved. Lucía insists you waved back.',
    mediaUrl: photo('trevoykellyphotography-friendship-day-3104635_1920.jpg'),
    dropDay: 108,
  },
  {
    id: 'mb-a2-2',
    astronautId: 'a2',
    from: 'Dad – your nephew’s first week',
    type: 'photo',
    text: 'Meet Leo. He already has your stubborn chin. Your sister says he is waiting for his first story from space.',
    mediaUrl: photo('skalekar1992-christmas-wallpaper-3120717_1920.jpg'),
    dropDay: 116,
  },

  // ---------- Aiko Tanaka (a3) ----------
  {
    id: 'mb-a3-2',
    astronautId: 'a3',
    from: 'Your sisters',
    type: 'photo',
    text: 'Movie night is on hold until you are back. Your seat and your blanket are reserved.',
    mediaUrl: photo('trevoykellyphotography-friendship-day-3104635_1920.jpg'),
    dropDay: 110,
  },
  {
    id: 'mb-a3-3',
    astronautId: 'a3',
    from: 'The whole family',
    type: 'photo',
    text: 'Baby Hana smiles at everyone now. We showed her your mission patch and she tried to eat it.',
    mediaUrl: photo('family-of-three-871290963799xUk-3051839769.jpg'),
    dropDay: 119,
  },

  // ---------- Sam Whitfield (a4) ----------
  {
    id: 'mb-a4-2',
    astronautId: 'a4',
    from: 'Home – picnic day',
    type: 'photo',
    text: 'First picnic of the season. Lily ran the whole trail and slept the whole way home.',
    mediaUrl: photo('2147792-mama-5098862_1920.jpg'),
    dropDay: 114,
  },
  {
    id: 'mb-a4-3',
    astronautId: 'a4',
    from: 'The whole family',
    type: 'photo',
    text: 'Sunday dinner, everyone together. We set a place for you at the end of the table.',
    mediaUrl: photo('family-of-three-871290963799xUk-3051839769.jpg'),
    dropDay: 120,
  },
]
