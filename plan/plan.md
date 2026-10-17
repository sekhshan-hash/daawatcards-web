# Daawat — Cinematic Digital Invitations

A mobile-first web app where hosts design animated, shareable invitation cards for weddings, birthdays and other occasions.
Each guest gets a personal link that opens a short cinematic card with their name, event details, a countdown, directions and RSVP.

## Who it's for
- **Hosts**: families and organisers who want a polished invitation they can send on WhatsApp instead of printed cards. They log in, build a card, share links and track replies.
- **Guests**: invitees, mostly opening the link from WhatsApp on low-end Android phones. They don't log in. They view the card and RSVP.

## Core features and experience

### Guest card (public link)
- Link format: `/i/{card-slug}/{event-id}?to=Guest+Name`, with readable slugs such as `aftab-hifza`. The card still works without a name.
- Every card follows the same flow. Each template has its own look and reveal:
  1. Intro screen showing the guest's name, with "Tap to open" and "Skip intro"
  2. Reveal moment, which differs by template
  3. Title screen with the host or couple names and the event title
  4. Scrolling details: invitation text, a blessing or prayer (default text per event type, editable), date, time and a live countdown (days, hours, minutes, seconds)
  5. Venue, with "Get Directions" (Google Maps) and "Add to Calendar" (.ics file and a Google Calendar link)
  6. RSVP: "Confirm on WhatsApp" opens a pre-filled message with the guest name and event. There is also an in-app Yes / No / Maybe choice with a guest count, saved for the host.
  7. Footer reading "With compliments from {host}", plus a "Replay" button
- **Multiple events per card** (Mehndi, Nikah, Walima and so on, as /e1, /e2...). Each event has its own date, venue, dress code and text. An event switcher lets guests jump between events.
- **Background music** with a mute toggle. Hosts pick a built-in royalty-free track for the template or upload their own audio file. Music starts only after the guest taps, because mobile browsers block autoplay.
- **Reduced motion**: if the device asks for less motion, intros and particle effects are replaced with simple fades.
- **WhatsApp link previews**: each event link shows its own title, date and venue description, and a generated preview image in the card's style.
- **Languages**: English, Hindi and Urdu. Urdu uses a full right-to-left layout. The host picks one language per card. Fixed card text (buttons, labels, countdown units, default blessings) appears in that language. Host-written text appears as typed.

### Templates in Phase 1 (original designs, Google Fonts, generated SVG/CSS art)
- **Royal Wedding**: deep maroon and ivory, ornate borders, a curtain-parting intro, and petals falling on reveal.
- **Birthday**: bright playful colours and balloons. Guests tap to pop a balloon for the reveal, followed by confetti.
- Templates are built as a data-driven theme system (palette, fonts, ornaments, intro and reveal style), so more can be added without rebuilding the card.

### Host app
- **Login**: Google sign-in, or phone number with a one-time code "sent on WhatsApp". **The WhatsApp code is MOCKED in Phase 1**: no real message is sent and the code is shown on screen. Hosts stay logged in until they log out.
- **Create-card wizard**: event type → template → host/couple details and card language → events (date, time, venue, map link, dress code, custom text, blessing) → music → live preview → publish.
- **My cards**: list of the host's cards. Hosts can edit them at any time, and changes go live instantly on all links.
- **Personal link maker (Phase 1)**: the host types a guest name and gets that guest's personal link, with "Copy link" and "Send on WhatsApp" (a pre-filled message plus the link). A full guest list comes in Phase 2.
- **Demo card**: a ready-made Royal Wedding card with three functions, so the full guest experience can be tried straight away from the landing page.

## User flow
1. A host opens Daawat, views the demo card, and logs in with Google or phone.
2. The host runs the wizard, previews the card on a phone-sized frame, and publishes.
3. The host types a guest's name, taps "Send on WhatsApp", and the guest receives a personal link with a rich preview.
4. The guest opens the link and sees their name on the intro, taps to open, watches the reveal, and scrolls through details, countdown and venue.
5. The guest adds the event to their calendar, gets directions, and RSVPs in the app and/or on WhatsApp. They can switch to the other events they're invited to.
6. The host edits details later, and guests see the changes immediately.

## UI/UX feel
- **Guest cards**: cinematic and full-screen on mobile, one template per mood, with rich but lightweight motion (CSS/SVG, no heavy video). Text stays readable over decorative backgrounds, and there is no horizontal scrolling.
- **Host app**: clean and warm. Simple step-by-step wizard screens with big touch targets, built mobile-first, plus a live phone-frame preview on desktop.
- Fast first load on slow connections. Fonts and assets for each template load only when that template is used.

## Implementation phases

### Phase 1 — MVP (built now)
- Guest card experience: the full 7-step flow, multiple events with a switcher, countdown, directions, calendar, WhatsApp and in-app RSVP, music, reduced motion and WhatsApp previews
- Two templates: Royal Wedding and Birthday
- Host login: Google, plus phone with a WhatsApp code (code is MOCKED)
- Create-card wizard, preview, publish, live editing and the My Cards list
- Personal link maker with copy and WhatsApp send
- English, Hindi and Urdu (right-to-left)
- Wedding and Birthday event types
- Seeded demo wedding card

### Phase 2
- Guest list: add guests one by one, paste many lines, or import a CSV or contacts file. Each guest gets a unique link.
- Bulk sharing: a "Send on WhatsApp" button and "Copy link" for each guest
- Dashboard: opened or not opened, RSVP status and guest count for each guest; totals per event; CSV export
- Remaining templates: Modern Minimal Wedding, Engagement, Aqiqah/Naming & Baby Shower (pastel, with an optional lullaby), Housewarming and Corporate

### Phase 3
- Razorpay payments: one-time, per card, in INR, with Standard and Premium tiers
- Plan limits. Free: 1 card, "Made with Daawat" watermark, up to 25 guests, no RSVP dashboard. Paid: no watermark, unlimited guests, RSVP tracking, music and all templates.
- Remaining event types: Engagement, Aqiqah/Naming, Housewarming, Baby Shower and Corporate
- Real WhatsApp OTP delivery, replacing the mock

## Assumptions
- The brand name is **Daawat** everywhere, including the watermark (the brief also had "Dawaat").
- Plan limits don't apply until Phase 3. In Phase 1 every host can use music, both templates and in-app RSVP.
- In-app RSVPs are saved from Phase 1. Hosts get a simple count per event on each card, and the full RSVP dashboard comes in Phase 2.
- A guest who RSVPs again from the same personal link updates their earlier answer instead of adding a new one.
- The mocked WhatsApp code shows a fixed test code on screen. Any phone number can log in with it.
- A Google account and a phone login are treated as separate host accounts. They are not merged.
- Uploaded music is limited to MP3/M4A files up to about 8 MB. Each template ships with 1–2 built-in royalty-free tracks.
- Countdowns and calendar entries use the event's local time, defaulting to India Standard Time.
- Blessing text defaults: Islamic and Hindu wedding options, plus a neutral one. The host picks one or writes their own.
- Each event link shows the event switcher only for that card's events. Inviting a guest to only some events comes with the Phase 2 guest list.
- Preview images for WhatsApp are generated automatically from the template style, names and date. Hosts can't upload a custom preview image yet.
