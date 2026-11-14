'use strict';
// Client Supabase server-side untuk worker (service_role, di ai-server saja).
const { createClient } = require('@supabase/supabase-js');

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum disetel');
  return createClient(url, key, { auth: { persistSession: false } });
}

module.exports = { supabaseAdmin };
