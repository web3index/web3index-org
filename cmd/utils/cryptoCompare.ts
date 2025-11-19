import axios from "axios";

const endpoint = "https://min-api.cryptocompare.com/data/pricehistorical";
const histoDayEndpoint = "https://min-api.cryptocompare.com/data/v2/histoday";
const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
const cache = new Map<string, number>();
const MIN_REQUEST_INTERVAL_MS = 1200; // stay within both free + key plans
const RATE_LIMIT_RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 5;
let lastRequestTime = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForRateLimit = async () => {
  if (!MIN_REQUEST_INTERVAL_MS) {
    return;
  }
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();
};

const normalizeTimestamp = (timestamp: number) => {
  return Math.floor(timestamp / 86400) * 86400;
};

export const fetchCryptoComparePrice = async (
  symbol: string,
  timestamp: number,
) => {
  const upperSymbol = symbol.toUpperCase();
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  const cacheKey = `${upperSymbol}-${normalizedTimestamp}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const url = `${endpoint}?fsym=${upperSymbol}&tsyms=USD&ts=${normalizedTimestamp}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await waitForRateLimit();
    const { data } = await axios.get<Record<string, Record<string, number>>>(
      url,
      {
        headers: apiKey ? { Authorization: `Apikey ${apiKey}` } : undefined,
      },
    );

    const response = data as any;
    if (
      typeof response?.Response === "string" &&
      response.Response.toLowerCase() === "error"
    ) {
      const message =
        response?.Message?.toString() ?? "Unknown CryptoCompare error";
      if (
        !apiKey &&
        message.toLowerCase().includes("rate limit") &&
        attempt < MAX_RETRIES - 1
      ) {
        await sleep(RATE_LIMIT_RETRY_DELAY_MS);
        continue;
      }

      throw new Error(
        `CryptoCompare error: ${message}. Add CRYPTOCOMPARE_API_KEY or try again later.`,
      );
    }

    const price = data?.[upperSymbol]?.USD;
    if (!Number.isFinite(price)) {
      throw new Error("No price returned by CryptoCompare.");
    }

    cache.set(cacheKey, Number(price));
    return Number(price);
  }

  throw new Error(
    "CryptoCompare: exhausted retries due to rate limits. Consider adding CRYPTOCOMPARE_API_KEY.",
  );
};

type HistoDayPoint = {
  time: number;
  close?: number;
  high?: number;
  low?: number;
};

type HistoDayResponse = {
  Response?: string;
  Message?: string;
  Data?: {
    Data: HistoDayPoint[];
  };
};

export const fetchCryptoCompareDailyPrices = async (
  symbol: string,
  startTimestamp: number,
  endTimestamp: number,
) => {
  const upperSymbol = symbol.toUpperCase();
  const normalizedStart = normalizeTimestamp(startTimestamp);
  const normalizedEnd = normalizeTimestamp(endTimestamp);
  if (normalizedEnd < normalizedStart) {
    throw new Error(
      "fetchCryptoCompareDailyPrices: endTimestamp < startTimestamp",
    );
  }

  const results = new Map<number, number>();
  let currentEnd = normalizedEnd;

  while (currentEnd >= normalizedStart) {
    const remainingDays =
      Math.floor((currentEnd - normalizedStart) / 86400) + 1;
    const limit = Math.min(2000, remainingDays);
    const url = `${histoDayEndpoint}?fsym=${upperSymbol}&tsym=USD&toTs=${currentEnd}&limit=${limit}`;

    await waitForRateLimit();
    const { data } = await axios.get<HistoDayResponse>(url, {
      headers: apiKey ? { Authorization: `Apikey ${apiKey}` } : undefined,
    });

    if (
      typeof data?.Response === "string" &&
      data.Response.toLowerCase() === "error"
    ) {
      const message = data?.Message ?? "Unknown CryptoCompare error";
      throw new Error(
        `CryptoCompare histoday error: ${message}. Add CRYPTOCOMPARE_API_KEY or try again later.`,
      );
    }

    const points = data?.Data?.Data ?? [];
    if (!points.length) {
      break;
    }

    for (const point of points) {
      const time = normalizeTimestamp(point.time ?? 0);
      if (time < normalizedStart || time > normalizedEnd) {
        continue;
      }
      if (results.has(time)) {
        continue;
      }
      const price = Number(point.close ?? point.high ?? point.low ?? 0);
      if (Number.isFinite(price)) {
        results.set(time, price);
      }
    }

    const earliest = points[0]?.time;
    if (!Number.isFinite(earliest) || earliest <= normalizedStart) {
      break;
    }
    currentEnd = normalizeTimestamp((earliest as number) - 86400);
  }

  return results;
};
