import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function createLiveKitToken(
  apiKey: string, apiSecret: string, roomName: string,
  participantIdentity: string, participantName: string,
) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    iss: apiKey, sub: participantIdentity, name: participantName,
    nbf: now, exp: now + 3600 * 2, jti: participantIdentity,
    video: { room: roomName, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true },
  };
  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64urlStr = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const data = enc.encode(`${headerB64}.${payloadB64}`);
  const key = await crypto.subtle.importKey("raw", enc.encode(apiSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${headerB64}.${payloadB64}.${b64url(sig)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) throw new Error("LiveKit credentials not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { action, callId, recipientId } = body;

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", userId).single();
    const participantName = profile?.full_name || user?.email || "Anonymous";

    // ─── DEMANDER UN APPEL ───
    if (action === "request") {
      if (!recipientId) throw new Error("recipientId requis");
      if (recipientId === userId) throw new Error("Impossible de s'appeler soi-même");

      const { data: call, error } = await adminSupabase.from("private_calls").insert({
        initiator_id: userId, recipient_id: recipientId, status: "pending",
      }).select().single();
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, call }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACCEPTER UN APPEL (le destinataire) ───
    if (action === "accept") {
      if (!callId) throw new Error("callId requis");
      const { data: call } = await adminSupabase.from("private_calls").select("*").eq("id", callId).single();
      if (!call) throw new Error("Appel introuvable");
      if (call.recipient_id !== userId) throw new Error("Seul le destinataire peut accepter cet appel");
      if (call.status !== "pending") throw new Error("Cet appel n'est plus disponible");

      const roomName = `private-${call.id}`;
      await adminSupabase.from("private_calls").update({
        status: "live", livekit_room_name: roomName, started_at: new Date().toISOString(),
      }).eq("id", callId);

      const lkToken = await createLiveKitToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, roomName, userId, participantName);
      return new Response(JSON.stringify({ token: lkToken, url: LIVEKIT_URL, roomName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REJOINDRE UN APPEL DÉJÀ EN COURS (l'initiateur, une fois accepté) ───
    if (action === "join") {
      if (!callId) throw new Error("callId requis");
      const { data: call } = await adminSupabase.from("private_calls").select("*").eq("id", callId).single();
      if (!call) throw new Error("Appel introuvable");
      if (call.initiator_id !== userId && call.recipient_id !== userId) throw new Error("Non autorisé");
      if (call.status !== "live" || !call.livekit_room_name) throw new Error("L'appel n'est pas encore actif");

      const lkToken = await createLiveKitToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, call.livekit_room_name, userId, participantName);
      return new Response(JSON.stringify({ token: lkToken, url: LIVEKIT_URL, roomName: call.livekit_room_name }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── DÉCLINER ───
    if (action === "decline") {
      if (!callId) throw new Error("callId requis");
      const { data: call } = await adminSupabase.from("private_calls").select("*").eq("id", callId).single();
      if (!call || call.recipient_id !== userId) throw new Error("Non autorisé");
      await adminSupabase.from("private_calls").update({ status: "declined" }).eq("id", callId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── TERMINER ───
    if (action === "end") {
      if (!callId) throw new Error("callId requis");
      const { data: call } = await adminSupabase.from("private_calls").select("*").eq("id", callId).single();
      if (!call || (call.initiator_id !== userId && call.recipient_id !== userId)) throw new Error("Non autorisé");

      const durationSeconds = call.started_at ? Math.round((Date.now() - new Date(call.started_at).getTime()) / 1000) : null;
      await adminSupabase.from("private_calls").update({
        status: "ended", ended_at: new Date().toISOString(), duration_seconds: durationSeconds,
      }).eq("id", callId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
