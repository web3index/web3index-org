import { NextApiRequest, NextApiResponse } from "next";
import { getProject } from "../../../lib/utils";

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProject(_req.query.id);
  res.json(project);
};

export default handler;
