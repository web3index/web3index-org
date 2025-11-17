import { NextApiResponse } from "next";

const FOUR_HOURS_IN_SECONDS = 4 * 60 * 60;
const FIFTEEN_MINUTES_IN_SECONDS = 15 * 60;

/**
 * Applies shared Cache-Control headers so Vercel's edge cache can serve
 * responses for up to four hours while asynchronously revalidating.
 */
export const setProjectCacheHeaders = (res: NextApiResponse) => {
  res.setHeader(
    "Cache-Control",
    `s-maxage=${FOUR_HOURS_IN_SECONDS}, stale-while-revalidate=${FIFTEEN_MINUTES_IN_SECONDS}`,
  );
};
