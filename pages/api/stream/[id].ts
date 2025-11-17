import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * calls the /stream/<id> route of Livepeer.com APIs to get the stream's status to verify that the stream is live or not.
 * isActive: true means video segments are currently being ingested by Livepeer.com. isActive: false means the live stream is idle and no
 * video segments are currently being ingested by Livepeer.com.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const streamId = req.query.id;
  if (!streamId || Array.isArray(streamId)) {
    res.status(400).json({ error: "A stream id is required" });
    return;
  }

  try {
    const streamStatusResponse = await axios.get(
      `https://livepeer.com/api/stream/${streamId}`,
      {
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.LIVEPEER_COM_API_KEY}`,
        },
      },
    );

    if (streamStatusResponse?.data) {
      res.status(200).json(streamStatusResponse.data);
    } else {
      res.status(502).json({ error: "Unexpected response from Livepeer" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : error });
  }
}
