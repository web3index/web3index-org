# The Web3 Index

The Web3 Index reports on the fees being paid Web3 networks in an effort to showcase real usage across the Web3 stack. Stay up to date on the latest Web3 trends whether you’re a supply-side participant keeping tabs on in-demand networks, a developer interested in building on top of the most promising Web3 infrastructure, or simply a crypto-enthusiast passionate about the Web3 movement.

Unlike most indexes in defi (a sector of web3) that use market capitalization or ["total locked value (TLV)"](https://messari.io/article/how-to-interpret-total-value-locked-tvl-in-defi), The Web3 Index uses a [fundamental index methodology](https://en.wikipedia.org/wiki/Fundamentally_based_indexes). A key belief behind the fundamental index methodology is that underlying valuation figures (i.e. network revenue and usage) are more accurate estimators of a network's intrinsic value, rather than the listed market value of the project. In the spirit of this methodology, you won't see any token prices on The Web3 Index.

## Project Integration Instructions

In order for a project to be considered for the index, its revenue data must be surfaced in a format that's consumable by the application. This data can be provided using one of several different methods.

### Method #1: The Graph (recommended)

If the project you'd like to add to the index is built on Ethereum or any other blockchain supported by The Graph, we recommend adding it to The Web3 Index subgraph. You can find the subgraph [here](https://github.com/web3index/subgraph) and instructions on how to add a project's revenue data to it [here](https://thegraph.com/docs/introduction).

Once you've successfully added your project to the subgraph, make sure to add the project to the Web3 Index [registry](./registry.json) using its subgraph protocol entity id as the key and set its `subgraph` field to `true`.

### Method #2: The Web3 Index Database

If a project's blockchain is not supported by The Graph, you can index its revenue data using the Web Index's own database.

Step 1: Create an API endpoint inside `api/cron/[your_project_name]/index.ts`. This endpoint will get called every 30 minutes by a cron job. When called, it should store the project's revenue data using the [Prisma](https://www.prisma.io/docs/concepts/components/prisma-client/crud) ORM according to the database [schema](./prisma/schema.prisma).

Step 2: Add your project to the Web3 Index [registry](./registry.json) using the project and directory name you created. Make sure to set the set its `subgraph` field to `false`.

### Method #3: A Publically Accessible API Endpoint

If a project's blockchain is not supported by The Graph _and_ you can't use the Web3 Index's own database for some reason, you can provide revenue data via your own publically accessible API endpoint. Its json response should return data in the following format, updated at least twice a day:

```
{
  // Revenue should be denominated in USD at time of payout
  "revenue": {
    "now": 61779.07, // total revenue as of now
    "oneDayAgo": 60579.17, // total revenue as of 1 day ago
    "twoDaysAgo": 60390.5, // total revenue as of two days ago
    "oneWeekAgo": 58620.2, // total revenue as of one week ago
    "twoWeeksAgo": 53635.26 // total revenue as of two weeks ago
  },
  "days": [
    {
      "date": 1578960000, // timestamp representing start of day at 12:00 am UTC
      "revenue": 843.22 // total revenue accrued during this day
    }
    // provide as many days available, up to 1,000 until pagination is supported.
  ]
}
```

Once this endpoint is available add your project to the Web3 Index [registry](./registry.json), and include a `usage` field that points to your endpoint.

Note: your API codebase must be open sourced in order to be considered for the index.

## Running App Locally

First, install the project dependencies:

```bash
yarn
```

Next, rename `.env.example` to `.env` and replace `DATABASE_URL` with your own Postgres database url.

After that, run the Prisma ORM database schema migration tool:

```bash
npx prisma migrate dev --name init
```

Finally, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
