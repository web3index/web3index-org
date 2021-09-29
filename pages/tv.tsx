import Player from "../components/Player";
import { useQuery } from "react-query";
import axios from "axios";
import Layout from "../layouts/tv";
import OldTV from "../components/OldTV";
import { useRef } from "react";

const TV = () => {
  const { isLoading, data } = useQuery(
    "tv",
    async () => {
      const res = await axios.get(
        "/api/stream/c6e78bdc-867d-4e1f-8fb3-9f24954b882e"
      );
      return res.data;
    },
    {
      // Refetch the data every 4 seconds
      refetchInterval: 4000,
    }
  );

  const playerRef = useRef(null);

  const videoJsOptions = {
    // lookup the options in the docs for more options
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: "https://cdn.livepeer.com/hls/c6e7en1y2trfc941/index.m3u8",
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    player.hlsQualitySelector();

    // you can handle player events here
    player.on("waiting", () => {
      console.log("player is waiting");
    });

    player.on("dispose", () => {
      console.log("player will dispose");
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <OldTV />
      </Layout>
    );
  }
  return (
    <Layout>
      {data.isActive ? (
        <Player options={videoJsOptions} onReady={handlePlayerReady} />
      ) : (
        <OldTV />
      )}
    </Layout>
  );
};

export default TV;
