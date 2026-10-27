# Daawat — PRD

## Original problem statement
Mobile-first web app where hosts create cinematic, shareable digital invitation cards, and guests open personalized links (/i/{slug}/{event-id}?to=Name). Templates are data-driven. There is a host wizard and RSVPs. Phased build: Phase 1 (guest card, wizard, Royal + Birthday templates, personal links, WhatsApp RSVP), Phase 2 (guest list, dashboard, remaining templates, languages), Phase 3 (Razorpay, watermark gating, remaining event types).

## User choices (Phase 1)
- English only. All strings live in frontend/src/i18n/en.js, and makeT/dirFor are ready for hi/ur (RTL).
- Built-in music only, synthesized with Web Audio (royalty-free, no download). No host uploads.
- Phone OTP is MOCKED ("WhatsApp", code 123456) behind a swappable provider (backend/otp_providers.py, env OTP_PROVIDER).
- The brand name is set in frontend/src/config/brand.js (UI) and in backend/.env BRAND_NAME (link previews).
- Google login uses Emergent-managed auth.

## Architecture
- Backend: FastAPI (server.py), MongoDB collections users, user_sessions, otp_codes, cards (events embedded), rsvps. og_image.py uses Pillow with Google Font TTFs in backend/fonts. seed.py holds the demo cards aftab-hifza and zara-turns-7.
- Share link /api/s/{slug}/{eid}?to= serves per-event OG tags and redirects to /i/...; the preview image is /api/og/{slug}/{eid}.png. ICS: /api/public/cards/{slug}/events/{eid}/ics.
- Frontend: template registry (src/templates/registry.js) with CSS vars, fonts, intro, particles, frame, divider and music. A shared GuestCard flow (src/card). Host pages: Landing, Login, Dashboard, Wizard (6 steps with live phone preview), CardDetail (link maker + RSVP counts).

## Implemented (2026-06, Phase 1)
- Guest card 7-step flow, event switcher, countdown, directions, .ics + Google Calendar, in-app RSVP (upsert by name) + WhatsApp RSVP, replay, music toggle, reduced motion
- Royal Velvet (curtains + petals) and Party Pop (balloon pop + confetti) templates
- Google + mocked phone OTP login, wizard, draft/publish, live edits, delete, personal link maker with copy / WhatsApp
- OG previews with a generated image
- Tested: backend 16/16 passing; frontend flows pass (iteration_1). Layout issues fixed afterwards.

## Implemented (Iteration 2)
- Photos (Emergent Object Storage, resized in the browser): 2 per card (title arch/circle + feature), 1 per event, 1 for the wishes section
- RSVP removed per the user and replaced by "Send your wishes" (WhatsApp to the host, also saved and listed for the host)
- Guest list /cards/:id/guests: one by one, paste (Excel/Sheets), CSV, .vcf, phone contact picker (Android Chrome), review/edit before adding, per-guest invited events, unique links (?g=), per-guest WhatsApp, a "Send to all" queue (one tap per guest; WhatsApp does not allow true bulk sending), Not sent/Sent/Opened status, search, CSV export
- Card language en/hi/ur (guest card only; Urdu is RTL with Nastaliq). OG images support Devanagari/Nastaliq
- Tested: iteration_2, backend 27/27; frontend flows pass

## Implemented (Iteration 3)
- Heading font picker (6 options, saved as heading_font) applied to the intro name, names, title and host line
- 5 new templates: Modern Minimal (envelope), Rose Gold Promise (rings + swipe/tap), Little Star (clouds/moon + stars), Warm Hearth (door + diyas), Boardroom (line draw)
- 5 new occasions (engagement, aqiqah, babyShower, housewarming, corporate) with en/hi/ur defaults; corporate wording (organiser note, "Hosted by")
- Lullaby track; OG preview shows photos[0] in a template-shaped frame beside the text, with dates translated for hi/ur
- Tested: iteration_3 (backend 63 tests; frontend all flows). Envelope name visibility and template sample fonts fixed afterwards

## Backlog
- P0 Phase 2: guest list (manual / paste / CSV / contacts), unique per-guest links, bulk WhatsApp share, open tracking, full RSVP dashboard + CSV export, remaining templates (Modern Minimal, Engagement, Pastel Aqiqah/Baby Shower with lullaby, Housewarming, Corporate), Hindi + Urdu (RTL)
- P1 Phase 3: Razorpay one-time per-card Standard/Premium, Free plan gating (1 card, watermark, 25 guests), remaining event types, real SMS OTP provider
