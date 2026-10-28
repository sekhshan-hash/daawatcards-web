import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { TEMPLATE_LIST } from "@/templates/registry";
import { TemplatePreview } from "@/pages/wizard/TemplatePreview";
import { defaultCard } from "@/pages/Wizard";
import { useAuth } from "@/context/AuthContext";
import { t } from "@/i18n";

const Tile = ({ tpl, onOpen, onUse }) => {
  const [img, setImg] = useState(true);
  return (
    <div className="w-[68vw] max-w-[240px] shrink-0 snap-start sm:w-56" data-testid={`style-tile-${tpl.id}`}>
      <button type="button" onClick={() => onOpen(tpl.id)} className="group relative block aspect-[9/16] w-full overflow-hidden rounded-3xl border border-border text-left"
        style={{ background: `linear-gradient(160deg, ${tpl.swatch[1] || tpl.swatch[0]}, ${tpl.swatch[0]})` }} data-testid={`style-tile-${tpl.id}-open`}>
        {img && <img src={`/templates/${tpl.id}.jpg`} alt={t(`templates.${tpl.id}.name`)} loading="lazy" decoding="async" onError={() => setImg(false)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"><Eye size={16} /></span>
        <span className="absolute inset-x-0 bottom-0 p-4">
          <span className="block font-display text-xl text-white">{t(`templates.${tpl.id}.name`)}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {tpl.eventTypes.map((e) => <span key={e} className="rounded-full border border-white/30 bg-black/30 px-2.5 py-0.5 text-[11px] text-white/90">{t(`eventTypes.${e}`)}</span>)}
          </span>
        </span>
      </button>
      <button type="button" onClick={() => onUse(tpl.id)} className="btn-outline mt-3 w-full justify-center" data-testid={`style-tile-${tpl.id}-use`}>{t("site.useStyle")}</button>
    </div>
  );
};

export const StyleGallery = () => {
  const row = useRef(null);
  const [open, setOpen] = useState(null);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const use = (id) => {
    const next = `/create?template=${id}`;
    if (user) navigate(next);
    else login(next);
  };
  const scroll = (dir) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: "smooth" });
  const base = open && defaultCard(TEMPLATE_LIST.find((x) => x.id === open).eventTypes[0], "en", "neutral", open);
  return (
    <section className="mx-auto max-w-6xl px-5 py-20" data-testid="style-gallery">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">{t("site.chooseStyle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("site.chooseStyleHint")}</p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button type="button" onClick={() => scroll(-1)} aria-label={t("site.prev")} className="grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-secondary" data-testid="style-gallery-prev"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={t("site.next")} className="grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-secondary" data-testid="style-gallery-next"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div ref={row} className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:thin]" data-testid="style-gallery-row">
        {TEMPLATE_LIST.map((tpl) => <Tile key={tpl.id} tpl={tpl} onOpen={setOpen} onUse={use} />)}
      </div>
      {open && <TemplatePreview tplId={open} card={base} onClose={() => setOpen(null)} onUse={use} />}
    </section>
  );
};
