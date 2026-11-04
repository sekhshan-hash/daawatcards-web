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

## Implemented (Iteration 4: Guests & Send)
- Virtualized guest list (react-virtuoso, window scroll), filters (all/not sent/sent/opened), search by name or digits
- Select / select all, bulk bar: send to selected (queue), tidy names (bulk-rename), remove (bulk-delete)
- Editable WhatsApp message per card (PUT /cards/{id}/invite-template; tags {guest} {event} {names} {date} {link}; link auto-appended if missing); not wiped by wizard saves
- Review dedupe + "Already on your list" + merge switch (on_duplicate=merge); auto mark Sent on tap with sent time + undo (DELETE .../sent)
- Tested: iteration_4, backend 71/71, frontend all flows pass; copy fixes applied afterwards

## Implemented (Iteration 5)
- Template preview ("Watch intro" on every tile in step 2): full intro + reveal, full screen on phones and in a phone frame on desktop, uses the host's names, language and font (sample names if empty), with Replay, Use this template, Close and music toggle. Opens on the main-ceremony event so the template's own colours show first
- Per-event colours (cards with 2+ events): auto from the event name in en/hi/ur (Mehndi emerald, Haldi marigold, Sangeet magenta, Walima/Reception midnight; others keep the template's colours), event.color override ("" auto, "template", 10 schemes) via swatches in step 4; animated repaint through registered --c-* CSS properties; coloured tab dots; OG images per event scheme (og_image.SCHEMES; share version includes the scheme)
- Tested: iteration_5, backend 93/93, frontend all flows

## Implemented (Iteration 6: Swipe pages, tradition wording, names that fit)
- Cards with 2+ events: horizontal swipe pages (cover with header line, family block, names, title and event list; one page per event in date order; final page with RSVP, wishes and footer). Native scroll-snap, mouse drag, arrow keys, coloured dots, one-time "Swipe" hint, per-page colour schemes (Baraat auto = crimson), page-turn tilt via a CSS scroll-driven animation on .gc-page-inner (not on the snap target), fade under reduced motion. The tab bar has been removed. Event link opens on its page, general link on the cover, guest link on the cover unless the guest is invited to exactly one event
- RSVP (accept/decline, number of guests, events) on the final page: WhatsApp to the host plus POST /public/cards/{slug}/rsvp (collection rsvp_replies; guest_id checked against guests); host list on the card detail page (GET /cards/{id}/rsvps). Wishes appear once
- FitText: cover names, intro guest name and footer host name shrink so the longest word fits, max 3 lines
- Traditions (frontend/src/i18n/traditions.js): muslim/hindu/sikh/christian/neutral, with header lines (Arabic/Devanagari/Gurmukhi fonts), wedding event suggestions and defaults, family sentence, per-event wording, dua (Muslim Nikah/Walima), closings and concluded messages. Per event, null = default, "" = hidden, string = custom. Card fields: tradition, header_key ("" default, "none"), family{}. Event fields: header_hidden, wording, dua, closing, concluded, rsvp_line
- Event status: upcoming countdown / Happening now / concluded + message; calendar hidden when the event is over
- Demos: aftab-hifza (Muslim, 4 events) and rohan-ananya (Hindu, 6 events)
- Tested: iteration_6, backend 112/112, frontend all flows; fixed afterwards: the snap offset, RSVP success shown only after the save succeeds, "1 guest" singular, RSVP guest_id validation

## Implemented (Iteration 7: six small updates)
- Header line in wizard step 3: Box 1 is a dropdown grouped by tradition, with "Jai Shri Ram" added; Box 2 is a custom line (text, script, transliteration, size, colour) that overrides Box 1, with "Using custom line" and "Clear custom line"; optional per-event header boxes (header_per_event, events[].header_key/custom_header)
- Intro invitation title (intro_title, auto from event name or type, also in hi/ur) shown above "Specially for", in the browser tab and in the WhatsApp title "<title> · <names>"
- RSVP removed completely: the guest block, the host list and the API
- Demo renamed to Shahnawaz & Farah (slug demo-shahnawaz-farah, seeded by card_id)
- Multi-event cards always open on the cover and auto-advance every 5s until the last page; this stops for good on any swipe, scroll, tap or key
- Couple names stacked on 3 lines (name / & / name)
- Tested: iteration_7, 100% backend and frontend

## Implemented (Iteration 8: wizard mobile fit, photo adjust/blend, cover pill, meals)
- Wizard on phones: progress bar "Step N of 7" plus a step dropdown (tabs only at >=640px); host grids use minmax(0,1fr), 16px padding, no sideways scroll; swatches and font picker wrap
- Photos: PhotoAdjust dialog (shapes full/portrait/square/wide/arch/circle, drag, pinch/slider zoom, Framed/Blended, live preview, FaceDetector focus when available); saved as card.photo_fit{hero,feature,wishes} and events[].photo_fit; cover photo defaults to full + blended (feathered mask + accent glow)
- Cover: safe top padding and `justify-content: safe center` (no clipped header); ornaments behind content; the pill shows date and time only; neutral "Together with their families" header localised for hi/ur and no longer duplicated by the eyebrow on couple cards; swipe hint moved to the bottom corner
- Meals per event (meal, meal_custom, meal_line): event page row, Google Calendar details, ICS description and WhatsApp og:description, localised en/hi/ur
- Tested: iteration_8, backend 137/138 (1 known flaky isolation test), frontend 100%; polish fixes from that report then applied

## Implemented (Iteration 9: hub + detail pages, one photo, fireworks) — 2026-06
- Swipe pages, dots, page-flip and auto-advance removed. Multi-event cards: cover hub (header line, photo if placed, invitation title, 3-line names, message + family, editable heading card.hub_heading defaulting to "{Occasion} celebrations" en/hi/ur, one coloured tile per event in date order, then wishes, compliments and Replay once). Event pages with their own colour scheme, sticky "← All events" bar, Previous / Next: {event} / Back to all events / Send wishes ↓
- Real URLs: /i/{slug} (cover) and /i/{slug}/{event_id}, ?to= and ?g= kept, browser Back works, cover scroll restored; 260ms slide/fade (fade off under reduced motion). Single-event cards skip the hub
- Share /api/s/{slug}/cover redirects to the cover; link maker "All events (cover)"; guest links with 2+ invited events use the cover
- Wider than 600px: centred 430px column, full height
- One photo per card: photos[0] + photo_fit.hero + photo_place (cover | intro | event:{id} | wishes). Older cards: the first existing photo becomes the cover photo, others stay saved (mainPhoto in card/CardPhoto.jsx). Wizard Photos step: single slot, "Show this photo on:" select (jumps the live preview), "Skip photo for now"; deleting the placed event moves it to the cover with a toast
- Fireworks canvas (card/Fireworks.jsx): accent colours, burst every 1.5-3s, max 3 bursts / 60-120 particles by intensity, fps < 40 lowers particles, stops on hidden tab, static sparkle under reduced motion. Vibration (card/useVibration.js): after first tap, 25ms pulses on big bursts, max 1 per 3s, stronger pattern on open, paused while typing. Effects button next to music (localStorage daawat-fx-{slug}). Wizard Template step: Fireworks / Vibration (follows Fireworks) / Intensity; card.effects defaults on/on/medium for every occasion
- Leftover RSVP copy removed from landing/wizard/dashboard strings
- Tested: iteration_9, backend 158/158, frontend 100%; contrast fix for "View details" applied afterwards

## Implemented (Iteration 10: timeline cover, welcome screen, scratch date) — 2026-06
- Event pages: duplicate blessing (Bismillah) removed; meal shown as a plain line + dress code + note merged into the event box
- Full Welcome screen after the intro (card/WelcomeScreen.jsx): "Welcome", guest name, host note card.welcome_text (wizard Details step, default per language), "Open the invitation"
- Scratch-to-reveal first event date on every template (card/ScratchDate.jsx): canvas scratch, reveals at ~45%, "Reveal the date" fallback, hidden again each visit; on the cover above the timeline and on single-event pages after the title
- Cover timeline (Hub.jsx Timeline): gold centre line, diamond markers, alternating entries (single column when the card is under 360px), whole entry tappable, Concluded / Next up tags, 280ms reveal. Original SVG line art per event kind (card/EventArt.jsx) + second-script names for Hindi/Urdu cards; card.timeline_art switch in the wizard Template step; large art at the top of each event page
- Self-tested with screenshots (welcome, scratch, timeline at 412 and 340px, event page). Backend pytest 164/165 (1 flaky guest-dedupe test passes on its own). The full testing_agent run was cut off and has NOT verified this iteration

## Implemented (Iteration 11: Google-only login, legal pages, contact, style gallery) — 2026-10
- Wizard "Custom header line (optional)" box collapses (auto-opens when it has text, "Using custom line" badge)
- Date once: chip under names removed; scratch box reveals "Weekday, D Month YYYY · time"
- Login: Google only (Emergent-managed) via AuthContext.login(next); phone/OTP removed (otp_providers.py deleted, otp_codes dropped); sessions 400 days; ADMIN_EMAIL=info.daawatcards@gmail.com gets is_admin; former phone-account cards moved to the admin (on admin login + startup)
- Landing "Choose your style": all TEMPLATE_LIST tiles (scroll-snap, arrows on desktop), static previews /public/templates/{id}.jpg (gradient fallback for new templates), preview modal, "Use this style" → Google login → /create?template=id
- /terms, /privacy, /refund, /pricing (text in backend/site_api.py DEFAULTS, editable in /admin Settings, {company}/{address}/{email} placeholders), footer on public pages; AgreeTerms checkbox before first publish (wizard + card detail); backend 422 without agreed_terms
- /contact: company, mailto, address, hours, call-back form (Indian mobile validation, honeypot + 2.5s timing, 3/number/day + 10/IP/day), saved to db.callbacks, admin Support list, Gmail SMTP alert via mailer.py (GMAIL_USER, GMAIL_APP_PASSWORD)
- Tested: iteration_11 (backend 186/187 + fixes: card-detail publish, inert, toast, labels, gallery label strip)
- Pending: payment checkbox (payments not built yet); Gmail keys

## Implemented (Iteration 12: plans, mock Razorpay, admin dashboard) — 2026-10
- Plans per card: free | paid | paid_without_payment (backend/billing.py effective_plan, guest_limit). New cards free; pre-existing cards migrated to paid_without_payment "launch grant" (migrate_plans at startup). Free: max free_guest_limit guests (402 on bulk add), watermark flag on public card JSON + corner on OG image; card/Watermark.jsx diagonal text + banner (pointer-events none)
- Payments (PAYMENT_MODE=mock|test|live, default mock = MOCKED): server order (11682 paise), mock sheet / Razorpay checkout.js, HMAC verify, /api/webhooks/razorpay (raw-body signature, amount check, idempotent), payments collection with mode, invoice numbers DW-YYYY-NNNNN, receipt page + PDF (PIL). Keys: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
- UI: plan badges + Upgrade (dashboard, guest list "x / 2 guests used", wizard publish), /cards/:id/upgrade, /receipt/:orderId, PlansTable on pricing
- Admin /admin tabs: overview, users (account grant/revoke), cards (grant/revoke/disable/delete), free-card events, revenue (mock excluded, CSV), support (new/called/closed + notes), settings (price, GST, free limit, GSTIN, grievance, extra admin emails), audit log
- Landing hero demo buttons removed; welcome screen renders under intro (no cover flash)
- Tested: iteration_12 (25/25 plan/billing tests after fixes)
- Round 2 (next): admin email+password login (hashed, lockout, optional 2FA, one-time setup), design-preference charts; update 5 older regression tests that assume unlimited guests; Gmail app password (16 letters) still needed



- P0 Phase 2: guest list (manual / paste / CSV / contacts), unique per-guest links, bulk WhatsApp share, open tracking, full RSVP dashboard + CSV export, remaining templates (Modern Minimal, Engagement, Pastel Aqiqah/Baby Shower with lullaby, Housewarming, Corporate), Hindi + Urdu (RTL)
- P1 Phase 3: Razorpay one-time per-card Standard/Premium, Free plan gating (1 card, watermark, 25 guests), remaining event types, real SMS OTP provider

## Implemented (Iteration 13-15: one text per slot) — 2026-10
- lib/textSlots.js: occasionName (single event name, "Aqiqah" → "Aqiqah Ceremony"; multi → type), displayTitle (old default titles count as unset), invitationParagraph (host text OR tradition default, never both), closingText/cardDua (card-level, once), cardSlots + slotOverlaps with KEY_PHRASES
- Guest card: intro = title + "Specially for {guest}" only; welcome "Welcome to the {occasion} of {names}" (couples joined with &), note optional/empty default; one paragraph → blessing → dua under it; closing once at the end; event pages show only wording the host wrote for that event
- Wizard: empty Card title / Invitation message by default (placeholders show what's used), "This wording is already used in {field}" warnings, "Text on your card" summary (Details step) incl. Family line
- Defaults de-duplicated (Hindu paragraph, Christian closing, neutral wedding blessing); OG image uses the occasion name
- Tested: iteration_15 100%
- Known (pre-existing, not changed): blessing choice does not follow a tradition switch

- See Round 2 above; P1 real Razorpay keys (PAYMENT_MODE=test/live)

## Implemented (Iteration 16: blessing follows tradition, Razorpay test mode) — 2026-06
- Blessing now follows the tradition: Wizard onTradition maps tradition→blessing_key (muslim→islamic, hindu→hindu, sikh/christian/neutral→neutral) when the key exists in that occasion's blessingOptions; a host's "custom" blessing is left untouched; corporate/birthday unaffected (no matching option). Fixes a Hindu card keeping Bismillah after switching from Muslim. (frontend/src/pages/Wizard.jsx)
- Razorpay switched from mock to real TEST mode: PAYMENT_MODE="test"; RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET stored via secure secrets (rzp_test_...). Verified: real order creation against api.razorpay.com returns 200 (order_...). Existing backend order/verify/webhook + frontend checkout.js flow already supported test/live; no code change needed. RAZORPAY_WEBHOOK_SECRET optional (only for dashboard webhooks).
- NOTE for production: preview .env now has PAYMENT_MODE=test; set PAYMENT_MODE (and Razorpay keys) in the production/live secret slot before go-live.

## Backlog
- Round 2: admin password login + 2FA, design-preference charts; Gmail app password
- Go-live: switch PAYMENT_MODE to live + add live Razorpay keys; optional Razorpay webhook secret
