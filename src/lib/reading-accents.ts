import { Extension } from "@tiptap/react";
import type { Node as EditorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const accentsKey = new PluginKey<DecorationSet>("readingAccents");

function decorationsFor(doc: EditorNode) {
  const decorations: Decoration[] = [];
  doc.descendants((block, position) => {
    if (block.type.name === "codeBlock") return false;
    if (!block.isTextblock) return;

    const text = block.textBetween(0, block.content.size, "\n", "\n");
    // Match straight/curly quotation pairs, without treating contractions as quotes.
    const quotes = /"(?:[^"\\\n]|\\.)+"|“[^”\n]+”|(?<![\p{L}\p{N}])'(?:[^'\\\n]|\\.|(?<=\p{L})'(?=\p{L}))+'(?![\p{L}\p{N}])|‘(?:[^’\n]|(?<=\p{L})’(?=\p{L}))+’(?!\p{L})/gu;
    for (const match of text.matchAll(quotes)) {
      const start = match.index;
      const end = start + match[0].length;
      // Intersect with actual text nodes so inline code never acquires prose accents.
      block.forEach((child, offset) => {
        if (!child.isText || child.marks.some(mark => mark.type.name === "code")) return;
        const from = Math.max(start, offset);
        const to = Math.min(end, offset + child.nodeSize);
        if (from < to) decorations.push(Decoration.inline(position + 1 + from, position + 1 + to, { class: "reader-quotation" }));
      });
    }

    let boldStart: number | null = null;
    let boldEnd = 0;
    function finishBold() {
      if (boldStart === null) return;
      const label = text.slice(boldStart, boldEnd);
      const following = text.slice(boldEnd);
      const startsParagraph = block.type.name === "paragraph" && text.slice(0, boldStart).trim() === "";
      // Paragraph-leading bold acts as a title, with or without punctuation.
      if (startsParagraph || /:\s*$/.test(label) || /^\s*:/.test(following)) {
        decorations.push(Decoration.inline(position + 1 + boldStart, position + 1 + boldEnd, { class: "reader-label" }));
      }
      boldStart = null;
    }
    block.forEach((child, offset) => {
      const bold = child.isText && child.marks.some(mark => mark.type.name === "bold") && !child.marks.some(mark => mark.type.name === "code");
      if (bold) {
        boldStart ??= offset;
        boldEnd = offset + child.nodeSize;
      } else finishBold();
    });
    finishBold();
    return false;
  });
  return DecorationSet.create(doc, decorations);
}

// Decorations affect presentation only: pasted content, editing and undo stay intact.
export const ReadingAccents = Extension.create({
  name: "readingAccents",
  addProseMirrorPlugins() {
    return [new Plugin<DecorationSet>({
      key: accentsKey,
      state: {
        init: (_, state) => decorationsFor(state.doc),
        apply: (transaction, previous) => transaction.docChanged ? decorationsFor(transaction.doc) : previous,
      },
      props: { decorations: state => accentsKey.getState(state) },
    })];
  },
});
