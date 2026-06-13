#!/usr/bin/env node
/**
 * automation-agency/check-bounces.js
 * Pulls sent emails from Resend for the last 7 days and reports bounce stats.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node automation-agency/check-bounces.js
 *   or set RESEND_API_KEY in automation-agency/.env
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── load .env from script's own directory ────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(resolve(__dir, '.env'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* no .env — that's fine */ }

const API_KEY = process.env.RESEND_API_KEY;
const BASE    = 'https://api.resend.com';
const DAYS    = 7;
const LIMIT   = 100; // Resend max page size

// ── helpers ──────────────────────────────────────────────────────────────────
function abort(msg) {
  console.error(`\n✗  ${msg}\n`);
  process.exit(1);
}

async function resendGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const body = await res.json();
  if (!res.ok) {
    const detail = body?.message || body?.name || JSON.stringify(body);
    if (res.status === 401 && /restricted/i.test(detail)) {
      abort(
        'This Resend API key is restricted to sending only and cannot read email data.\n\n' +
        '  Fix: create a full-access API key in the Resend dashboard:\n' +
        '  https://resend.com/api-keys  →  New API Key  →  Permission: Full Access\n\n' +
        '  Then set the new key:\n' +
        '    RESEND_API_KEY=re_newkey node automation-agency/check-bounces.js'
      );
    }
    throw new Error(`Resend ${res.status} on ${path}: ${detail}`);
  }
  return body;
}

function toAddr(to) {
  if (!to) return '(unknown)';
  if (Array.isArray(to)) return to.join(', ');
  return String(to);
}

function bar(n, total, width = 20) {
  const filled = total > 0 ? Math.round((n / total) * width) : 0;
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ── main ─────────────────────────────────────────────────────────────────────
if (!API_KEY) {
  abort(
    'RESEND_API_KEY is not set.\n' +
    '  Option 1: RESEND_API_KEY=re_xxx node automation-agency/check-bounces.js\n' +
    '  Option 2: create automation-agency/.env with RESEND_API_KEY=re_xxx'
  );
}

const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
console.log(`\nFetching emails sent since ${since.toUTCString()} …\n`);

// ── fetch emails (Resend list endpoint returns most recent, max 100) ──────────
let allEmails   = [];
let apiSupported = true;

let data;
try {
  data = await resendGet(`/emails?limit=${LIMIT}`);
} catch (err) {
  if (/404|not found|cannot get/i.test(err.message)) {
    apiSupported = false;
  } else {
    throw err;
  }
}

if (apiSupported) {
  // Resend returns { data: [...], has_more: bool }
  const emails = Array.isArray(data)
    ? data
    : (data.data ?? data.emails ?? []);

  for (const email of emails) {
    const sent = new Date(email.created_at);
    if (sent >= since) allEmails.push(email);
  }

  if (data.has_more) {
    console.log(`  Note: Resend returned ${emails.length} emails (has_more=true). Reporting on the ${allEmails.length} within the 7-day window.\n`);
  }
}

if (!apiSupported) {
  abort(
    'The Resend /emails list endpoint returned 404.\n' +
    '  This endpoint may require a paid plan or may not be enabled.\n' +
    '  Check https://resend.com/docs/api-reference/emails/list for availability.'
  );
}

if (allEmails.length === 0) {
  console.log(`No emails found in the last ${DAYS} days.\n`);
  process.exit(0);
}

// ── classify ─────────────────────────────────────────────────────────────────
// Resend surfaces status via `last_event` or `status` depending on API version
const isBounce = e =>
  e.last_event === 'bounced' ||
  e.status     === 'bounced' ||
  e.last_event === 'bounce'  ||
  e.status     === 'bounce';

const bounced     = allEmails.filter(isBounce);
const totalSent   = allEmails.length;
const totalBounce = bounced.length;
const bounceRate  = totalSent > 0
  ? ((totalBounce / totalSent) * 100).toFixed(2)
  : '0.00';

// ── group by bounce reason ────────────────────────────────────────────────────
// Resend may provide bounce_type, error, or just the last_event
function getBounceReason(email) {
  if (email.bounce_type)                        return email.bounce_type;
  if (email.error?.message)                     return email.error.message;
  if (email.error && typeof email.error === 'string') return email.error;
  // Infer soft vs hard from status code hints where available
  if (email.error_code) {
    const code = String(email.error_code);
    if (['550','551','552','553','554'].includes(code)) return `Hard bounce (${code})`;
    if (['421','450','451','452'].includes(code))       return `Soft bounce (${code})`;
    return `Bounce code ${code}`;
  }
  return 'Unknown reason';
}

const byReason = {};
for (const email of bounced) {
  const reason = getBounceReason(email);
  (byReason[reason] ??= []).push(email);
}
const sortedReasons = Object.entries(byReason)
  .sort((a, b) => b[1].length - a[1].length);

// ── output ────────────────────────────────────────────────────────────────────
const W = 58;
const line = '─'.repeat(W);
console.log('╔' + '═'.repeat(W) + '╗');
console.log('║' + '  RESEND BOUNCE REPORT — Last 7 Days'.padEnd(W) + '║');
console.log('╚' + '═'.repeat(W) + '╝');
console.log();

console.log(`  Total sent       ${String(totalSent).padStart(6)}`);
console.log(`  Total bounced    ${String(totalBounce).padStart(6)}`);
console.log(`  Bounce rate      ${String(bounceRate + '%').padStart(6)}`);
console.log();

if (totalBounce === 0) {
  console.log('  ✓  No bounces detected in the last 7 days.\n');
  process.exit(0);
}

// bounce rate visual
console.log(`  ${bar(totalBounce, totalSent, 30)}  ${bounceRate}%`);
console.log();

// top bounce reasons
console.log(line);
console.log('  TOP BOUNCE REASONS');
console.log(line);
for (const [reason, emails] of sortedReasons) {
  const pct  = ((emails.length / totalBounce) * 100).toFixed(0);
  const mini = bar(emails.length, totalBounce, 12);
  console.log(`  ${mini}  ${emails.length.toString().padStart(3)} (${pct.padStart(3)}%)  ${reason}`);
}
console.log();

// bounced addresses
console.log(line);
console.log('  BOUNCED ADDRESSES');
console.log(line);

// sort by reason then address for readability
const sorted = [...bounced].sort((a, b) => {
  const ra = getBounceReason(a), rb = getBounceReason(b);
  return ra.localeCompare(rb) || toAddr(a.to).localeCompare(toAddr(b.to));
});

let lastReason = null;
for (const email of sorted) {
  const reason = getBounceReason(email);
  if (reason !== lastReason) {
    console.log(`\n  [${reason}]`);
    lastReason = reason;
  }
  const addr    = toAddr(email.to);
  const subject = (email.subject || '(no subject)').slice(0, 40);
  const date    = new Date(email.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  console.log(`    ${addr.padEnd(42)}  ${date.padEnd(14)}  ${subject}`);
}

console.log();
console.log(line);
console.log(`  Report generated at ${new Date().toUTCString()}`);
console.log(line);
console.log();
