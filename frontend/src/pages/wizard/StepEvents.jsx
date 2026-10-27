import { Plus, Trash2, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getTemplate } from "@/templates/registry";
import { SCHEME_IDS, autoScheme, schemeSwatch } from "@/templates/eventColors";
import { Field, StepTitle } from "./Steps";
import { WordingEditor } from "./WordingEditor";
import { MEALS, mealLine } from "@/lib/meals";
import { weddingSuggestions } from "@/i18n/traditions";
import { t, makeT } from "@/i18n";

export const blankEvent = (name, id) => ({
  event_id: id, name, date: "", time: "18:00", end_time: "", venue_name: "", venue_address: "", map_link: "", dress_code: "", custom_text: "", photo: "", color: "",
  header_hidden: false, wording: null, dua: null, closing: null, concluded: null, rsvp_line: "", meal: "none", meal_custom: "", meal_line: "",
});

const nextId = (events) => `e${Math.max(0, ...events.map((e) => parseInt(e.event_id.slice(1), 10) || 0)) + 1}`;

const ColorPicker = ({ ev, index, tpl, onChange }) => {
  const value = ev.color || "";
  const auto = autoScheme(ev.name);
  const Swatch = ({ id, label }) => {
    const [bg, accent] = schemeSwatch(tpl, id === "" ? auto : id);
    const active = value === id;
    return (
      <button type="button" onClick={() => onChange({ color: id })} title={label} aria-label={label} aria-pressed={active} data-testid={`wizard-event-${index}-color-${id || "auto"}`}
        className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform hover:scale-110 ${active ? "ring-2 ring-gold ring-offset-2 ring-offset-background" : "ring-1 ring-border"}`}
        style={{ background: `linear-gradient(135deg, ${bg} 50%, ${accent} 50%)` }}>
        {id === "" && <Wand2 size={14} className="text-white drop-shadow" />}
      </button>
    );
  };
  return (
    <Field label={t("wizard.eventColor")} hint={value === "" ? t("wizard.colorAutoHint", { name: t(`colors.${auto}`) }) : t(`colors.${value}`)}>
      <div className="flex flex-wrap gap-2.5 py-1.5" data-testid={`wizard-event-${index}-colors`}>
        <Swatch id="" label={t("colors.auto")} />
        <Swatch id="template" label={t("colors.template")} />
        {SCHEME_IDS.map((id) => <Swatch key={id} id={id} label={t(`colors.${id}`)} />)}
      </div>
    </Field>
  );
};

const MealField = ({ ev, index, lang, onChange }) => {
  const ct = makeT(lang);
  const meal = ev.meal || "none";
  const line = mealLine(ev, ct);
  return (
    <Field label={t("wizard.meal")}>
      <div className="space-y-2" data-testid={`wizard-event-${index}-meal`}>
        <select value={meal} onChange={(e) => onChange({ meal: e.target.value })} className="field-select h-12 w-full" data-testid={`wizard-event-${index}-meal-select`}>
          {MEALS.map((m) => <option key={m} value={m}>{t(`meals.${m}`)}</option>)}
        </select>
        {meal === "custom" && (
          <Input className="h-12 rounded-xl text-base" maxLength={60} value={ev.meal_custom || ""} onChange={(e) => onChange({ meal_custom: e.target.value })}
            placeholder={t("wizard.mealCustom")} data-testid={`wizard-event-${index}-meal-custom-input`} />
        )}
        {meal !== "none" && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t("wizard.mealLine")}</p>
            <Input className="h-12 rounded-xl text-base" maxLength={140} dir="auto" value={ev.meal_line || line}
              onChange={(e) => onChange({ meal_line: e.target.value === mealLine({ ...ev, meal_line: "" }, ct) ? "" : e.target.value })} data-testid={`wizard-event-${index}-meal-line-input`} />
          </div>
        )}
      </div>
    </Field>
  );
};

const EventEditor = ({ ev, index, eventType, lang, tpl, multi, card, onChange, onRemove, canRemove }) => {
  const L = t("wizard.labels");
  const bind = (key, type = "text") => ({ type, value: ev[key] || "", onChange: (e) => onChange({ [key]: e.target.value }), "data-testid": `wizard-event-${index}-${key.replace(/_/g, "-")}-input`, dir: "auto" });
  return (
    <div className="rounded-2xl border border-border bg-card p-5" data-testid={`wizard-event-${index}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-gold">/{ev.event_id}</span>
        {canRemove && <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-xs text-rose" data-testid={`wizard-event-${index}-remove-button`}><Trash2 size={13} /> {t("wizard.removeEvent")}</button>}
      </div>
      <div className="grid gap-4">
        <Field label={L.eventName}>
          <Input className="h-12 rounded-xl text-base" maxLength={60} {...bind("name")} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {((eventType === "wedding" && weddingSuggestions(card)) || makeT(lang)(`eventSuggestions.${eventType}`)).map((s) => (
              <button key={s} type="button" onClick={() => onChange({ name: s })} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-gold/50 hover:text-foreground">{s}</button>
            ))}
          </div>
        </Field>
        {multi && <ColorPicker ev={ev} index={index} tpl={tpl} onChange={onChange} />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={L.date}><Input className="h-12 rounded-xl text-base" {...bind("date", "date")} /></Field>
          <Field label={L.time}><Input className="h-12 rounded-xl text-base" {...bind("time", "time")} /></Field>
          <Field label={`${L.endTime} (${L.optional})`}><Input className="h-12 rounded-xl text-base" {...bind("end_time", "time")} /></Field>
        </div>
        <Field label={L.venue}><Input className="h-12 rounded-xl text-base" maxLength={120} {...bind("venue_name")} /></Field>
        <Field label={L.address}><Input className="h-12 rounded-xl text-base" maxLength={300} {...bind("venue_address")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${L.mapLink} (${L.optional})`}><Input className="h-12 rounded-xl text-base" placeholder="https://maps.app.goo.gl/…" maxLength={500} {...bind("map_link", "url")} /></Field>
          <Field label={`${L.dress} (${L.optional})`}><Input className="h-12 rounded-xl text-base" maxLength={120} {...bind("dress_code")} /></Field>
        </div>
        <MealField ev={ev} index={index} lang={lang} onChange={onChange} />
        <Field label={`${L.custom} (${L.optional})`}><Textarea className="rounded-xl text-base" maxLength={1000} {...bind("custom_text")} /></Field>
        <WordingEditor card={card} ev={ev} index={index} onChange={onChange} />
      </div>
    </div>
  );
};

export const StepEvents = ({ card, update }) => {
  const setEvent = (i, patch) => update({ events: card.events.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const add = () => update({ events: [...card.events, blankEvent("", nextId(card.events))] });
  const remove = (i) => update({ events: card.events.filter((_, j) => j !== i) });
  return (
    <>
      <StepTitle hint={t("wizard.eventsHint")}>{t("wizard.eventsTitle")}</StepTitle>
      <p className="mb-5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold" data-testid="wizard-wording-check-events">{t("wizard.wordingCheck")}</p>
      <div className="space-y-4">
        {card.events.map((ev, i) => (
          <EventEditor key={ev.event_id} ev={ev} index={i} eventType={card.event_type} lang={card.language} canRemove={card.events.length > 1}
            tpl={getTemplate(card.template)} multi={card.events.length > 1} card={card}
            onChange={(p) => setEvent(i, p)} onRemove={() => remove(i)} />
        ))}
      </div>
      {card.events.length < 10 && (
        <button type="button" onClick={add} className="btn-outline mt-5" data-testid="wizard-add-event-button"><Plus size={16} /> {t("wizard.addEvent")}</button>
      )}
    </>
  );
};
