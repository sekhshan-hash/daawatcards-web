# Daawat: Swipe-Page Cards, Tradition Wording and Names That Fit

Cards with several events turn into a set of full-screen pages that the guest swipes through, like the leaves of a printed card.
Hosts choose a tradition (Muslim, Hindu, Sikh, Christian or Neutral), and every event gets the opening line, wording and closing lines of a traditional printed card. The host can edit all of it.

## Who it's for
- **Hosts** of weddings and other events with several functions. They want the card to read like the printed cards their families know, in the right religious style.
- **Guests**, mostly on low-end Android phones opening a WhatsApp link. They should be able to swipe through the card smoothly and read every name and line clearly, even on a 360px-wide screen.

## Core features and experience

### 1. Swipe pages (cards with 2 or more events only)
- The tab bar at the top is removed. The card becomes horizontal full-screen pages in this order:
  1. **Cover**: tradition header line, family block, couple or host names, the card title (e.g. "Wedding Celebrations"), and the list of events with their dates. Tapping an event in the list jumps to its page.
  2. **One page per event, in date and time order**: header line, the event's own wording, event name, date, time, countdown or status, venue, Get Directions, Add to Calendar, dress code, the event's own text and photo, and a closing line.
  3. **Final page**: RSVP, Send your wishes, "With compliments from", optional RSVP/contact line, Replay, and the "Made with Daawat" watermark.
- **Moving between pages:**
  - Swipe on touch screens, drag with a mouse, or use the left/right arrow keys.
  - Each change has a soft slide with a slight page-turn tilt.
  - Under reduced motion, pages switch with a simple fade.
- **Dots at the bottom:** one per page, with the current page highlighted. Tapping a dot jumps to that page.
- **"Swipe →" hint:** shown on the cover until the guest's first swipe, then gone.
- **Long pages:** a page taller than the screen scrolls up and down on its own. Mostly-vertical movement scrolls the page and mostly-horizontal movement turns it, so a slightly slanted scroll never flips the page by accident.
- **Colours:**
  - Each event page keeps its own colour scheme, and the background fades smoothly into the next page's colours while swiping.
  - The cover and final page use the template's own colours.
  - Auto colours gain one rule: Baraat becomes maroon (Crimson). The others stay as built: Mehndi green, Haldi yellow, Sangeet magenta, Walima/Reception midnight blue. Nikah keeps the template's colours.
- **Music:** the only control floating over the card is the small mute/unmute button.
- **Single-event cards** keep today's single scrolling page, apart from the changes in sections 2–5 below.
- The intro and reveal animations are unchanged, and the swipe pages start after the reveal.
- **Event links:** a personal link made for one event opens on that event's page, with the cover one swipe back. Guests invited to only some events see only those event pages.

### 2. Send your wishes and RSVP appear once
- "Send your wishes" is taken off the event pages. It appears only once, on the final page (on single-event cards, near the end).
  - It works as it does today: the message goes to the host on WhatsApp with the guest's name, and it is also saved for the host.
- **RSVP**, also on the final page:
  - The guest picks "Joyfully accept" or "Regretfully decline", the number of people coming, and which events (out of the ones they are invited to).
  - Sending opens WhatsApp to the host with a short message that includes the guest's name, and saves the response.

### 3. Names that fit every screen
- **Applies to:** the couple or host names on the cover, the guest's name on the intro, and the host name in the footer.
- **Sizing:** the text size scales with the screen width, then shrinks automatically until the longest word fits on one line.
- **Line breaks:**
  - Text only wraps at spaces or around "&", never in the middle of a word.
  - "&" goes on its own line only when the names don't fit otherwise.
  - The limit is 3 lines.
- **Checked with:** "Shahnawaz" on one line at 360px, and "Mohammad Shahnawaz Siddiqui & Farah Fatima" within 3 lines, with no horizontal overflow.

### 4. Tradition-specific wording
- **Choosing a tradition:**
  - In step 1 (Occasion) the host chooses a tradition: Muslim, Hindu, Sikh, Christian or Neutral/Other.
  - Changing it later swaps every default text the host has not edited, and keeps the edited ones.
- **Suggested event names per tradition.** The host can still rename them or add custom events.
  - Muslim: Mehndi, Haldi/Ubtan, Baraat, Nikah, Rukhsati, Walima, Dawat-e-Walima
  - Hindu: Roka, Haldi, Mehndi, Sangeet, Tilak, Baraat, Pheras/Vivah, Reception
  - Sikh: Anand Karaj, Jaago, Reception
  - Christian: Church Wedding, Reception
  - Neutral: today's suggestions
- **Header line** at the top of the cover and of each event page, in a calligraphic style and the right script. In Details, the host picks one of the options for the card. On each event page it can be hidden.
  - **Muslim:** "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" with "Bismillah ir-Rahman ir-Raheem" in smaller text below, or "786".
  - **Hindu:** "॥ श्री गणेशाय नमः ॥" (Shri Ganeshaya Namah), "ॐ", or "॥ श्री राधा कृष्णाय नमः ॥".
  - **Sikh:** "ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ" (Ik Onkar, Satgur Prasad).
  - **Christian:**
    - "Love is patient, love is kind" (1 Corinthians 13:4)
    - "What God has joined together, let no one separate" (Mark 10:9)
  - **Neutral:** "Together with their families" (no religious line).
- **Family block on the cover**, as on printed cards:
  - Example: "Mr. & Mrs. {parents} request the pleasure of your company at the wedding of their {son/daughter} {name} with {name}, {son/daughter} of Mr. & Mrs. {parents}".
  - The host fills in, in Details: bride's family name, groom's family name, both sets of parents' names, and optional grandparents. A switch says whose family is hosting, to set the "their son / their daughter" wording.
  - Any blank part is left out so the sentence still reads well, and the whole block can be hidden.
- **Wording on each event page**, a default that changes with the tradition and the event:
  - **Muslim:** "With the blessings of Almighty Allah, we cordially invite you … to join us in the joyous occasion of {event}".
    - The Nikah and Walima pages add the dua "بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ" with "Barakallahu lakuma wa baraka alaykuma wa jama'a baynakuma fi khayr".
    - Muslim cards never include Hindu references (Ganesha, Om and so on), and the reverse also holds.
  - **Hindu:** "With the blessings of Lord Ganesha and our elders, we invite you to bless the couple…", plus "Requests the pleasure of your company" and "Your presence will be our honour".
  - **Sikh:** "With the grace of Waheguru…"-style wording, with the Anand Karaj page worded for the Gurdwara.
  - **Christian:** "Together with their families, by the grace of God…"-style wording, with the Church Wedding page worded for the ceremony.
  - **Neutral:** today's wording.
  - **Closing line on each page:** one of "Your presence will make this occasion memorable", "Kind regards" or "Awaiting your gracious presence".
  - **Optional lines:** "RSVP / Contact" and "Dress code".
  - **Other occasions** (birthday, aqiqah, engagement and so on) get the tradition's header line and closing lines. Their body text stays as today, except Aqiqah, which follows Muslim wording.
- **Editing:**
  - In step 4 (Events), each event shows its header line, wording, closing dua or line, and concluded message.
  - Each is prefilled from the tradition and can be edited, hidden, or reset to the default.
  - The host can check everything in the live preview before publishing.
- **Wording check note:** "Please check religious wording before publishing." appears in the Events step and on the publish step.
- **Fonts and scripts:**
  - Arabic and Urdu use Amiri or Noto Naskh Arabic, and Noto Nastaliq Urdu for Urdu.
  - Devanagari uses Tiro Devanagari Hindi or Noto Serif Devanagari. Gurmukhi uses Noto Sans Gurmukhi.
  - Arabic and Urdu lines read right-to-left even inside an English card.
- **Future-ready:** all tradition texts sit in one wording file, so more traditions and languages can be added later.

### 5. Past and current events
- **Before the event:** the countdown shows as today.
- **During the event** (from the start time until the end time, or until midnight if no end time is set): "Happening now".
- **After the event:** "This event has concluded". The countdown never shows negative numbers.
- **Concluded message per tradition**, editable per event. For example:
  - Muslim: "Alhamdulillah, it was a blessed gathering"
  - Hindu: "With everyone's blessings, the occasion was celebrated with joy"
- **Calendar buttons:** Add to Calendar is hidden on concluded events. Directions stay.

### 6. Quality
- **Screen sizes:** works on 360px and 412px wide phones with no horizontal overflow.
- **Readability:** text sits on a soft panel or shadow wherever decorative backgrounds would hurt readability.
- **Smoothness:** swiping uses the phone's native scrolling so it stays smooth on low-end Android. Heavy effects are limited while a page is moving.
- **Demo cards:**
  - The existing wedding demo becomes a Muslim card: Haldi, Baraat, Nikah and Walima pages with Muslim wording, the Bismillah header and the dua on the Nikah and Walima pages.
  - A second demo, a Hindu wedding, is added: Haldi, Mehndi, Sangeet, Baraat, Pheras and Reception, with the Shri Ganesh header.

## User flow
1. The host starts a card, picks the occasion and the tradition (step 1), then a template (step 2).
2. In **Details** (step 3) the host fills in the names, picks the header line, and fills in the family block (bride's and groom's families, parents, optional grandparents).
3. In **Events** (step 4) the host adds events from the tradition's suggestions, and edits, hides or resets each event's wording, closing line and concluded message. The wording-check note is shown here.
4. The host checks the swipe preview and publishes. The note is shown again.
5. The guest opens the link, watches the intro, and lands on the cover (or on their event's page if the link is for one event). They swipe through the event pages and reach the final page to RSVP and send wishes.

## UI/UX feel
- Like holding a printed card: each page is a full leaf with the sacred line at the top, ornate dividers and generous spacing.
- Header lines are set larger and in calligraphy, with the transliteration small and quiet beneath.
- Page turns are short, under half a second, with a light tilt, never flashy.
- Small dots sit at the bottom. The "Swipe →" hint pulses gently once and then fades.
- The music button is the only floating control.

## Implementation phases

### Phase 1 (MVP, built now)
- Swipe pages for cards with 2+ events, with cover, event pages and final page, dots, the swipe hint, arrow keys and drag, separate vertical scrolling, colour fades, and the Baraat maroon rule.
- Wishes and RSVP only on the final page (once, at the end, on single-event cards).
- Name fitting for cover names, the intro guest name and the footer host name.
- Tradition picker; suggested event names; header line options; family block; per-event wording, closing dua and lines, all editable, hideable and resettable; the wording-check note; script fonts with right-to-left lines.
- Happening-now and concluded states with tradition-based concluded messages.
- Updated Muslim demo and a new Hindu wedding demo.

### Phase 2
- Pricing with Razorpay. Only the free plan shows the "Made with Daawat" watermark.
- Printed-card wording translated into Hindi and Urdu for every tradition.
- More traditions (e.g. Jain, Parsi, Buddhist).

### Phase 3
- Host RSVP dashboard with per-event headcounts and CSV export.
- Wishes Wall keepsake page.
- Real SMS or WhatsApp login codes, and WhatsApp Business bulk sending.

## Assumptions
- Swipe pages only on cards with 2+ events. Single-event cards keep one scrolling page.
- Existing cards are set to Neutral, so they get no religious line until the host picks a tradition. The demo cards are the exception.
- Hindi and Urdu cards use English for the printed-card wording for now. Only the header lines use their own scripts. The rest of the guest card stays translated as today.
- No paid plans exist yet, so the "Made with Daawat" watermark shows on every card until Phase 2.
- RSVP responses are saved and also sent to the host on WhatsApp. The host sees them as a simple list next to the existing wishes list on the card page. This is the only change to the host side beyond the wizard.
- The tradition is chosen in step 1. The header line option and the family block live in step 3. Per-event wording lives in step 4.
- Baraat gets maroon automatically. Nikah keeps the template's colours as the main ceremony.
- The cover and final page use the template's own colours.
- The header line choice applies to the whole card, and each event page can hide it.
- After the intro, a link for one event opens on that event's page. A general link opens on the cover.
- "Happening now" lasts from the start time to the end time, or until midnight without an end time. "Concluded" shows after that.
- Default religious texts are standard, widely used phrases. Hosts are asked to check them before publishing.
- WhatsApp link previews stay as they are today: one per event, in that event's colours.
