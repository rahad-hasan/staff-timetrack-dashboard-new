"use client";

import { cn } from "@/lib/utils";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
    Bold,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Strikethrough,
} from "lucide-react";
import { useEffect } from "react";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    minHeightClass?: string;
    autofocus?: boolean;
    fillHeight?: boolean;
}

const toolbarBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-subTextColor dark:text-darkTextSecondary hover:bg-bgSecondary dark:hover:bg-darkBorder/40 hover:text-headingTextColor dark:hover:text-darkTextPrimary transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

const toolbarBtnActive =
    "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20 dark:hover:text-primary";

export const RichTextEditor = ({
    value,
    onChange,
    placeholder = "Write something...",
    className,
    minHeightClass = "min-h-32",
    autofocus = false,
    fillHeight = false,
}: RichTextEditorProps) => {
    const editor = useEditor({
        immediatelyRender: false,
        autofocus,
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                horizontalRule: false,
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: {
                    class: "text-primary underline underline-offset-2",
                    rel: "noopener noreferrer",
                    target: "_blank",
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass:
                    "before:content-[attr(data-placeholder)] before:text-subTextColor/60 dark:before:text-darkTextSecondary/60 before:float-left before:pointer-events-none before:h-0",
            }),
        ],
        content: value || "",
        editorProps: {
            attributes: {
                class: cn(
                    "tiptap-editor outline-none px-3 py-2.5 text-sm leading-relaxed text-headingTextColor dark:text-darkTextPrimary [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-borderColor [&_blockquote]:pl-3 [&_blockquote]:text-subTextColor [&_blockquote]:italic dark:[&_blockquote]:border-darkBorder dark:[&_blockquote]:text-darkTextSecondary [&_strong]:font-semibold",
                    minHeightClass,
                    fillHeight && "h-full flex-1",
                ),
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const isEmpty = editor.getText().trim().length === 0;
            onChange(isEmpty ? "" : html);
        },
    });

    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        if ((value || "") !== current) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) {
        return (
            <div
                className={cn(
                    "rounded-md border border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg",
                    minHeightClass,
                    fillHeight && "h-full",
                    className,
                )}
            />
        );
    }

    const setLink = () => {
        const previous = editor.getAttributes("link").href;
        const url = window.prompt("URL", previous || "https://");
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    };

    const tools = [
        {
            label: "Bold",
            icon: Bold,
            isActive: () => editor.isActive("bold"),
            run: () => editor.chain().focus().toggleBold().run(),
        },
        {
            label: "Italic",
            icon: Italic,
            isActive: () => editor.isActive("italic"),
            run: () => editor.chain().focus().toggleItalic().run(),
        },
        {
            label: "Strikethrough",
            icon: Strikethrough,
            isActive: () => editor.isActive("strike"),
            run: () => editor.chain().focus().toggleStrike().run(),
        },
        {
            label: "Bullet list",
            icon: List,
            isActive: () => editor.isActive("bulletList"),
            run: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
            label: "Numbered list",
            icon: ListOrdered,
            isActive: () => editor.isActive("orderedList"),
            run: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
            label: "Quote",
            icon: Quote,
            isActive: () => editor.isActive("blockquote"),
            run: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
            label: "Link",
            icon: Link2,
            isActive: () => editor.isActive("link"),
            run: setLink,
        },
    ] as const;

    return (
        <div
            className={cn(
                "rounded-md border border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg overflow-hidden focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition",
                fillHeight && "flex h-full min-h-0 flex-col",
                className,
            )}
        >
            <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkSecondaryBg/40">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    const active = tool.isActive();
                    return (
                        <button
                            key={tool.label}
                            type="button"
                            onClick={tool.run}
                            aria-label={tool.label}
                            title={tool.label}
                            className={cn(toolbarBtn, active && toolbarBtnActive)}
                        >
                            <Icon className="h-3.5 w-3.5" />
                        </button>
                    );
                })}
            </div>
            <EditorContent
                editor={editor}
                className={cn(
                    fillHeight &&
                        "flex min-h-0 flex-1 flex-col [&_.tiptap-editor]:flex-1 [&_.tiptap-editor]:min-h-0",
                )}
            />
        </div>
    );
};

export const RichTextViewer = ({
    html,
    className,
    fallback = "No description provided.",
}: {
    html?: string | null;
    className?: string;
    fallback?: string;
}) => {
    const isEmpty = !html || html.trim() === "" || html === "<p></p>";
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

    return (
        <div
            className={cn(
                "tiptap-viewer text-sm leading-relaxed text-headingTextColor dark:text-darkTextPrimary",
                "[&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
                "[&_blockquote]:border-l-2 [&_blockquote]:border-borderColor [&_blockquote]:pl-3 [&_blockquote]:text-subTextColor [&_blockquote]:italic dark:[&_blockquote]:border-darkBorder dark:[&_blockquote]:text-darkTextSecondary [&_strong]:font-semibold",
                className,
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default RichTextEditor;
