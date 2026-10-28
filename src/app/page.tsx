"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, BookOpen, Check, Maximize2, Minus, Moon, Plus, ShieldCheck, Sun, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const MIN_FONT = 12;
const MAX_FONT = 36;

export default function Home() {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(17);
  const [width, setWidth] = useState(84);
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
      <header className="site-header">
        <a className="brand" href="/" aria-label="Readspace home">
          <span className="brand-icon"><BookOpen size={21} strokeWidth={1.7} /></span>
          <span>readspace<span className="brand-period">.</span></span>
        </a>
        <div className="header-note"><span className="status-dot" /> A little less noise. A little more focus.</div>
        <span className="header-badge">YOUR EVERYDAY READING SPACE</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <div className="eyebrow"><span /> PASTE. ADJUST. EXHALE.</div>
          <h1 id="page-title">Your words. <em>A little more room.</em></h1>
          <p>A quiet place for long answers, loose thoughts, and lines of code.</p>
        </section>

        <section className="workspace" aria-label="Reading workspace">
          <div className="controls" aria-label="Reading preferences">
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
              <div className="width-actions">
                <span className="width-endpoint" aria-hidden="true">↔</span>
                <Slider aria-label="Reading width" min={50} max={100} step={1} value={[width]} onValueChange={value => setWidth(value[0])} />
                <output className="width-label">{widthLabel}</output>
              </div>
            </div>

            <div className="control-section theme-control">
              <div className="control-heading"><Sun size={15} /><span>Appearance</span></div>
              <div className="theme-switch" role="group" aria-label="Appearance">
                <Button variant="ghost" size="sm" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Sun />Light</Button>
                <Button variant="ghost" size="sm" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Moon />Dark</Button>
              </div>
            </div>
          </div>

          <div className="canvas-container">
            <div className="reading-canvas" style={{ width: `${width}%` }}>
              <div className="canvas-heading">
                <div><span className="canvas-dot" /><span>Your canvas</span></div>
                <span className="canvas-format">PLAIN TEXT, CLEAR MIND</span>
              </div>
              <div className="editor-body">
                <Textarea
                  id="reader"
                  aria-label="Your reading text"
                  value={text}
                  onChange={event => setText(event.target.value)}
                  placeholder={"Good ideas deserve a little breathing room.\n\nPaste your AI conversations, notes, or code here.\nMake the text bigger. Find your width. Settle in.\n\nThis space is yours."}
                  style={{ fontSize: `${fontSize}px` }}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                {!text && <div className="paste-hint" aria-hidden="true"><ArrowDownLeft size={16} /><span>Click anywhere above and paste to begin</span></div>}
              </div>
              <div className="canvas-footer">
                <span className="text-stats">{wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}<span className="stat-divider">/</span>{text.length.toLocaleString()} {text.length === 1 ? "character" : "characters"}</span>
                <span className="canvas-local"><Check size={13} /> Only on this page</span>
              </div>
            </div>
          </div>
          <div className="workspace-note"><ShieldCheck size={14} /><span>Just a space to read. Your text is never uploaded or saved.</span></div>
        </section>
      </main>

      <footer className="site-footer"><span>Made for a slower scroll.</span><span className="footer-mark"><BookOpen size={14} /> A small space. A clearer head.</span><span>Nothing to sign up for. Just read.</span></footer>
    </div>
  );
}
