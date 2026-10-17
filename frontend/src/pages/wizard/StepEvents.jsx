import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, StepTitle } from "./Steps";
import { t } from "@/i18n";

export const blankEvent = (name, id) => ({
  event_id: id, name, date: "", time: "18:00", end_time: "", venue_name: "", venue_address: "", map_link: "", dress_code: "", custom_text: "",
});

const nextId = (events) => `e${Math.max(0, ...events.map((e) => parseInt(e.event_id.slice(1), 10) || 0)) + 1}`;

const EventEditor = ({ ev, index, eventType, onChange, onRemove, canRemove }) => {
  const L = t("wizard.labels");
  const bind = (key, type = "text") => ({ type, value: ev[key] || "", onChange: (e) => onChange({ [key]: e.target.value }), "data-testid": `wizard-event-${index}-${key.replace(/_/g, "-")}-input` });
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
            {t(`eventSuggestions.${eventType}`).map((s) => (
              <button key={s} type="button" onClick={() => onChange({ name: s })} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-gold/50 hover:text-foreground">{s}</button>
            ))}
          </div>
        </Field>
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
        <Field label={`${L.custom} (${L.optional})`}><Textarea className="rounded-xl text-base" maxLength={1000} {...bind("custom_text")} /></Field>
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
      <div className="space-y-4">
        {card.events.map((ev, i) => (
          <EventEditor key={ev.event_id} ev={ev} index={i} eventType={card.event_type} canRemove={card.events.length > 1}
            onChange={(p) => setEvent(i, p)} onRemove={() => remove(i)} />
        ))}
      </div>
      {card.events.length < 10 && (
        <button type="button" onClick={add} className="btn-outline mt-5" data-testid="wizard-add-event-button"><Plus size={16} /> {t("wizard.addEvent")}</button>
      )}
    </>
  );
};
