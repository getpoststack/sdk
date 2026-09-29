// Barrel module — re-exports all public SDK types from the per-domain
// files under ./types/. Kept as a stable import path (`../types.ts`) so
// consumers and resources see a byte-identical public surface.

export type * from './types/common.ts';
export type * from './types/emails.ts';
export type * from './types/inbound-emails.ts';
export type * from './types/domains.ts';
export type * from './types/contacts.ts';
export type * from './types/segments.ts';
export type * from './types/templates.ts';
export type * from './types/webhooks.ts';
export type * from './types/api-keys.ts';
export type * from './types/mailboxes.ts';
export type * from './types/broadcasts.ts';
export type * from './types/suppressions.ts';
export type * from './types/workflows.ts';
export type * from './types/signup-forms.ts';
export type * from './types/notification-channels.ts';
