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
        "/api/stream/c6e78bdc-867d-4e1f-8fb3-9f24954b882e"
      );
      return res.data;
    },
    {
      // Refetch the data every 4 seconds
      refetchInterval: 4000,
    }
  );

  if (isLoading) {
    return (
      <Layout>
        <OldTV />
      </Layout>
    );
  }
  if (data.isActive) {
    return (
      <Layout>
        <Player src="https://cdn.livepeer.com/hls/c6e7en1y2trfc941/index.m3u8" />
      </Layout>
    );
  }
  return (
    <Layout>
      <OldTV />
    </Layout>
  );
};

export default TV;
