"use client";

import { cn } from "@/lib/utils";
import { useMemo, useSyncExternalStore } from "react";

/*
 * Read-only rendering of the HTML that `RichTextEditor` (TipTap) produces.
 *
 * Deliberately free of any TipTap/ProseMirror import: a page that only SHOWS
 * rich text (the event drawer) must not download the editor (~124 KB gz).
 *
 * The HTML is user-controlled and shown to OTHER users — event notes are
 * written by a manager and read by every attendee, admins included — and the
 * API stores whatever string it is sent. It therefore never reaches the DOM
 * as received: it is rebuilt from an allowlist, so anything the editor itself
 * could not have produced (scripts, event-handler attributes, `javascript:`
 * links, iframes, inline styles…) is dropped.
 */

/** Exactly the elements TipTap's StarterKit + Link extensions render. */
const ALLOWED_TAGS = new Set([
    "p",
    "br",
    "strong",
    "em",
    "s",
    "u",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
]);

const VOID_TAGS = new Set(["br", "hr"]);

/**
 * Elements whose content is code or foreign markup, not prose: removed
 * together with their children. Every other disallowed element (div, span,
 * img, …) is unwrapped — the element goes, its text stays.
 */
const DROPPED_WITH_CONTENT = new Set([
    "script",
    "style",
    "template",
    "noscript",
    "noembed",
    "noframes",
    "iframe",
    "frame",
    "frameset",
    "object",
    "embed",
    "applet",
    "svg",
    "math",
    "textarea",
    "select",
    "title",
    "xmp",
]);

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

const ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

const escapeHtml = (text: string) =>
    text.replace(/[&<>"']/g, (char) => ESCAPES[char]);

const NAMED_ENTITIES: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    "#39": "'",
};

/**
 * An absolute http(s)/mailto URL, normalised — or null. Relative and
 * scheme-less values are rejected along with `javascript:`/`data:`: the URL
 * parser also strips the whitespace and control characters that are used to
 * smuggle a scheme past naive string checks.
 */
const safeHref = (raw: string | null): string | null => {
    if (!raw) return null;
    try {
        const url = new URL(raw.trim());
        return SAFE_LINK_PROTOCOLS.has(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
};

/**
 * Re-serialises the parsed tree from scratch. Only tag names from the
 * allowlist and escaped text are ever emitted, and the one attribute that
 * survives (`href` on links) is validated and escaped — nothing from the
 * input's markup is copied through verbatim.
 */
const serializeChildren = (parent: Node, out: string[]) => {
    parent.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            out.push(escapeHtml(node.textContent ?? ""));
            return;
        }
        // Comments, CDATA and processing instructions are dropped.
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const element = node as Element;
        const tag = element.localName;
        if (DROPPED_WITH_CONTENT.has(tag)) return;
        if (!ALLOWED_TAGS.has(tag)) {
            serializeChildren(element, out);
            return;
        }

        if (tag === "a") {
            const href = safeHref(element.getAttribute("href"));
            if (!href) {
                serializeChildren(element, out);
                return;
            }
            out.push(
                `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">`,
            );
            serializeChildren(element, out);
            out.push("</a>");
            return;
        }

        if (VOID_TAGS.has(tag)) {
            out.push(`<${tag}>`);
            return;
        }

        out.push(`<${tag}>`);
        serializeChildren(element, out);
        out.push(`</${tag}>`);
    });
};

/**
 * The text of a rich-text HTML string, without markup — for environments
 * with no DOM to parse it (server rendering). The result is plain text, so
 * it must be rendered as text (React escapes it), never as HTML.
 */
export const richTextToPlainText = (html: string): string =>
    html
        .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|li|blockquote|pre|h[1-6])\s*>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, name: string) => NAMED_ENTITIES[name])
        .replace(/\n{3,}/g, "\n\n")
        .trim();

/**
 * Rich-text HTML reduced to what the editor can produce, safe to assign to
 * `innerHTML`. Without a DOM (server) it degrades to escaped plain text.
 */
export const sanitizeRichTextHtml = (html: string): string => {
    if (typeof DOMParser === "undefined") {
        return escapeHtml(richTextToPlainText(html));
    }
    try {
        // A DOMParser document is inert: nothing in it runs and nothing it
        // references is fetched, unlike markup assigned to a live element.
        const doc = new DOMParser().parseFromString(html, "text/html");
        const out: string[] = [];
        serializeChildren(doc.body, out);
        return out.join("");
    } catch {
        return escapeHtml(richTextToPlainText(html));
    }
};

const subscribeNever = () => () => {};

export const RichTextViewer = ({
    html,
    className,
    fallback = "No description provided.",
}: {
    html?: string | null;
    className?: string;
    fallback?: string;
}) => {
    // False while rendering on the server and while hydrating that output,
    // true for every client render after — so the server's plain text and the
    // first client pass agree, and a viewer mounted later (the usual case:
    // opened by a click) renders the sanitized HTML from its first frame.
    const hasDom = useSyncExternalStore(subscribeNever, () => true, () => false);
    const safeHtml = useMemo(
        () => (hasDom && html ? sanitizeRichTextHtml(html) : ""),
        [hasDom, html],
    );

    const isEmpty =
        !html ||
        html.trim() === "" ||
        html === "<p></p>" ||
        (hasDom && safeHtml.trim() === "");
    if (isEmpty) {
        return (
            <p
                className={cn(
                    "text-sm leading-relaxed text-subTextColor dark:text-darkTextSecondary",
                    className,
                )}
            >
                {fallback}
            </p>
        );
    }

    const viewerClassName = cn(
        "tiptap-viewer text-sm leading-relaxed text-headingTextColor dark:text-darkTextPrimary",
        "[&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-borderColor [&_blockquote]:pl-3 [&_blockquote]:text-subTextColor [&_blockquote]:italic dark:[&_blockquote]:border-darkBorder dark:[&_blockquote]:text-darkTextSecondary [&_strong]:font-semibold",
        className,
    );

    if (!hasDom) {
        return (
            <div className={cn(viewerClassName, "whitespace-pre-line")}>
                {richTextToPlainText(html)}
            </div>
        );
    }

    return (
        <div
            className={viewerClassName}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    );
};
