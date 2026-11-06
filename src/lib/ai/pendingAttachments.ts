import type { FileAttachment } from "./attachments";

/** A one-hop handoff for files dropped outside the chat page.
 *
 *  Files land on Files (or anywhere else with a dropzone) but are only useful
 *  in a conversation, so they wait here for the Chat page to mount and claim
 *  them. Module state on purpose — never localStorage: a dropped CSV can be
 *  megabytes of someone's ledger, and it has no business outliving the
 *  navigation that produced it. */
let pending: FileAttachment[] = [];

export function stageAttachments(files: FileAttachment[]): void {
  pending = [...pending, ...files];
}

/** Returns and clears. Calling twice gives you nothing the second time — that
 *  is the point: a claimed file must not reappear in the next conversation. */
export function claimAttachments(): FileAttachment[] {
  const claimed = pending;
  pending = [];
  return claimed;
}

export function pendingCount(): number {
  return pending.length;
}
