// Full welcome screen shown right after the intro, before the card.
import { welcomeGreeting, welcomeSalutation } from "@/lib/textSlots";
import { WelcomeDateNote } from "./WelcomeDateNote";

export const WelcomeScreen = ({ card, t, tpl, onContinue, preview, effects, reduced }) => {
  const TplFrame = tpl.Frame;
  const salutation = welcomeSalutation(card);
  const greeting = welcomeGreeting(card);
  return (
    <div className="gc-welcome" data-testid="welcome-screen">
      <TplFrame />
      <div className="gc-welcome-inner">
        {salutation && <p className="gc-welcome-salutation" dir="auto" data-testid="welcome-salutation">{salutation}</p>}
        {greeting && <p className="gc-welcome-greeting" dir="auto" data-testid="welcome-greeting">{greeting}</p>}
        <WelcomeDateNote card={card} t={t} preview={preview} effects={effects} reduced={reduced} />
        <button type="button" className="gc-btn" onClick={onContinue} data-testid="welcome-continue-button">{t("guest.openInvitation")}</button>
      </div>
    </div>
  );
};
