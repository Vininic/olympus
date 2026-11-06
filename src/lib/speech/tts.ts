/** Text to speech, wired to the suite's speech preferences.
 *
 *  The Oracle page already had a `speechSynthesis` call inline; this pulls it
 *  out so voice, rate and pitch come from one place and the Settings preview
 *  and the chat button cannot disagree about what "your voice" means. */

import type { SpeechPrefs } from "@/lib/prefs/types";

export function isSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Voices load asynchronously in Chrome — the first call after boot usually
 *  returns an empty array, so callers subscribe rather than poll. */
export function listVoices(): SpeechSynthesisVoice[] {
  if (!isSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function onVoicesChanged(handler: () => void): () => void {
  if (!isSupported()) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", handler);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
}

export function voicesForLocale(bcp47: string): SpeechSynthesisVoice[] {
  const lang = bcp47.split("-")[0];
  const all = listVoices();
  const matching = all.filter((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  return matching.length > 0 ? matching : all;
}

/** Markdown read aloud is unbearable — the model writes `**bold**` and the
 *  synth says "asterisk asterisk". Strip the syntax, keep the words. */
export function speakable(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " (bloco de código) ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|\*|_)/g, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\|/g, " ")
    // Collapse every whitespace run, newlines included: the synth pauses on
    // punctuation, not on line breaks, so keeping them only risks odd gaps.
    .replace(/\s+/g, " ")
    .trim();
}

export interface SpeakOptions extends Partial<SpeechPrefs> {
  lang?: string;
  onEnd?: () => void;
}

export function speak(text: string, options: SpeakOptions = {}): boolean {
  if (!isSupported()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(speakable(text));
  utterance.lang = options.lang ?? "pt-BR";
  utterance.rate = Math.min(2, Math.max(0.5, options.rate ?? 1));
  utterance.pitch = Math.min(2, Math.max(0, options.pitch ?? 1));

  if (options.voiceURI) {
    const voice = listVoices().find((v) => v.voiceURI === options.voiceURI);
    if (voice) utterance.voice = voice;
  }

  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  synth.speak(utterance);
  return true;
}

export function stop(): void {
  if (isSupported()) window.speechSynthesis.cancel();
}
