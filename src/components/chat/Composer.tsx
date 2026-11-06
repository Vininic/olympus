import { useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { ArrowUp, Check, ChevronDown, FileText, Paperclip, Square, X } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutoResizeTextarea } from "@/lib/ui/useAutoResizeTextarea";
import { DEFAULT_MODELS, PROVIDER_LABELS, type AiProvider, type AiSettings } from "@/lib/ai/settings";
import type { FileAttachment } from "@/lib/ai/attachments";
import { Dictation } from "./Dictation";
import { cn } from "@/lib/utils";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  loading: boolean;
  settings: AiSettings;
  onProviderChange: (provider: AiProvider) => void;
  attachments: FileAttachment[];
  onAttach: (files: FileList) => void;
  onRemoveAttachment: (id: string) => void;
  placeholder: string;
  /** BCP-47 for dictation; the control hides itself if unsupported. */
  lang: string;
  labels: {
    attach: string;
    attachHint: string;
    send: string;
    stop: string;
    model: string;
    dictate: string;
    dictateStop: string;
    listening: string;
  };
  /** Right-hand meter text ("32% contexto · 4.100 tokens"). */
  meter?: string;
}

/** The composer, built to the kokonutui `ai-prompt` anatomy: one rounded
 *  shell holding the textarea and an action row (attach + model on the left,
 *  send on the right), auto-resizing 72 → 300px, Enter to send. Restyled onto
 *  the suite's paper surfaces — the original's cool `bg-black/5` reads as a
 *  hole punched in parchment. */
export function Composer({
  value, onChange, onSubmit, onStop, loading, settings, onProviderChange,
  attachments, onAttach, onRemoveAttachment, placeholder, lang, labels, meter,
}: ComposerProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 72, maxHeight: 300 });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) {
        onSubmit();
        adjustHeight(true);
      }
    }
  };

  const canSend = value.trim().length > 0 && !loading;

  return (
    <div className="rounded-2xl border border-border bg-surface-veil/50 p-1.5 shadow-soft transition-colors focus-within:border-secondary/60">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 pb-1.5 pt-1">
          {attachments.map((file) => (
            <span
              key={file.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 text-[11px] text-primary"
            >
              <FileText className="h-3 w-3 text-secondary" />
              <span className="max-w-[160px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(file.id)}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label={`${file.name} ✕`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="w-full resize-none border-0 bg-transparent px-3 pb-2 pt-2.5 text-sm leading-relaxed text-primary outline-none placeholder:text-muted-foreground/70 focus:ring-0"
        style={{ minHeight: 72 }}
      />

      <div className="flex items-center gap-1.5 px-1.5 pb-0.5">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".csv,.json,.md,.txt,text/csv,application/json,text/markdown,text/plain"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onAttach(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title={`${labels.attach} — ${labels.attachHint}`}
          aria-label={labels.attach}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <Dictation
          lang={lang}
          onTranscript={onChange}
          label={labels.dictate}
          stopLabel={labels.dictateStop}
          listeningLabel={labels.listening}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              title={labels.model}
            >
              <span className="max-w-[180px] truncate">
                {PROVIDER_LABELS[settings.provider]} · {settings.model.trim() || DEFAULT_MODELS[settings.provider]}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((provider) => (
              <DropdownMenuItem
                key={provider}
                onSelect={() => onProviderChange(provider)}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate">{PROVIDER_LABELS[provider]}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{DEFAULT_MODELS[provider]}</span>
                </span>
                {settings.provider === provider && <Check className="h-3.5 w-3.5 shrink-0 text-secondary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {meter && (
          <span className="num ml-auto hidden pr-1 text-[10px] text-muted-foreground sm:block">{meter}</span>
        )}

        <button
          type="button"
          onClick={loading ? onStop : onSubmit}
          disabled={!loading && !canSend}
          title={loading ? labels.stop : labels.send}
          aria-label={loading ? labels.stop : labels.send}
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all",
            meter ? "" : "ml-auto",
            loading
              ? "bg-muted text-primary hover:bg-muted/80"
              : canSend
                ? "bg-gilt text-primary-deep shadow-gilt"
                : "bg-muted/60 text-muted-foreground/50",
          )}
        >
          {loading ? <Square className="h-3.5 w-3.5" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
