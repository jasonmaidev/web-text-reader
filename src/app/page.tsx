"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Moon, Plus, ShieldCheck, SlidersHorizontal, Sun, Type, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RichReader, type RichReaderHandle } from "@/components/rich-reader";

const MIN_FONT = 12;
const MAX_FONT = 36;

export default function Home() {
  const readerRef = useRef<RichReaderHandle>(null);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(17);
  const [width, setWidth] = useState(100);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("readspace-preferences") || "null");
      if (saved) {
        if (Number.isFinite(saved.fontSize)) setFontSize(Math.min(MAX_FONT, Math.max(MIN_FONT, saved.fontSize)));
        if (Number.isFinite(saved.width)) setWidth(Math.min(100, Math.max(50, saved.width)));
        if (saved.theme === "dark" || saved.theme === "light") setTheme(saved.theme);
      }
    } catch { /* The reader also works when browser storage is unavailable. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("readspace-preferences", JSON.stringify({ fontSize, width, theme })); } catch { /* Preferences are optional. */ }
  }, [fontSize, width, theme, loaded]);

  const wordCount = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const widthLabel = width < 65 ? "Narrow" : width > 90 ? "Wide" : "Comfortable";

  return (
    <div className="app-shell">
      <main className="canvas-container" aria-label="Reading workspace">
        <div className="reading-canvas" style={{ width: `${width}%` }}>
          <RichReader ref={readerRef} fontSize={fontSize} onChange={setText} />
        </div>
      </main>

      <aside className="controls" aria-label="Reading preferences">
        <div className="tools-heading"><SlidersHorizontal size={17} /><span>Reading tools</span></div>
        <div className="control-section font-control">
          <div className="control-heading"><Type size={15} /><span>Text size</span></div>
          <div className="font-actions">
            <Button variant="outline" size="icon" aria-label="Decrease text size" disabled={fontSize <= MIN_FONT} onClick={() => setFontSize(size => Math.max(MIN_FONT, size - 1))}><Minus /></Button>
            <output aria-label="Current text size">{fontSize}<span>px</span></output>
            <Button variant="outline" size="icon" aria-label="Increase text size" disabled={fontSize >= MAX_FONT} onClick={() => setFontSize(size => Math.min(MAX_FONT, size + 1))}><Plus /></Button>
          </div>
        </div>

        <div className="control-section width-control">
          <div className="control-heading"><Maximize2 size={14} /><span>Reading width</span></div>
          <Slider aria-label="Reading width" min={50} max={100} step={1} value={[width]} onValueChange={value => setWidth(value[0])} />
          <output className="width-label">{widthLabel}<span>{width}%</span></output>
        </div>

        <div className="control-section theme-control">
          <div className="control-heading"><Sun size={15} /><span>Appearance</span></div>
          <div className="theme-switch" role="group" aria-label="Appearance">
            <Button variant="ghost" size="sm" aria-label="Light" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Sun /><span>Light</span></Button>
            <Button variant="ghost" size="sm" aria-label="Dark" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Moon /><span>Dark</span></Button>
          </div>
        </div>

        <div className="control-section formatting-control">
          <Button variant="outline" className="clear-formatting" aria-label="Clear formatting" title="Convert all content to plain text" disabled={!text} onClick={() => readerRef.current?.clearFormatting()}>
            <RemoveFormatting /><span>Clear formatting</span>
          </Button>
        </div>

        <div className="sidebar-details">
          <div className="text-stats">
            <span>{wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}</span>
            <span>{text.length.toLocaleString()} {text.length === 1 ? "character" : "characters"}</span>
          </div>
          <p className="privacy-note"><ShieldCheck size={14} /><span>Your text stays on this page. Never uploaded or saved.</span></p>
        </div>
      </aside>
    </div>
  );
}
