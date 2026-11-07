// Printed-card wording per tradition (English for now). Add a tradition by adding an entry to each table.
export const TRADITIONS = ["muslim", "hindu", "sikh", "christian", "neutral"];

export const HEADERS = {
  muslim: [
    { id: "bismillah", text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", sub: "Bismillah ir-Rahman ir-Raheem", script: "arabic" },
    { id: "786", text: "786", script: "latin" },
  ],
  hindu: [
    { id: "ganesh", text: "॥ श्री गणेशाय नमः ॥", sub: "Shri Ganeshaya Namah", script: "deva" },
    { id: "om", text: "ॐ", script: "deva" },
    { id: "radhakrishna", text: "॥ श्री राधा कृष्णाय नमः ॥", sub: "Shri Radha Krishnaya Namah", script: "deva" },
    { id: "jaishriram", text: "॥ जय श्री राम ॥", sub: "Jai Shri Ram", script: "deva" },
  ],
  sikh: [{ id: "ikonkar", text: "ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ", sub: "Ik Onkar, Satgur Prasad", script: "guru" }],
  christian: [
    { id: "cor13", text: "Love is patient, love is kind", sub: "1 Corinthians 13:4", script: "latin" },
    { id: "mark10", text: "What God has joined together, let no one separate", sub: "Mark 10:9", script: "latin" },
  ],
  neutral: [{ id: "together", text: "Together with their families", text_hi: "परिवारों के आशीर्वाद के साथ", text_ur: "اپنے خاندانوں کی دعاؤں کے ساتھ", script: "latin" }],
};

export const SCRIPT_FONTS = {
  arabic: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap",
  deva: "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi&display=swap",
  guru: "https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;600&display=swap",
};

export const WEDDING_EVENTS = {
  muslim: { suggest: ["Mehndi", "Haldi / Ubtan", "Baraat", "Nikah", "Rukhsati", "Walima", "Dawat-e-Walima"], defaults: ["Mehndi", "Nikah", "Walima"] },
  hindu: { suggest: ["Roka", "Haldi", "Mehndi", "Sangeet", "Tilak", "Baraat", "Pheras / Vivah", "Reception"], defaults: ["Haldi", "Mehndi", "Sangeet", "Pheras / Vivah", "Reception"] },
  sikh: { suggest: ["Jaago", "Anand Karaj", "Reception"], defaults: ["Jaago", "Anand Karaj", "Reception"] },
  christian: { suggest: ["Church Wedding", "Reception"], defaults: ["Church Wedding", "Reception"] },
};

const DUA = { text: "بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ", sub: "Barakallahu lakuma wa baraka alaykuma wa jama'a baynakuma fi khayr" };

const WORDING = {
  muslim: (ev) => `With the blessings of Almighty Allah, we cordially invite you and your family to join us in the joyous occasion of ${ev}.`,
  hindu: (ev) => `With the blessings of Lord Ganesha and our elders, we invite you to bless the couple at the ${ev}.`,
  sikh: (ev) => `With the grace of Waheguru and the blessings of our elders, we warmly invite you and your family to join us for the ${ev}.`,
  christian: (ev) => `Together with their families, by the grace of God, we joyfully invite you to celebrate the ${ev} with us.`,
  neutral: (ev) => `We would love you to join us for the ${ev}.`,
};
const SPECIAL = {
  sikh: [/anand\s*karaj/i, "With the grace of Waheguru, we humbly invite you to the Gurdwara Sahib to witness and bless the Anand Karaj of our children, followed by langar."],
  christian: [/church|holy\s*matrimony/i, "Together with their families, by the grace of God, we request the honour of your presence at the Holy Matrimony of our children."],
};

export const CLOSINGS = ["Your presence will make this occasion memorable", "Kind regards", "Awaiting your gracious presence"];
const DEFAULT_CLOSING = { muslim: 2, hindu: 0, sikh: 0, christian: 2, neutral: 0 };

const CONCLUDED = {
  muslim: "Alhamdulillah, it was a blessed gathering. JazakAllah khair for your love and duas.",
  hindu: "With everyone's blessings, the occasion was celebrated with joy. Thank you for being a part of it.",
  sikh: "By Waheguru's grace, the occasion was celebrated with joy. Thank you for your blessings.",
  christian: "Thanks be to God for a beautiful celebration, and thank you for sharing it with us.",
  neutral: "Thank you for celebrating with us. It was a day to remember.",
};

const trad = (card) => (TRADITIONS.includes(card.tradition) ? card.tradition : "neutral");
const pick = (custom, fallback) => (custom === null || custom === undefined ? fallback : custom);

export const headerOptions = (card) => HEADERS[trad(card)];
const ALL_HEADERS = Object.values(HEADERS).flat();
const resolveKey = (card, key) => {
  if (key === "none") return null;
  const h = ALL_HEADERS.find((x) => x.id === key) || headerOptions(card)[0];
  const local = h[`text_${card.language}`];
  return local ? { ...h, text: local } : h;
};
const customOf = (c) => (c?.text?.trim() ? { id: "custom", ...c, text: c.text.trim(), custom: true } : null);

// Box 2 (custom line) wins over Box 1 (ready-made line) when it has text.
export const cardHeader = (card) => customOf(card.custom_header) || resolveKey(card, card.header_key);
export const eventHeader = (card, ev) => {
  if (ev?.header_hidden) return null;
  if (!card.header_per_event || !ev) return cardHeader(card);
  return customOf(ev.custom_header) || (ev.header_key ? resolveKey(card, ev.header_key) : cardHeader(card));
};

const TYPE_TITLES = { wedding: "Wedding", engagement: "Engagement", birthday: "Birthday", aqiqah: "Aqiqah Ceremony", babyShower: "Baby Shower", housewarming: "Housewarming", corporate: "Event" };
// Mirrors backend intro_title(): single event -> "<event> Invitation"; multi -> "<type> Invitation".
export const autoIntroTitle = (card) => {
  const evs = card.events || [];
  let name = evs.length === 1 ? (evs[0].name || "").trim() : TYPE_TITLES[card.event_type] || "Event";
  if (evs.length === 1 && name.toLowerCase() === "aqiqah") name = "Aqiqah Ceremony";
  if (card.language === "hi") return `${name} निमंत्रण`;
  if (card.language === "ur") return `دعوتِ ${name}`;
  return /invitation/i.test(name) ? name : `${name} Invitation`;
};
export const introTitle = (card) => card.intro_title?.trim() || autoIntroTitle(card);

export const defaultWording = (card, ev) => {
  const tr = card.event_type === "aqiqah" ? "muslim" : trad(card);
  if (card.event_type !== "wedding" && card.event_type !== "aqiqah") return "";
  const [re, text] = SPECIAL[tr] || [];
  if (re?.test(ev.name)) return text;
  return WORDING[tr](ev.name || "celebration");
};
export const defaultDua = (card, ev) => (trad(card) === "muslim" && card.event_type === "wedding" && /nikah|wal[ei]ma|نکاح|ولیمہ|निकाह|वलीमा/i.test(ev.name) ? DUA.text : "");
export const defaultClosing = (card) => CLOSINGS[DEFAULT_CLOSING[trad(card)]];
export const defaultConcluded = (card) => CONCLUDED[card.event_type === "aqiqah" ? "muslim" : trad(card)];

export const eventWording = (card, ev) => pick(ev.wording, defaultWording(card, ev));
export const eventDua = (card, ev) => {
  const text = pick(ev.dua, defaultDua(card, ev));
  return text ? { text, sub: text === DUA.text ? DUA.sub : "" } : null;
};
export const eventClosing = (card, ev) => pick(ev.closing, defaultClosing(card));
export const eventConcluded = (card, ev) => pick(ev.concluded, defaultConcluded(card));

const grand = (gp, child) => (gp ? `, ${child === "son" ? "grandson" : "granddaughter"} of ${gp}` : "");

// "Mr. & Mrs. X request the pleasure of your company at the wedding of their son A with B, daughter of Mr. & Mrs. Y".
export const familyText = (card) => {
  const f = card.family || {};
  if (f.hidden || !["wedding", "engagement"].includes(card.event_type) || !card.secondary_name) return "";
  const side = (s) => ({
    parents: f[`${s}_parents`]?.trim() || (f[`${s}_family`]?.trim() ? `The ${f[`${s}_family`].trim()} family` : ""),
    gp: f[`${s}_grandparents`]?.trim() || "", child: s === "groom" ? "son" : "daughter",
    name: s === "groom" ? card.primary_name : card.secondary_name,
  });
  const host = side(f.host_side === "bride" ? "bride" : "groom");
  const other = side(f.host_side === "bride" ? "groom" : "bride");
  if (!host.parents && !other.parents && !host.gp && !other.gp) return "";
  const occasion = card.event_type === "engagement" ? "engagement" : "wedding";
  const lead = host.parents
    ? `${host.parents} request the pleasure of your company at the ${occasion} of their ${host.child} ${host.name}`
    : `The pleasure of your company is requested at the ${occasion} of ${host.name}`;
  const tail = other.parents ? `, ${other.child} of ${other.parents}` : "";
  return `${lead}${grand(host.gp, host.child)} with ${other.name}${tail}${grand(other.gp, other.child)}.`;
};

export const weddingSuggestions = (card) => WEDDING_EVENTS[trad(card)]?.suggest;
export const weddingDefaults = (tradition) => WEDDING_EVENTS[tradition]?.defaults;

// ---- Welcome page: salutation + greeting presets (localised, editable) ----
const L = (obj, lang) => (obj ? obj[lang] || obj.en : "");
const GREET = { en: "Welcome to the {occasion} of {names}", hi: "{names} के {occasion} में आपका स्वागत है", ur: "{names} کی {occasion} میں خوش آمدید" };

export const WELCOME = {
  muslim: {
    salutations: [
      { en: "Assalamu Alaikum", hi: "अस्सलामु अलैकुम", ur: "السلام علیکم" },
      { en: "Assalamu Alaikum wa Rahmatullah", hi: "अस्सलामु अलैकुम व रहमतुल्लाह", ur: "السلام علیکم و رحمۃ اللہ" },
    ],
    greetings: [GREET, { en: "Bismillah, we welcome you to the {occasion} of {names}", hi: "बिस्मिल्लाह, {names} के {occasion} में आपका स्वागत है", ur: "بسم اللہ، {names} کی {occasion} میں خوش آمدید" }],
  },
  hindu: {
    salutations: [
      { en: "Radhe Radhe", hi: "राधे राधे", ur: "رادھے رادھے" },
      { en: "Jai Shri Krishna", hi: "जय श्री कृष्ण", ur: "جے شری کرشن" },
      { en: "Namaste", hi: "नमस्ते", ur: "نمستے" },
      { en: "Jai Shri Ram", hi: "जय श्री राम", ur: "جے شری رام" },
      { en: "Om Namah Shivaya", hi: "ॐ नमः शिवाय", ur: "اوم نمہ شیوایہ" },
      { en: "Shubh Vivah", hi: "शुभ विवाह", ur: "شبھ وِواہ" },
    ],
    greetings: [GREET],
  },
  sikh: {
    salutations: [
      { en: "Sat Sri Akal", hi: "सत श्री अकाल", ur: "ست سری اکال" },
      { en: "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh", hi: "वाहेगुरु जी का खालसा, वाहेगुरु जी की फ़तह", ur: "واہے گرو جی کا خالصہ، واہے گرو جی کی فتح" },
    ],
    greetings: [GREET],
  },
  christian: {
    noSalutation: true,
    salutations: [
      { en: "God bless you", hi: "ईश्वर आपको आशीर्वाद दे", ur: "خدا آپ کو برکت دے" },
      { en: "Peace be with you", hi: "आपको शांति मिले", ur: "آپ پر سلامتی ہو" },
    ],
    greetings: [{ en: "You are invited to the {occasion} of {names}", hi: "आप {names} के {occasion} में आमंत्रित हैं", ur: "آپ کو {names} کی {occasion} میں مدعو کیا جاتا ہے" }],
  },
  neutral: { noSalutation: true, salutations: [], greetings: [GREET] },
};

export const welcomeSalutations = (card) => WELCOME[trad(card)].salutations.map((s) => L(s, card.language));
export const welcomeGreetings = (card) => WELCOME[trad(card)].greetings.map((g) => L(g, card.language));
export const welcomeSalutationDefault = (card) => (WELCOME[trad(card)].noSalutation ? "" : L(WELCOME[trad(card)].salutations[0], card.language));
export const welcomeGreetingDefault = (card) => L(WELCOME[trad(card)].greetings[0], card.language);

// Date note: defaults to just the scratch-to-reveal date token, shown under the greeting.
export const welcomeNoteDefault = () => "{date}";

// Invitation message defaults (editable). No "With the blessings of…"; worded to avoid repeating the blessing or welcome note.
const INVITE_NEUTRAL = { en: "Together with our families, we warmly invite you and your family to this special occasion.", hi: "अपने परिवारों सहित, हम सहर्ष आपको और आपके परिवार को इस विशेष अवसर पर आमंत्रित करते हैं।", ur: "اپنے خاندانوں کے ہمراہ، ہم خوشی سے آپ کو اور آپ کے خاندان کو اس خاص موقع پر مدعو کرتے ہیں۔" };
const INVITATION = {
  wedding: {
    hindu: { en: "With joy in our hearts, we warmly invite you and your family to bless the couple on this auspicious occasion.", hi: "हर्षित हृदय से, हम आपको और आपके परिवार को इस शुभ अवसर पर वर-वधू को आशीर्वाद देने के लिए आमंत्रित करते हैं।", ur: "دل کی خوشی کے ساتھ، ہم آپ کو اور آپ کے خاندان کو اس مبارک موقع پر جوڑے کو دعائیں دینے کی دعوت دیتے ہیں۔" },
    muslim: { en: "Together with our families, we request the pleasure of your company and your duas for the couple on this joyous occasion.", hi: "अपने परिवारों सहित, हम इस आनंदमय अवसर पर आपकी उपस्थिति और जोड़े के लिए आपकी दुआओं का अनुरोध करते हैं।", ur: "اپنے خاندانوں کے ہمراہ، ہم اس خوشی کے موقع پر آپ کی شرکت اور جوڑے کے لیے آپ کی دعاؤں کے طالب ہیں۔" },
    sikh: { en: "With the grace of Waheguru, we warmly invite you and your family to this joyous occasion.", hi: "वाहेगुरु की कृपा से, हम आपको और आपके परिवार को इस आनंदमय अवसर पर आमंत्रित करते हैं।", ur: "واہے گرو کے فضل سے، ہم آپ کو اور آپ کے خاندان کو اس خوشی کے موقع پر مدعو کرتے ہیں۔" },
    christian: { en: "We would be honoured to have you and your family share in our joy on this special day.", hi: "इस विशेष दिन पर आप और आपके परिवार का हमारी खुशी में शामिल होना हमारे लिए सम्मान की बात होगी।", ur: "اس خاص دن پر آپ اور آپ کے خاندان کا ہماری خوشی میں شریک ہونا ہمارے لیے باعثِ فخر ہوگا۔" },
    neutral: INVITE_NEUTRAL,
  },
  aqiqah: { muslim: { en: "Please join us with your family as we celebrate this joyous occasion. Your duas are very precious to us.", hi: "इस आनंदमय अवसर के उत्सव में कृपया सपरिवार हमारे साथ शामिल हों। आपकी दुआएँ हमारे लिए बहुमूल्य हैं।", ur: "اس خوشی کے موقع کی تقریب میں براہِ کرم اپنے خاندان سمیت ہمارے ساتھ شامل ہوں۔ آپ کی دعائیں ہمارے لیے بے حد قیمتی ہیں۔" } },
  birthday: { _: { en: "Come celebrate with us! We would love to have you and your family join the fun.", hi: "आइए हमारे साथ जश्न मनाइए! हमें खुशी होगी कि आप और आपका परिवार इस मस्ती में शामिल हों।", ur: "آئیے ہمارے ساتھ جشن منائیں! ہمیں خوشی ہوگی کہ آپ اور آپ کا خاندان اس خوشی میں شامل ہوں۔" } },
};
export const invitationDefault = (card) => {
  const byType = INVITATION[card.event_type];
  const chosen = byType ? byType[trad(card)] || byType._ : null;
  return L(chosen || INVITE_NEUTRAL, card.language);
};
