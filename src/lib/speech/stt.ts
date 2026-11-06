/** Dictation, over the browser's own speech recognition.
 *
 *  The counterpart to `tts.ts`: that one reads answers out, this one takes
 *  questions in. No service, no upload — `SpeechRecognition` is the engine the
 *  browser already ships, which on Chrome and Edge means Google's, and on
 *  Firefox means "unsupported". Callers must handle `isSupported() === false`
 *  by hiding the control rather than offering a button that does nothing.
 *
 *  The API is still vendor-prefixed and absent from TypeScript's DOM library,
 *  hence the minimal local typing below — narrow on purpose, covering only
 *  what this wrapper touches. */

interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function ctor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSupported(): boolean {
  return ctor() !== null;
}

export interface DictationHandle {
  stop: () => void;
}

export interface DictationOptions {
  lang: string;
  /** Fires on every update, with the full text for this dictation run. */
  onTranscript: (text: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/** Starts listening. Returns null when the browser has no engine. */
export function startDictation({ lang, onTranscript, onEnd, onError }: DictationOptions): DictationHandle | null {
  const Recognition = ctor();
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  // The engine re-emits everything from `resultIndex` onward, so the transcript
  // has to be rebuilt from the whole results list each time; appending only the
  // newest chunk duplicates words as interim results get finalized.
  recognition.onresult = (event) => {
    let text = "";
    let isFinal = false;
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      text += result[0]?.transcript ?? "";
      if (result.isFinal) isFinal = true;
    }
    onTranscript(text.trim(), isFinal);
  };

  recognition.onerror = (event) => onError?.(event.error ?? "unknown");
  recognition.onend = () => onEnd?.();

  try {
    recognition.start();
  } catch {
    // Chrome throws if start() is called while an earlier run is still closing.
    return null;
  }

  return { stop: () => recognition.stop() };
}
