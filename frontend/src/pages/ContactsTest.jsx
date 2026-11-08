import { useEffect, useState } from "react";

export default function ContactsTest() {
  const [out, setOut] = useState("Ready. Tap a button.");

  useEffect(() => {
    const onVis = () => {
      const line = `[${new Date().toISOString()}] visibilitychange -> ${document.visibilityState}`;
      setOut((p) => `${line}\n${p}`);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const openPicker = async () => {
    try {
      const list = await navigator.contacts.select(["name", "tel"], { multiple: true });
      setOut(
        JSON.stringify(
          {
            length: list.length,
            list,
            userAgent: navigator.userAgent,
            visibilityState: document.visibilityState,
          },
          null,
          2
        )
      );
    } catch (e) {
      setOut(`ERROR\nname: ${e && e.name}\nmessage: ${e && e.message}`);
    }
  };

  const showProps = async () => {
    try {
      const props = await navigator.contacts.getProperties();
      setOut(`getProperties():\n${JSON.stringify(props, null, 2)}`);
    } catch (e) {
      setOut(`getProperties ERROR\nname: ${e && e.name}\nmessage: ${e && e.message}`);
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16, maxWidth: 720, margin: "0 auto", color: "#111", background: "#fff", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Contact Picker Test</h1>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button type="button" onClick={openPicker} style={{ padding: "12px 16px", fontSize: 16, borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff" }}>
          Open contact picker
        </button>
        <button type="button" onClick={showProps} style={{ padding: "12px 16px", fontSize: 16, borderRadius: 8, border: "1px solid #333", background: "#eee", color: "#111" }}>
          Show getProperties()
        </button>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#f4f4f4", padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>{out}</pre>
    </div>
  );
}
