const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length) {
  console.error('\n[Union\'S] Production build blocked: missing required environment variables.');
  console.error(`Missing: ${missing.join(', ')}`);
  console.error('Set these variables in Vercel for the Production environment, then redeploy.');
  process.exit(1);
}

const rawUrl = process.env.VITE_SUPABASE_URL.trim().replace(/^['\"]|['\"]$/g, '');

try {
  const url = new URL(rawUrl);
  const pathname = url.pathname.replace(/\/+$/, '');
  if (!['http:', 'https:'].includes(url.protocol) || pathname === '/rest/v1' || pathname !== '') {
    if (pathname !== '' && pathname !== '/rest/v1') {
      throw new Error('VITE_SUPABASE_URL must be the Supabase project root URL.');
    }
  }
  if (!url.hostname.endsWith('.supabase.co') && !url.hostname.includes('.supabase.in')) {
    throw new Error('VITE_SUPABASE_URL does not look like a Supabase project URL.');
  }
} catch (error) {
  console.error(`[Union'S] Invalid VITE_SUPABASE_URL: ${error.message}`);
  process.exit(1);
}

const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY.trim().replace(/^['\"]|['\"]$/g, '');
if (key.length < 20) {
  console.error('[Union\'S] VITE_SUPABASE_PUBLISHABLE_KEY looks invalid or truncated.');
  process.exit(1);
}

console.log('[Union\'S] Supabase production environment validated.');
