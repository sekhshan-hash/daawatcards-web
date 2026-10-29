// Full welcome screen shown right after the intro, before the card.
import { occasionName, welcomeNames } from "@/lib/textSlots";

export const WelcomeScreen = ({ card, name, t, tpl, onContinue }) => {
  const TplFrame = tpl.Frame;
  return (
    <div className="gc-welcome" data-testid="welcome-screen">
      <TplFrame />
      <div className="gc-welcome-inner">
        <p className="gc-welcome-title" dir="auto" data-testid="welcome-title">
          {t("guest.welcomeTo", { occasion: occasionName(card), names: welcomeNames(card) })}
        </p>
        <p className="gc-welcome-name" dir="auto" data-testid="welcome-guest-name">{name}</p>
        {card.welcome_text?.trim() && <p className="gc-welcome-note" dir="auto" data-testid="welcome-note">{card.welcome_text.trim()}</p>}
        <button type="button" className="gc-btn" onClick={onContinue} data-testid="welcome-continue-button">{t("guest.openInvitation")}</button>
      </div>
    </div>
  );
};
