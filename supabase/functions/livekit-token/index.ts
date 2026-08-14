import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function createLiveKitToken(
  apiKey: string, apiSecret: string, roomName: string,
  participantIdentity: string, participantName: string,
  canPublish: boolean, canSubscribe: boolean, isAdmin: boolean,
) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    iss: apiKey, sub: participantIdentity, name: participantName,
    nbf: now, exp: now + 3600 * 6, jti: participantIdentity,
    video: {
      room: roomName, roomJoin: true, canPublish, canSubscribe, canPublishData: true,
      ...(isAdmin ? { roomAdmin: true, roomCreate: true, canUpdateOwnMetadata: true } : {}),
    },
  };
  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64urlStr = (s: string) =>
    btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const data = enc.encode(`${headerB64}.${payloadB64}`);
  const key = await crypto.subtle.importKey("raw", enc.encode(apiSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${headerB64}.${payloadB64}.${b64url(sig)}`;
}

async function createLiveKitApiToken(apiKey: string, apiSecret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: apiKey, nbf: now, exp: now + 600, video: { roomRecord: true, roomAdmin: true } };
  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64urlStr = (s: string) =>
    btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const data = enc.encode(`${headerB64}.${payloadB64}`);
  const key = await crypto.subtle.importKey("raw", enc.encode(apiSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${headerB64}.${payloadB64}.${b64url(sig)}`;
}

function getLiveKitHttpUrl(url: string) {
  return url.replace("wss://", "https://").replace("ws://", "http://");
}

async function startRoomRecording(livekitUrl: string, apiKey: string, apiSecret: string, roomName: string, roomId: string) {
  const s3AccessKey = Deno.env.get("AWS_S3_ACCESS_KEY_ID");
  const s3SecretKey = Deno.env.get("AWS_S3_SECRET_ACCESS_KEY");
  const s3Bucket = Deno.env.get("AWS_S3_BUCKET");
  const s3Region = Deno.env.get("AWS_S3_REGION");
  if (!s3AccessKey || !s3SecretKey || !s3Bucket || !s3Region) {
    console.warn("S3 credentials not configured, skipping recording");
    return null;
  }
  const httpUrl = getLiveKitHttpUrl(livekitUrl);
  const token = await createLiveKitApiToken(apiKey, apiSecret);
  const filepath = `pitch-rooms/${roomId}/${Date.now()}.mp4`;
  const response = await fetch(`${httpUrl}/twirp/livekit.Egress/StartRoomCompositeEgress`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ room_name: roomName, file_outputs: [{ file_type: "MP4", filepath, s3: { access_key: s3AccessKey, secret: s3SecretKey, bucket: s3Bucket, region: s3Region } }] }),
  });
  if (!response.ok) { console.error("Failed to start recording:", await response.text()); return null; }
  const result = await response.json();
  return { egress_id: result.egress_id, filepath };
}

async function stopRoomRecording(livekitUrl: string, apiKey: string, apiSecret: string, egressId: string) {
  const httpUrl = getLiveKitHttpUrl(livekitUrl);
  const token = await createLiveKitApiToken(apiKey, apiSecret);
  const response = await fetch(`${httpUrl}/twirp/livekit.Egress/StopEgress`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ egress_id: egressId }),
  });
  if (!response.ok) { console.error("Failed to stop recording:", await response.text()); return null; }
  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    const { roomId, action } = body;
    if (!roomId) throw new Error("roomId is required");

    const { data: room, error: roomError } = await supabase.from("pitch_rooms").select("*").eq("id", roomId).single();
    if (roomError || !room) throw new Error("Room not found");

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", userId).single();
    const participantName = profile?.full_name || user?.email || "Anonymous";
    const isCreator = room.creator_id === userId;

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    // ─── CREATE ROOM & AUTO-START RECORDING ───
    if (action === "create_room" && isCreator) {
      const livekitRoomName = `pitch-${room.id}`;
      let egressId: string | null = null;
      let recordingFilepath: string | null = null;
      try {
        const recording = await startRoomRecording(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, livekitRoomName, room.id);
        if (recording) { egressId = recording.egress_id; recordingFilepath = recording.filepath; }
      } catch (e) { console.error("Recording start failed (non-blocking):", e); }

      await adminSupabase.from("pitch_rooms").update({
        livekit_room_name: livekitRoomName, status: "live", started_at: new Date().toISOString(),
        is_recording: !!egressId,
        settings: { ...((room.settings as Record<string, unknown>) || {}), egress_id: egressId, recording_filepath: recordingFilepath },
      }).eq("id", roomId);

      await adminSupabase.from("pitch_room_participants").upsert({
        room_id: roomId, user_id: userId, role: "host", status: "joined",
        can_publish_audio: true, can_publish_video: true,
      }, { onConflict: "room_id,user_id" });

      const lkToken = await createLiveKitToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, livekitRoomName, userId, participantName, true, true, true);
      return new Response(JSON.stringify({ token: lkToken, url: LIVEKIT_URL, roomName: livekitRoomName, recording: !!egressId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── JOIN ROOM ───
    if (action === "join") {
      const livekitRoomName = room.livekit_room_name;
      if (!livekitRoomName || room.status !== "live") throw new Error("Room is not live");

      const { data: existingP } = await adminSupabase.from("pitch_room_participants").select("*").eq("room_id", roomId).eq("user_id", userId).maybeSingle();
      if (existingP?.status === "banned") throw new Error("Vous avez été banni de cette room");
      if (existingP?.status === "kicked") throw new Error("Vous avez été exclu de cette room");

      const roomSettings = (room.settings as Record<string, unknown>) || {};
      const waitingRoom = roomSettings.waiting_room === true;

      // If waiting room enabled and user is not already approved
      if (waitingRoom && !existingP && !isCreator) {
        await adminSupabase.from("pitch_room_participants").upsert({
          room_id: roomId, user_id: userId, role: "viewer", status: "waiting",
          can_publish_audio: false, can_publish_video: false,
        }, { onConflict: "room_id,user_id" });
        return new Response(JSON.stringify({ waiting: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (existingP?.status === "waiting") {
        return new Response(JSON.stringify({ waiting: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const role = existingP?.role || "viewer";
      const canPublish = role === "host" || role === "speaker" || role === "moderator";

      await adminSupabase.from("pitch_room_participants").upsert({
        room_id: roomId, user_id: userId, role, status: "joined",
        can_publish_audio: canPublish, can_publish_video: canPublish,
      }, { onConflict: "room_id,user_id" });

      const lkToken = await createLiveKitToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, livekitRoomName, userId, participantName, canPublish, true, isCreator);
      return new Response(JSON.stringify({ token: lkToken, url: LIVEKIT_URL, roomName: livekitRoomName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── HAND RAISE ───
    if (action === "hand_raise") {
      const { raised } = body;
      await adminSupabase.from("pitch_room_participants")
        .update({ hand_raised: !!raised })
        .eq("room_id", roomId).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── INVITE ───
    if (action === "invite" && isCreator) {
      const { inviteUserIds } = body;
      if (!inviteUserIds || !Array.isArray(inviteUserIds)) throw new Error("inviteUserIds required");
      
      for (const uid of inviteUserIds) {
        await adminSupabase.from("pitch_room_participants").upsert({
          room_id: roomId, user_id: uid, role: "viewer", status: "joined",
          can_publish_audio: false, can_publish_video: false,
        }, { onConflict: "room_id,user_id" });
      }

      return new Response(JSON.stringify({ success: true, invited: inviteUserIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── APPROVE WAITING ───
    if (action === "approve_waiting" && isCreator) {
      const { targetUserId } = body;
      if (!targetUserId) throw new Error("targetUserId required");

      await adminSupabase.from("pitch_room_participants")
        .update({ status: "joined" })
        .eq("room_id", roomId).eq("user_id", targetUserId).eq("status", "waiting");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REJECT WAITING ───
    if (action === "reject_waiting" && isCreator) {
      const { targetUserId } = body;
      await adminSupabase.from("pitch_room_participants")
        .update({ status: "kicked" })
        .eq("room_id", roomId).eq("user_id", targetUserId).eq("status", "waiting");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── MODERATE ───
    if (action === "moderate" && isCreator) {
      const { targetUserId, moderationAction } = body;
      if (moderationAction === "kick") {
        await adminSupabase.from("pitch_room_participants").update({ status: "kicked", left_at: new Date().toISOString() }).eq("room_id", roomId).eq("user_id", targetUserId);
      } else if (moderationAction === "ban") {
        await adminSupabase.from("pitch_room_participants").update({ status: "banned", left_at: new Date().toISOString() }).eq("room_id", roomId).eq("user_id", targetUserId);
      } else if (moderationAction === "promote_speaker") {
        await adminSupabase.from("pitch_room_participants").update({ role: "speaker", can_publish_audio: true, can_publish_video: true, hand_raised: false }).eq("room_id", roomId).eq("user_id", targetUserId);
      } else if (moderationAction === "demote_viewer") {
        await adminSupabase.from("pitch_room_participants").update({ role: "viewer", can_publish_audio: false, can_publish_video: false }).eq("room_id", roomId).eq("user_id", targetUserId);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── END ROOM & STOP RECORDING ───
    if (action === "end_room" && isCreator) {
      const settings = (room.settings as Record<string, unknown>) || {};
      const egressId = settings.egress_id as string | null;
      let recordingUrl: string | null = null;

      if (egressId && room.livekit_room_name) {
        try {
          await stopRoomRecording(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, egressId);
          const s3Bucket = Deno.env.get("AWS_S3_BUCKET");
          const s3Region = Deno.env.get("AWS_S3_REGION");
          const filepath = settings.recording_filepath as string;
          if (s3Bucket && s3Region && filepath) {
            recordingUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${filepath}`;
          }
        } catch (e) { console.error("Failed to stop recording:", e); }
      }

      await adminSupabase.from("pitch_rooms").update({
        status: "ended", ended_at: new Date().toISOString(), is_recording: false,
        ...(recordingUrl ? { recording_url: recordingUrl } : {}),
      }).eq("id", roomId);

      await adminSupabase.from("pitch_room_participants").update({ status: "left", left_at: new Date().toISOString() }).eq("room_id", roomId).eq("status", "joined");

      return new Response(JSON.stringify({ success: true, recording_url: recordingUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
