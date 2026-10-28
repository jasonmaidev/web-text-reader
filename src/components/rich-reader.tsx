"use client";

import { useImperativeHandle, type Ref } from "react";
import { EditorContent, Extension, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { DOMParser as EditorDOMParser } from "@tiptap/pm/model";
import { closeHistory } from "@tiptap/pm/history";
import DOMPurify from "dompurify";

const Indentation = Extension.create({
  name: "indentation",
  addGlobalAttributes() {
    return [{
      types: ["paragraph", "heading"],
      attributes: {
        indent: {
          default: 0,
          parseHTML: element => {
            const value = element.style.marginLeft || element.style.paddingLeft || element.style.textIndent;
            const match = value.match(/^(\d+(?:\.\d+)?)(px|pt|em|rem)$/);
            if (!match) return 0;
            const amount = Number(match[1]) / (match[2] === "px" ? 16 : match[2] === "pt" ? 12 : 1);
            return Math.min(20, amount);
          },
          renderHTML: attributes => attributes.indent ? { style: `margin-left: ${attributes.indent}em` } : {},
        },
      },
    }];
  },
});

// Keep visible list markers and nested indentation when removing rich formatting.
function plainText(node: JSONContent, depth = 0): string {
  if (node.type === "text") return node.text || "";
  if (node.type === "hardBreak") return "\n";
  const children = node.content || [];
  if (node.type === "bulletList" || node.type === "orderedList") {
    return children.map((item, index) => {
      const marker = node.type === "bulletList" ? "•" : `${(node.attrs?.start ?? 1) + index}.`;
      return (item.content || []).map((child, childIndex) => {
        if (child.type === "bulletList" || child.type === "orderedList") return plainText(child, depth + 1);
        return `${"  ".repeat(depth)}${childIndex === 0 ? `${marker} ` : "  "}${plainText(child, depth)}`;
      }).join("\n");
    }).join("\n");
  }
  const inline = ["paragraph", "heading", "codeBlock"].includes(node.type || "");
  const separator = inline ? "" : node.type === "tableRow" ? "\t" : "\n";
  const content = children.map(child => plainText(child, depth)).join(separator);
  const indent = inline && node.attrs?.indent ? "  ".repeat(Math.ceil(node.attrs.indent)) : "";
  return indent + content;
}

export type RichReaderHandle = { clearFormatting: () => void };

export function RichReader({ ref, fontSize, fontFamily, onChange }: { ref: Ref<RichReaderHandle>; fontSize: number; fontFamily: string; onChange: (text: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: false }, trailingNode: false }),
      TableKit,
      Indentation,
    ],
    editorProps: {
      attributes: {
        id: "reader",
        class: "reader-editor",
        role: "textbox",
        "aria-label": "Your reading text",
        "aria-multiline": "true",
        "aria-placeholder": "Paste your text here…",
        "data-placeholder": "Paste your text here…",
        spellcheck: "false",
        autocapitalize: "off",
      },
      handlePaste(view, event) {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;
        event.preventDefault();
        const html = clipboard.getData("text/html");
        if (html) {
          const clean = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ["p", "div", "span", "br", "strong", "b", "em", "i", "u", "s", "strike", "del", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "a", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "hr"],
            ALLOWED_ATTR: ["href", "start", "colspan", "rowspan", "style"],
          });
          const container = document.createElement("div");
          container.innerHTML = clean;
          const slice = EditorDOMParser.fromSchema(view.state.schema).parseSlice(container, { preserveWhitespace: true });
          if (slice.content.size) {
            view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView());
            return true;
          }
        }
        const text = clipboard.getData("text/plain").replace(/\r\n?/g, "\n");
        if (text) view.dispatch(view.state.tr.insertText(text).scrollIntoView());
        return true;
      },
      // Match clipboard behavior for dragged rich text as well.
      transformPastedHTML: html => DOMPurify.sanitize(html),
    },
    onUpdate: ({ editor }) => onChange(plainText(editor.getJSON())),
  });

  useImperativeHandle(ref, () => ({
    clearFormatting() {
      if (!editor) return;
      const text = plainText(editor.getJSON());
      // Keep clear-formatting separate from the preceding paste in undo history.
      editor.view.dispatch(closeHistory(editor.state.tr));
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }],
      });
      editor.commands.focus("end");
    },
  }), [editor]);

  return <EditorContent editor={editor} className="rich-reader" style={{ fontSize: `${fontSize}px`, fontFamily }} />;
}
