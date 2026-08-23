import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { PitchVideo } from "@/types/pitch-room";

interface VideoWithOwner extends PitchVideo {
  owner_name?: string;
}

const VideoPlayerDialog = ({ video, onClose }: { video: VideoWithOwner; onClose: () => void }) => {
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    supabase.rpc("increment_video_views", { video_id: video.id });
  }, [video.id]);

  const { data } = supabase.storage.from("pitch-videos").getPublicUrl(video.storage_path);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black">
        <video src={data.publicUrl} controls autoPlay className="w-full max-h-[70vh]" />
        <div className="p-4 bg-card">
          <h2 className="text-base font-semibold text-foreground">{video.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{video.owner_name}</p>
          {video.description && <p className="text-sm text-muted-foreground mt-2">{video.description}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerDialog;
