const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your .env file (see .env.example)."
  );
}

// We use the SERVICE ROLE key here (not the anon key) because this client
// only ever runs on our trusted server, never in the browser. All access
// control (who can edit/delete what) is handled in our own route middleware.
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

module.exports = supabase;
