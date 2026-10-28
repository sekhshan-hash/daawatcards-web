// Original line-art per event kind, drawn in currentColor so each template's accent styles it.
const KINDS = [
  ["mehndi", /mehn?d[ie]|mehendi|henna|मेहं?दी|مہندی/i, "मेहंदी", "مہندی"],
  ["haldi", /haldi|turmeric|pithi|ubtan|mayun|maiyan|हल्दी|ہلدی|مایوں/i, "हल्दी", "ہلدی"],
  ["sangeet", /sangeet|sangit|dholki|dholak|संगीत|سنگیت/i, "संगीत", "سنگیت"],
  ["baraat", /baraat|barat|बारात|بارات/i, "बारात", "بارات"],
  ["nikah", /nik+ah|निकाह|نکاح/i, "निकाह", "نکاح"],
  ["walima", /wal[ie]ma|valima|वलीमा|ولیمہ/i, "वलीमा", "ولیمہ"],
  ["reception", /reception|रिसेप्शन|استقبالیہ/i, "रिसेप्शन", "استقبالیہ"],
  ["engagement", /engage|mangni|sagai|roka|ring ceremony|सगाई|منگنی/i, "सगाई", "منگنی"],
  ["aqiqah", /aq[ie]+q|अक़ीक़ा|अकीका|عقیقہ/i, "अक़ीक़ा", "عقیقہ"],
  ["birthday", /birthday|b'?day|janam ?din|जन्मदिन|سالگرہ/i, "जन्मदिन", "سالگرہ"],
  ["wedding", /wedding|shaa?di|vivah|phera|marriage|lagan|विवाह|शादी|شادی/i, "विवाह", "شادی"],
];

export const eventKind = (name = "") => KINDS.find(([, re]) => re.test(name))?.[0] || "ornament";

// Known events get their name in the card's script (Hindi/Urdu cards) when typed in Latin letters.
export const secondScript = (name = "", lang) => {
  if ((lang !== "hi" && lang !== "ur") || !/[a-z]/i.test(name)) return "";
  const row = KINDS.find(([, re]) => re.test(name));
  return row ? row[lang === "hi" ? 2 : 3] : "";
};

const ART = {
  mehndi: (
    <>
      <path d="M22 36V16a2.5 2.5 0 0 1 5 0v14M27 29V11a2.5 2.5 0 0 1 5 0v18M32 29V13a2.5 2.5 0 0 1 5 0v17M37 31V18a2.5 2.5 0 0 1 5 0v18c0 12-6 20-14 20-6 0-9-4-12-9l-5-9a2.6 2.6 0 0 1 4.4-2.6L22 40" />
      <circle cx="32" cy="42" r="3.2" /><path d="M32 36.5v-2M32 49.5v-2M26.5 42h-2M39.5 42h-2" />
      <circle cx="24.5" cy="19" r=".9" /><circle cx="29.5" cy="15" r=".9" /><circle cx="34.5" cy="17" r=".9" /><circle cx="39.5" cy="22" r=".9" />
    </>
  ),
  haldi: (
    <>
      <path d="M10 36h44M12 36c1 10 9 16 20 16s19-6 20-16" /><path d="M24 52l-2 5h20l-2-5" />
      <path d="M18 36c3-6 8-9 14-9s11 3 14 9" />
      <circle cx="32" cy="18" r="3" /><path d="M32 15c-2-4 2-6 0-8M32 15c2-4-2-6 0-8M29 18c-4-1-5 3-8 1M35 18c4-1 5 3 8 1M30 21c-3 2-1 5-4 6M34 21c3 2 1 5 4 6" />
      <path d="M46 26c4-5 9-4 10-3-2 4-6 6-10 3zM18 26c-4-5-9-4-10-3 2 4 6 6 10 3z" />
    </>
  ),
  sangeet: (
    <>
      <path d="M14 30c0-3 8-5 18-5s18 2 18 5v12c0 3-8 5-18 5s-18-2-18-5z" /><ellipse cx="32" cy="30" rx="18" ry="5" />
      <path d="M18 34l6 10M26 35l4 11M38 35l-4 11M46 34l-6 10" />
      <path d="M44 8v10a3 3 0 1 1-2-2.8M44 8l8-2v9a3 3 0 1 1-2-2.8" /><path d="M14 12v8a2.6 2.6 0 1 1-2-2.5" />
    </>
  ),
  baraat: (
    <>
      <path d="M14 40c0-12 8-20 18-20s18 8 18 20" /><path d="M12 40h40l-3 7H15z" />
      <path d="M17 34c5-3 10-4 15-4s10 1 15 4M20 27c4-2 8-3 12-3s8 1 12 3" />
      <path d="M32 20c-1-6 2-10 6-13-1 4 0 7-2 10" /><circle cx="32" cy="22" r="2" />
      <path d="M22 47v6M27 47v8M32 47v9M37 47v8M42 47v6" />
    </>
  ),
  nikah: (
    <>
      <path d="M16 56V34c0-9 7-16 16-22 9 6 16 13 16 22v22z" /><path d="M24 56V40a8 8 0 0 1 16 0v16" />
      <path d="M32 12V6" /><path d="M35 4.5a3.4 3.4 0 1 0 0 3.5 2.7 2.7 0 1 1 0-3.5z" />
      <path d="M10 56h44M11 56V38M53 56V38M9 38h4M51 38h4" />
    </>
  ),
  walima: (
    <>
      <path d="M12 44h40M10 48h44" /><path d="M14 44c0-11 8-18 18-18s18 7 18 18" /><path d="M32 26v-3M29 23h6" />
      <path d="M22 18c-2-3 2-5 0-8M32 16c-2-3 2-5 0-8M42 18c-2-3 2-5 0-8" />
      <path d="M20 36c2-3 5-5 8-5.5" />
    </>
  ),
  wedding: (
    <>
      <path d="M10 22h44M14 22c4-8 10-12 18-12s14 4 18 12M32 10V5" />
      <path d="M16 22v34M48 22v34M10 56h44" /><path d="M16 28c5 4 11 6 16 6s11-2 16-6" />
      <path d="M26 56c0-6 2-10 6-14 4 4 6 8 6 14" /><path d="M32 50c-1-2 1-3 0-5" />
    </>
  ),
  reception: (
    <>
      <path d="M18 14h12l-2 14a4 4 0 0 1-8 0zM24 32v18M19 50h10" transform="rotate(-12 24 32)" />
      <path d="M34 14h12l-2 14a4 4 0 0 1-8 0zM40 32v18M35 50h10" transform="rotate(12 40 32)" />
      <path d="M32 6v4M26 8l2 3M38 8l-2 3" /><circle cx="12" cy="20" r="1" /><circle cx="52" cy="22" r="1" /><circle cx="50" cy="10" r="1" />
    </>
  ),
  engagement: (
    <>
      <circle cx="32" cy="40" r="14" /><circle cx="32" cy="40" r="10" />
      <path d="M25 21l7 6 7-6-3-5h-8z" /><path d="M25 21h14M28 16l4 11 4-11" />
      <path d="M14 14l2 2M50 14l-2 2M32 6v3" />
    </>
  ),
  aqiqah: (
    <>
      <path d="M12 34h40c0 10-9 16-20 16S12 44 12 34z" /><path d="M16 50c4 4 10 6 16 6s12-2 16-6" />
      <path d="M22 34c0-5 4-8 9-8 4 0 7 2 8 5" /><circle cx="27" cy="31" r="3" />
      <path d="M46 10a7 7 0 1 0 4 12 6 6 0 1 1-4-12z" /><path d="M18 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
    </>
  ),
  birthday: (
    <>
      <path d="M14 56V40h36v16M10 56h44M14 46c3 3 6 3 9 0s6-3 9 0 6 3 9 0 6-3 9 0" />
      <path d="M18 40V32h28v8" /><path d="M24 32v-8M32 32v-8M40 32v-8" />
      <path d="M24 20c-2-2 0-5 0-6 0 1 2 4 0 6zM32 20c-2-2 0-5 0-6 0 1 2 4 0 6zM40 20c-2-2 0-5 0-6 0 1 2 4 0 6z" />
    </>
  ),
  ornament: (
    <>
      <path d="M32 8l10 24-10 24-10-24z" /><path d="M32 18l5 14-5 14-5-14z" />
      <path d="M8 32h12M44 32h12" /><circle cx="32" cy="32" r="2" /><circle cx="14" cy="32" r="1.4" /><circle cx="50" cy="32" r="1.4" />
    </>
  ),
};

export const EventArt = ({ name, className = "", testId }) => {
  const kind = eventKind(name);
  return (
    <svg viewBox="0 0 64 64" className={`gc-art ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" data-kind={kind} data-testid={testId}>
      {ART[kind]}
    </svg>
  );
};
