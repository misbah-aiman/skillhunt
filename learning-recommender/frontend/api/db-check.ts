import { supabase } from "./_lib/supabase";

export async function POST() {
  const { data, error } = await supabase
    .from("Profiles")
    .insert({ name: `DB check ${new Date().toISOString()}` })
    .select()
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, row: data });
}
