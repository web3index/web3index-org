import { NextApiRequest, NextApiResponse } from "next";
import { getUsageFromSubgraph } from "../../lib/utils";

export const getProject = async () => {
  const usage = await getUsageFromSubgraph("thegraph");
  const project = {
    name: "The Graph",
    category: "Service Protocol",
    subcategory: "Bandwidth, Indexing",
    blockchain: "Ethereum",
    stack: "Middleware",
    symbol: "GRT",
    everestID: "0xda80bd825c1272de7b99d0b0a5e8a6d3df129165",
    image: "https://cryptologos.cc/logos/the-graph-grt-logo.svg",
    color: "#6f4cff",
    usage,
  };
  return project;
};

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProject();
  res.json(project);
};

export default handler;
