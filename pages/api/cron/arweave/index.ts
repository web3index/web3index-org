import { NextApiRequest, NextApiResponse } from "next";

// TODO: update Arweave daily revenue data
// a cron job should hit this endpoint every half hour or so (can use github actions for cron)
export default async (_req: NextApiRequest, res: NextApiResponse) => {
  // Use the updatedAt field in the Day model and compare it with the
  // timestamp associated with the fee, if it's less than the timestamp
  // then update the day's revenue
  res.status(200).json({});
};
