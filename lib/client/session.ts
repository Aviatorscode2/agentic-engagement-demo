'use client';

import { useEffect, useState } from 'react';

export type Vendor = 'novu' | 'knock' | 'courier';

type Failed = { ok: false; error: string };
export type DemoSession = {
  subscriberId: string;
  novu: ({ ok: true; subscriberHash: string; agentHash: string }) | Failed;
  knock: ({ ok: true; userToken: string }) | Failed;
  courier: ({ ok: true; jwt: string }) | Failed;
};

const STORAGE_KEY = 'parcelly-demo-subscriber';
// Server-issued vendor tokens last an hour (lib/server/vendors/*.ts).
const REFRESH_MS = 45 * 60 * 1000;

function randomId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return 'demo-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

// One private demo user per browser, so readers only see their own inbox.
function getOrCreateSubscriberId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && /^demo-[a-z0-9]{10}$/.test(existing)) return existing;
    const created = randomId();
    localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    // Storage blocked (private mode): fall back to a per-visit ID.
    return randomId();
  }
}

export function resetSubscriberId() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useDemoSession() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscriberId = getOrCreateSubscriberId();
    let fetchedAt = 0;

    function load(initial: boolean) {
      fetchedAt = Date.now();
      fetch('/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscriberId }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error((await res.json()).error ?? 'Session failed');
          setSession(await res.json());
        })
        // A failed refresh keeps the current session; only the first load reports an error.
        .catch((e: Error) => initial && setError(e.message));
    }

    load(true);

    // Knock and Courier tokens expire after an hour, and an open inbox quietly
    // stops receiving messages once they do. Renew before then, and on return
    // to a tab that sat in the background past that point.
    const timer = setInterval(() => load(false), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - fetchedAt > REFRESH_MS) load(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { session, error };
}

// ?owner=<DEMO_OWNER_TOKEN> turns on real email delivery for the owner only.
export function useOwnerToken(): string | null {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('owner'));
  }, []);
  return token;
}
