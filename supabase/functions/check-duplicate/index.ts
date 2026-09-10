import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check for reports within 50 meters (approximately 0.00045 degrees)
    const radius = 0.00045;
    
    const { data, error } = await supabaseClient
      .from('reports')
      .select('id')
      .gte('latitude', latitude - radius)
      .lte('latitude', latitude + radius)
      .gte('longitude', longitude - radius)
      .lte('longitude', longitude + radius)
      .neq('status', 'solved')
      .limit(1);

    if (error) throw error;

    return new Response(
      JSON.stringify({ duplicate: data && data.length > 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
