import { useCallback, useRef, useState, type DragEvent } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { readAttachment, type FileAttachment } from "@/lib/ai/attachments";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFiles: (files: FileAttachment[]) => void;
  label: string;
  hint: string;
  rejectedLabel: string;
  className?: string;
}

/** Drag-and-drop for the text attachments the assistant can actually read.
 *
 *  Adapted from the file-upload card in the reference set, minus its fake
 *  progress simulation: reading a local file into memory is instantaneous, and
 *  animating a fictional upload bar over it would be inventing latency to have
 *  something to animate. What is real — accepted types, the size ceiling, which
 *  files were rejected and why — is what gets shown.
 *
 *  Validation is `lib/ai/attachments.ts`, the same path the composer's paperclip
 *  uses, so a file that drops here behaves exactly like one picked there. */
export function Dropzone({ onFiles, label, hint, rejectedLabel, className }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // A dragenter on a child fires a dragleave on the parent; counting the
  // enters is the standard way to stop the border flickering as the pointer
  // crosses inner elements.
  const depth = useRef(0);

  const ingest = useCallback(async (list: FileList) => {
    const accepted: FileAttachment[] = [];
    const failed: string[] = [];
    for (const file of Array.from(list)) {
      const result = await readAttachment(file);
      if ("error" in result) failed.push(file.name);
      else accepted.push(result);
    }
    setRejected(failed);
    if (failed.length > 0) setTimeout(() => setRejected([]), 4000);
    if (accepted.length > 0) onFiles(accepted);
  }, [onFiles]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (e.dataTransfer.files?.length) void ingest(e.dataTransfer.files);
  };

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); depth.current += 1; setDragging(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) { depth.current = 0; setDragging(false); }
      }}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors",
        dragging ? "border-secondary bg-secondary/10" : "border-border bg-surface-veil/30",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".csv,.json,.md,.txt,text/csv,application/json,text/markdown,text/plain"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void ingest(e.target.files);
          e.target.value = "";
        }}
      />

      <UploadCloud
        className={cn("h-5 w-5 transition-colors", dragging ? "text-secondary" : "text-muted-foreground")}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        {label}
      </button>
      <p className="text-[10px] text-muted-foreground">{hint}</p>

      {rejected.length > 0 && (
        <p className="mt-1 flex items-center gap-1.5 text-[10px] text-destructive">
          <FileText className="h-3 w-3" /> {rejectedLabel}: {rejected.join(", ")}
        </p>
      )}
    </div>
  );
}
