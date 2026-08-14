import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, Settings } from "lucide-react";

interface Props {
  roomTitle: string;
  roomDescription?: string | null;
  isCreator: boolean;
  onJoin: (audioEnabled: boolean, videoEnabled: boolean) => void;
  connecting: boolean;
  roomStatus: string;
}

const PitchRoomPreJoin = ({ roomTitle, roomDescription, isCreator, onJoin, connecting, roomStatus }: Props) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter(d => d.kind === "audioinput"));
      setVideoDevices(devices.filter(d => d.kind === "videoinput"));
    } catch { /* ignore */ }
  }, []);

  const startPreview = useCallback(async () => {
    try {
      if (stream) { stream.getTracks().forEach(t => t.stop()); }
      const constraints: MediaStreamConstraints = {
        audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : true,
        video: selectedVideo ? { deviceId: { exact: selectedVideo }, width: 640, height: 360 } : { width: 640, height: 360 },
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setPermissionError(null);
      if (videoRef.current) videoRef.current.srcObject = s;
      await getDevices();
    } catch (err) {
      setPermissionError(t("pitchV2.preJoin.permissionError"));
      console.error("Media error:", err);
    }
  }, [selectedAudio, selectedVideo]);

  useEffect(() => {
    startPreview();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = audioEnabled; });
      stream.getVideoTracks().forEach(t => { t.enabled = videoEnabled; });
    }
  }, [audioEnabled, videoEnabled, stream]);

  const handleJoin = () => {
    stream?.getTracks().forEach(t => t.stop());
    onJoin(audioEnabled, videoEnabled);
  };

  const canJoin = isCreator ? roomStatus === "scheduled" || roomStatus === "live" : roomStatus === "live";
  const joinLabel = isCreator && roomStatus === "scheduled" ? t("pitchV2.preJoin.startLive") : t("pitchV2.preJoin.join");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-video border border-border">
            {videoEnabled && !permissionError ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" style={{ transform: "scaleX(-1)" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <VideoOff className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            )}
            {permissionError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4">
                <p className="text-sm text-destructive text-center">{permissionError}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant={audioEnabled ? "outline" : "destructive"} size="icon" className="h-12 w-12 rounded-full" onClick={() => setAudioEnabled(!audioEnabled)} aria-label={audioEnabled ? "Couper le microphone" : "Activer le microphone"}>
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button variant={videoEnabled ? "outline" : "destructive"} size="icon" className="h-12 w-12 rounded-full" onClick={() => setVideoEnabled(!videoEnabled)} aria-label={videoEnabled ? "Couper la caméra" : "Activer la caméra"}>
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setShowSettings(!showSettings)} aria-label="Paramètres audio/vidéo">
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {showSettings && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              {audioDevices.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">{t("pitchV2.preJoin.microphone")}</label>
                  <Select value={selectedAudio} onValueChange={(v) => { setSelectedAudio(v); startPreview(); }}>
                    <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue placeholder={t("pitchV2.preJoin.defaultDevice")} /></SelectTrigger>
                    <SelectContent>
                      {audioDevices.map(d => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `${t("pitchV2.preJoin.microphone")} ${d.deviceId.slice(0, 8)}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {videoDevices.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">{t("pitchV2.preJoin.camera")}</label>
                  <Select value={selectedVideo} onValueChange={(v) => { setSelectedVideo(v); startPreview(); }}>
                    <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue placeholder={t("pitchV2.preJoin.defaultDevice")} /></SelectTrigger>
                    <SelectContent>
                      {videoDevices.map(d => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `${t("pitchV2.preJoin.camera")} ${d.deviceId.slice(0, 8)}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{roomTitle}</h1>
            {roomDescription && <p className="text-muted-foreground mt-2">{roomDescription}</p>}
          </div>

          <div className="flex gap-2">
            <Badge className={`inline-flex items-center gap-1.5 ${roomStatus === "live" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
              {roomStatus === "live" && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
              {roomStatus === "live" ? t("pitchV2.preJoin.live") : t("pitchV2.preJoin.scheduled")}
            </Badge>
          </div>

          {roomStatus === "ended" ? (
            <p className="text-muted-foreground">{t("pitchV2.preJoin.ended")}</p>
          ) : (
            <Button onClick={handleJoin} disabled={connecting || !canJoin} className="w-full bg-gradient-gold text-primary-foreground font-semibold text-lg py-6 rounded-xl">
              {connecting ? t("pitchV2.preJoin.connecting") : joinLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PitchRoomPreJoin;
