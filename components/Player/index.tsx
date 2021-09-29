import { useCallback, useEffect, useState } from "react";
import videojs from "video.js";
import "videojs-contrib-hls";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import Box from "../Box";

const Player = ({ src }) => {
  const [videoEl, setVideoEl] = useState(null);

  const onVideo = useCallback((el) => {
    setVideoEl(el);
  }, []);

  useEffect(() => {
    if (videoEl == null) return;
    const player = videojs(videoEl, {
      autoplay: true,
      controls: true,
      sources: [
        {
          src,
        },
      ],
    });

    player.hlsQualitySelector();
    player.ready(function () {
      const promise = player.play();

      if (promise !== undefined) {
        promise
          .then(function () {
            console.log("Autoplay started!");
            // Autoplay started!
          })
          .catch(function (error) {
            console.log(error);
            console.log("Autoplay was prevented");
          });
      }
    });
    player.on("error", () => {
      player.src(src);
    });
  }, [src, videoEl]);

  return (
    <>
      <Box
        as="video"
        css={{ width: "100%", height: "calc(100vh - 164px)" }}
        id="video"
        muted
        ref={onVideo}
        className="h-full w-full video-js vjs-theme-city"
        controls
        playsInline
      />
    </>
  );
};

export default Player;
