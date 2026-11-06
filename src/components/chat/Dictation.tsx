import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { isSupported, startDictation, type DictationHandle } from "@/lib/speech/stt";
import { cn } from "@/lib/utils";

interface DictationProps {
  lang: string;
  /** Called with the running transcript; the composer replaces its draft. */
  onTranscript: (text: string) => void;
  label: string;
  stopLabel: string;
  listeningLabel: string;
}

/** Push-to-dictate for the composer.
 *
 *  The reference voice card animated a bar meter on a timer with no audio
 *  behind it — a decoration pretending to be a level meter. This one is driven
 *  by the transcript itself: bars move while words are arriving and settle when
 *  the engine goes quiet, so the motion means "it is hearing you", which is the
 *  only thing the meter was ever supposed to say. Real amplitude would need a
 *  second `getUserMedia` stream purely to draw with, which is not worth a
 *  microphone permission.
 *
 *  Renders nothing at all when the browser has no engine — Firefox gets no
 *  dead button. */
export function Dictation({ lang, onTranscript, label, stopLabel, listeningLabel }: DictationProps) {
  const [listening, setListening] = useState(false);
  const [pulse, setPulse] = useState(0);
  const handleRef = useRef<DictationHandle | null>(null);
  const supported = isSupported();

  useEffect(() => () => handleRef.current?.stop(), []);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      handleRef.current?.stop();
      handleRef.current = null;
      setListening(false);
      return;
    }
    const handle = startDictation({
      lang,
      onTranscript: (text) => {
        onTranscript(text);
        setPulse((n) => n + 1);
      },
      onEnd: () => { setListening(false); handleRef.current = null; },
      onError: () => { setListening(false); handleRef.current = null; },
    });
    if (handle) {
      handleRef.current = handle;
      setListening(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        title={listening ? stopLabel : label}
        aria-label={listening ? stopLabel : label}
        className={cn(
          "grid h-8 w-8 place-items-center rounded-lg transition-colors",
          listening
            ? "bg-destructive/15 text-destructive"
            : "text-muted-foreground hover:bg-muted hover:text-primary",
        )}
      >
        {listening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
      </button>

      {listening && (
        <span className="flex items-center gap-2">
          <span className="flex h-4 items-center gap-[2px]" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-destructive/70 transition-[height] duration-200"
                style={{
                  // Deterministic per bar and per update: a stable shape that
                  // changes only when the transcript does.
                  height: `${25 + ((pulse * 7 + i * 13) % 60)}%`,
                }}
              />
            ))}
          </span>
          <span className="text-[10px] text-muted-foreground">{listeningLabel}</span>
        </span>
      )}
    </div>
  );
}
