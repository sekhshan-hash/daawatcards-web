// Extra occasions, templates and fonts (merged over en.js).
const enMore = {
  templates: {
    "modern-minimal": { name: "Modern Minimal", desc: "White and sage with thin line-art florals. An envelope opens and the card slides out." },
    "rose-gold": { name: "Rose Gold Promise", desc: "Blush and rose gold. Two rings sparkle and link, then swipe up to reveal." },
    "little-star": { name: "Little Star", desc: "Pastel clouds drift apart to show a sleeping moon, and stars twinkle on." },
    "warm-hearth": { name: "Warm Hearth", desc: "Terracotta and mustard. A wooden door swings open and diyas light up one by one." },
    boardroom: { name: "Boardroom", desc: "Navy and white, clean lines. A thin line draws across, then an elegant fade-up." },
  },
  music: { lullaby: "Lullaby" },
  colors: {
    auto: "Auto", template: "Template colours", emerald: "Mehndi green", marigold: "Haldi yellow", magenta: "Sangeet magenta",
    midnight: "Midnight blue", crimson: "Crimson", peacock: "Peacock teal", coral: "Coral", lavender: "Lavender", champagne: "Champagne", blush: "Blush pink",
  },
  musicHints: { lullaby: "A soft, sleepy music box" },
  blessingLabels: { none: "No blessing" },
  blessingOptions: {
    engagement: ["islamic", "hindu", "neutral", "custom"],
    aqiqah: ["islamic", "hindu", "neutral", "custom"],
    babyShower: ["neutral", "hindu", "islamic", "custom"],
    housewarming: ["hindu", "islamic", "neutral", "custom"],
    corporate: ["none", "custom"],
  },
  blessingsByType: {
    aqiqah: {
      islamic: "Alhamdulillah. May Allah bless our little one with health, faith and a long, happy life.",
      hindu: "With the blessings of the divine, we welcome our little one and seek your love and blessings.",
      neutral: "A tiny new heart has joined our family. Come celebrate this precious little life with us.",
    },
    babyShower: {
      neutral: "A little miracle is on the way. Shower the mum-to-be with love and blessings.",
      hindu: "May the divine bless the mother and the little one with health and happiness.",
      islamic: "May Allah grant the mother ease and bless the little one with health and barakah.",
    },
    housewarming: {
      hindu: "Shubh Griha Pravesh. May our new home be filled with peace, prosperity and togetherness.",
      islamic: "Bismillah. May Allah fill our new home with barakah, peace and happiness.",
      neutral: "New doors, new memories. Our home will feel complete with you in it.",
    },
  },
  defaults: {
    engagement: { title: "Engagement Ceremony", invitation: "With joy in our hearts, we invite you to celebrate our engagement and the promise of forever.", blessing: "neutral", events: ["Engagement", "Dinner"] },
    aqiqah: { title: "Aqiqah Celebration", invitation: "With hearts full of gratitude, we invite you to the Aqiqah of our little one. Your duas mean the world to us.", blessing: "islamic", events: ["Aqiqah", "Lunch"] },
    babyShower: { title: "Baby Shower", invitation: "Join us for an afternoon of love, laughter and little surprises as we celebrate the mum-to-be.", blessing: "neutral", events: ["Baby Shower"] },
    housewarming: { title: "Housewarming", invitation: "We have a new home, and it won't feel complete without you. Join us for the Griha Pravesh.", blessing: "hindu", events: ["Griha Pravesh", "Dinner"] },
    corporate: { title: "You're Invited", invitation: "We are pleased to invite you to an evening of ideas, conversations and celebration.", blessing: "none", events: ["Launch Event"] },
  },
  eventSuggestions: {
    engagement: ["Engagement", "Ring Ceremony", "Mangni", "Dinner"],
    aqiqah: ["Aqiqah", "Naming Ceremony", "Naamkaran", "Lunch"],
    babyShower: ["Baby Shower", "Godh Bharai", "High Tea"],
    housewarming: ["Griha Pravesh", "Housewarming", "Pooja", "Dinner"],
    corporate: ["Launch", "Gala Dinner", "Conference", "Annual Meet", "Networking"],
  },
  wishSuggestions: {
    engagement: ["Congratulations to the lovely couple! Wishing you a beautiful journey ahead.", "So happy for you both! May this promise bloom into a lifetime of love.", "Many congratulations! Can't wait for the wedding!"],
    aqiqah: ["Mubarak ho! May the little one be blessed with health and happiness.", "Welcome to the world, little star! Lots of love and duas.", "Congratulations to the proud parents!"],
    babyShower: ["Wishing the mum-to-be a smooth and joyful journey!", "Can't wait to meet the little one! Lots of love.", "Sending hugs and blessings to the whole family!"],
    housewarming: ["Congratulations on your new home! May it be full of happiness.", "Wishing you peace, love and prosperity in your new home.", "Home sweet home! Can't wait to visit."],
    corporate: ["Looking forward to it!", "Thank you for the invitation. Count me in.", "Congratulations on the milestone. See you there!"],
  },
  guest: {
    eyebrow: {
      engagement: "With joy, we celebrate the promise of", aqiqah: "Please join us in welcoming",
      babyShower: "A little one is on the way for", housewarming: "Join us at the new home of", corporate: "You are cordially invited by",
    },
    corporate: { wishesTitle: "Send a note to the organiser", wishesSubtitle: "Share a quick note. It goes straight to the organiser on WhatsApp.", sendWishes: "Send note on WhatsApp", yourWish: "Your note", compliments: "Hosted by" },
    swipeUp: "Swipe up to reveal",
  },
  wizard: {
    labels: {
      engagement: { primary: "First name", secondary: "Second name" },
      aqiqah: { primary: "Child's name", secondary: "Parents' names (e.g. son of Imran & Ayesha)" },
      babyShower: { primary: "Mum-to-be's name", secondary: "Tagline (e.g. Baby on board!)" },
      housewarming: { primary: "Family name (e.g. The Sharmas)", secondary: "New address line (e.g. Flat 402, Green Park)" },
      corporate: { primary: "Company / organiser", secondary: "Event tagline" },
    },
    hostedBy: "Hosted by",
    headingFont: "Heading font",
    headingFontHint: "Used for the guest's name, your names, the title and the host line.",
    fonts: { default: "Template default", cinzel: "Royal / Classic", playfair: "Modern Luxury", greatvibes: "Elegant Script", fredoka: "Playful", rozha: "Traditional Ethnic" },
  },
};

export default enMore;
