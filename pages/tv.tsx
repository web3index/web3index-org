import Player from "../components/Player";
import { useQuery } from "react-query";
import axios from "axios";
import Layout from "../layouts/tv";
import OldTV from "../components/OldTV";

const TV = () => {
  const { isLoading, data } = useQuery(
    "tv",
    async () => {
      const res = await axios.get(
        "/api/stream/0bb8feda-e95e-4afb-81b3-b9746be1dbf1",
      );
      return res.data;
    },
    {
      // Refetch the data every 5 seconds
      refetchInterval: 5000,
    },
  );

  const videoJsOptions = {
    // lookup the options in the docs for more options
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: "https://cdn.livepeer.com/hls/0bb8j4ngs9bf0nf3/index.m3u8",
        type: "application/x-mpegURL",
      },
    ],
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
      {data.isActive ? <Player options={videoJsOptions} /> : <OldTV />}
    </Layout>
  );
};

export default TV;
