// Full welcome screen shown right after the intro, before the card.
import { occasionValue, namesValue, welcomeGreetingRaw, welcomeSalutationRaw } from "@/lib/textSlots";
import { ScriptText, TokenText } from "./TokenText";
import { WelcomeDateNote } from "./WelcomeDateNote";

export const WelcomeScreen = ({ card, t, tpl, onContinue, preview, effects, reduced }) => {
  const TplFrame = tpl.Frame;
  const salutation = welcomeSalutationRaw(card);
  const greeting = welcomeGreetingRaw(card);
  return (
    <div className="gc-welcome" data-testid="welcome-screen">
      <TplFrame />
      <div className="gc-welcome-inner">
        {salutation && <ScriptText as="p" className="gc-welcome-salutation" text={salutation} testId="welcome-salutation" />}
        {greeting && <TokenText as="p" className="gc-welcome-greeting" text={greeting} occasion={occasionValue(card)} names={namesValue(card)} testId="welcome-greeting" />}
        <WelcomeDateNote card={card} t={t} preview={preview} effects={effects} reduced={reduced} />
        <button type="button" className="gc-btn" onClick={onContinue} data-testid="welcome-continue-button">{t("guest.openInvitation")}</button>
      </div>
    </div>
  );
};
