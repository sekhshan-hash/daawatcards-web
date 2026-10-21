# Daawat: Heading Fonts, Five New Templates and Photo Link Previews

Daawat lets hosts create cinematic digital invitation cards and send every guest a personal WhatsApp link.
This update adds a heading-font picker and five new template designs that unlock five more occasions. Shared WhatsApp links will also show the host's photo in the preview.

## Who it's for
- **Hosts** planning weddings, engagements, aqiqahs and naming ceremonies, baby showers, housewarmings and corporate events. They want a card that fits the occasion and their own taste.
- **Guests**, who mostly open links from WhatsApp on everyday Android phones. They should see a rich, personal preview before they even tap.

## Core features and experience

### 1. Heading font picker (wizard, step 3 "Details")
- A row of 6 chips. Each chip shows its name written in its own font:
  - **Template default**: keeps the template's own font pairing. This is the starting choice for every card.
  - **Cinzel Decorative**: Royal / Classic
  - **Playfair Display**: Modern Luxury
  - **Great Vibes**: Elegant Script
  - **Fredoka**: Playful
  - **Rozha One**: Traditional Ethnic
- The chosen font applies to the guest's name on the intro screen, the couple or host names, the card title, and the "With compliments from" host name.
- Body text, buttons and details keep the template's fonts so they stay easy to read.
- The live phone preview updates instantly when a chip is tapped.
- The choice is saved with the card. As with every edit, changing it later updates all links at once.
- Hindi and Urdu cards keep working:
  - Rozha One has Devanagari letters built in.
  - For the other fonts, Hindi or Urdu letters fall back to the card's Hindi or Urdu font.

### 2. Five new templates, each with its own look, intro and reveal
| Template | Occasions | Look | Intro | Reveal |
|---|---|---|---|---|
| **Modern Minimal** | Wedding (alongside Royal Velvet) | White and sage green, thin line-art florals | An envelope opens and the card slides out | Soft fade-in |
| **Rose Gold Promise** | Engagement | Blush pink and rose gold, sparkles | Two rings sparkle and link together | Guest swipes up (or taps) to reveal, with a shimmer |
| **Little Star** | Aqiqah / Naming, Baby Shower | Pastel palette, clouds, moon and stars | Clouds drift apart to show a sleeping moon | Stars twinkle on one by one |
| **Warm Hearth** | Housewarming | Terracotta, mustard and cream, earthy textures | A wooden door swings open | Rows of diyas light up one after another |
| **Boardroom** | Corporate | Navy and white, clean lines | Minimal: a thin line draws across the screen | A simple, elegant fade-up |

- Every template uses only original, generated artwork (SVG/CSS patterns and illustrations) and Google Fonts. No existing invitation designs are copied.
- All templates follow the same guest flow:
  - personal intro with "Tap to open" and "Skip intro"
  - reveal, then the title screen
  - details, blessing and countdown
  - venue, directions and calendar
  - "Send your wishes"
  - footer with "With compliments from" and Replay
- All templates support photos, multiple events, music, Hindi/Urdu (including right-to-left Urdu), and reduced motion.
- A new built-in **Lullaby** track joins the music list. It is the default for Little Star. Every other template defaults to "No music" or its closest existing track.
- In the template step, matching templates are marked "Recommended" for the chosen occasion. Hosts can still pick any template.

### 3. Five more occasions unlocked
- Engagement, Aqiqah / Naming, Baby Shower, Housewarming and Corporate become selectable in step 1. Each comes with:
  - its own name fields (see the table below)
  - a default title and invitation text
  - a choice of blessings
  - event name suggestions
  - wish suggestions
- All default text exists in English, Hindi and Urdu.

| Occasion | Name fields | Example default events | Blessing options |
|---|---|---|---|
| Engagement | Two names (shown as "A & B") | Engagement, Ring Ceremony, Dinner | Islamic, Hindu, Neutral, Custom |
| Aqiqah / Naming | Child's name + parents' names | Aqiqah, Naming Ceremony, Lunch | Islamic, Hindu, Neutral, Custom |
| Baby Shower | Mum-to-be's name + a tagline | Baby Shower, Godh Bharai | Neutral, Hindu, Islamic, Custom |
| Housewarming | Family name + new address line | Griha Pravesh / Housewarming, Dinner | Hindu, Islamic, Neutral, Custom |
| Corporate | Company / organiser + event tagline | Launch, Gala Dinner, Conference | None (optional custom message) |

- **Corporate wording.** "Send your wishes" becomes "Send a note to the organiser". Its suggestions are professional (e.g. "Looking forward to it!"), and "With compliments from" reads "Hosted by".

### 4. Photo in WhatsApp link previews
- If the card has a title-screen photo, the preview image is split into two halves:
  - **One side:** the photo, in the same frame shape as the template (arch for Royal Velvet, circle for Party Pop and Little Star, rounded rectangle for Modern Minimal and Boardroom, and so on).
  - **Other side:** the names, event name, date and venue, in the template's colours.
- Cards without a photo keep the current centred design. This design is extended to all new templates.
- Every event's preview uses the card's title-screen photo, and the preview text is in the card's language.
- Changing the photo updates the preview for links shared after the change. WhatsApp keeps the old preview for messages that were already sent.

## User flow
1. **Host creates or edits a card:** picks the occasion (all 7 now available), then a template (matching ones recommended).
2. **Details step:** language, names, then the new Heading Font chips. The live preview restyles instantly, and the host continues through events, photos, music and preview.
3. **Publish or save:** the font, template and photos go live on every guest link straight away.
4. **Host sends invites** from the guest list (per-guest WhatsApp button or the "Send to all" queue). WhatsApp shows the photo preview with the names and date.
5. **Guest opens the link** and sees the template's own intro and reveal. The guest's name, the couple or host names and the title appear in the chosen heading font.

## UI/UX feel
- **Font chips:** a horizontally scrollable row on mobile and a grid on desktop. Each chip has a short "Aa"-style sample and its label. The selected chip has a gold outline.
- **New templates:**
  - Modern Minimal is calm and airy.
  - Rose Gold Promise is romantic and sparkly.
  - Little Star is soft and dreamy.
  - Warm Hearth is cosy, with a festive glow.
  - Boardroom is crisp and restrained.
- Animations stay light so cards remain smooth on low-end phones. Text contrast stays readable on every palette.

## Implementation phases

### Phase 1 (MVP, built now)
- Heading font picker with 6 chips. The choice is saved with the card and shown in the live preview and on guest cards.
- 5 new templates (Modern Minimal, Rose Gold Promise, Little Star, Warm Hearth, Boardroom), each with its own intro, reveal, artwork and preview-image style.
- 5 new occasions with default texts in English, Hindi and Urdu, plus the Corporate wording changes.
- Lullaby music track.
- Photo in WhatsApp link previews (photo beside the text, in the template's frame).

### Phase 2
- Pricing and plan limits with Razorpay. Prices are one-time per card, in INR, in two tiers: Standard and Premium.
  - **Free:** 1 card, "Made with Daawat" watermark, up to 25 guests.
  - **Paid:** no watermark, unlimited guests, music, all templates and fonts.

### Phase 3
- Automatic bulk sending through the WhatsApp Business API, with delivery status per guest.
- Real SMS or WhatsApp login codes in place of the current test code.
- Wishes Wall: a keepsake page collecting every guest's wishes.

## Assumptions
- "Template default" is the starting choice for new cards and for all existing cards, so current cards look exactly the same until the host changes the font.
- The heading font covers the guest's name on the intro, the names, the card title and the "With compliments from" host name. Section headings, details, buttons and body text stay in the template's fonts.
- The template names (Rose Gold Promise, Little Star, Warm Hearth, Boardroom) are working names and can be renamed.
- Aqiqah / Naming and Baby Shower share the Little Star template. Wedding gets Modern Minimal alongside Royal Velvet.
- The Engagement "swipe to reveal" also works with a single tap, for guests who don't swipe.
- Corporate cards have no default blessing, and say "Hosted by" rather than "With compliments from".
- The link preview uses the first (title-screen) photo only. Event photos are not used in previews.
- Heading font choices are not limited by plan in this phase. Any limits arrive with Phase 2 pricing.
