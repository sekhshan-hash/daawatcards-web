import { Fragment } from "react";
import { useScriptFont } from "@/lib/script";

const TOKEN_RE = /(\{occasion\}|\{names\}|\{date\})/g;

// A single {occasion}/{names} value: larger, bold, heading font and accent colour, in a fitting script font.
const TokenSpan = ({ value, testId }) => {
  const sf = useScriptFont(value);
  return (
    <span className="gc-token" dir={sf.dir || "auto"} data-testid={testId}
      style={sf.fontFamily ? { fontFamily: `var(--font-display), ${sf.fontFamily}` } : undefined}>{value}</span>
  );
};

// Host text that keeps its line breaks (pressing Enter makes a real line break) and styles the tokens.
export const TokenText = ({ as: Tag = "p", text, occasion, names, dateNode, className = "", testId }) => {
  const sf = useScriptFont(text);
  const parts = (text || "").split(TOKEN_RE);
  return (
    <Tag className={`${className} gc-prewrap`} dir={sf.dir || "auto"} data-testid={testId}
      style={sf.fontFamily ? { fontFamily: sf.fontFamily } : undefined}>
      {parts.map((p, i) => {
        if (p === "{occasion}") return <TokenSpan key={i} value={occasion} testId="card-token-occasion" />;
        if (p === "{names}") return <TokenSpan key={i} value={names} testId="card-token-names" />;
        if (p === "{date}") return <Fragment key={i}>{dateNode}</Fragment>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </Tag>
  );
};

// Plain host text in a fitting script font, keeping line breaks.
export const ScriptText = ({ as: Tag = "p", text, className = "", preserveLines = true, testId, ...rest }) => {
  const sf = useScriptFont(text);
  return (
    <Tag className={`${className}${preserveLines ? " gc-prewrap" : ""}`} dir={sf.dir || "auto"} data-testid={testId}
      style={sf.fontFamily ? { fontFamily: sf.fontFamily } : undefined} {...rest}>{text}</Tag>
  );
};
