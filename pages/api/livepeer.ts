import { NextApiRequest, NextApiResponse } from "next";
import { getUsageFromSubgraph } from "../../lib/utils";

export const getProject = async () => {
  const usage = await getUsageFromSubgraph("livepeer");
  const project = {
    name: "Livepeer",
    category: "Service Protocol",
    subcategory: "Compute, Video",
    blockchain: "Ethereum",
    stack: "Middleware",
    everestID: "0x49f6e21a4e3f20580624669acd83dac39a339042",
    image: "https://explorer.livepeer.org/img/logos/logo-circle-green.svg",
    color: "#00eb88",
    symbol: "LPT",
    usage,
  };
  return project;
};

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProject();
  res.json(project);
};

export default handler;
