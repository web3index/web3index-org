# The Web3 Index

The Web3 Index reports on the fees being paid into web3 network protocols in an
effort to showcase real usage across the web3 stack. Stay up to date on the
latest web3 trends whether you're a supply-side participant keeping tabs on
in-demand networks, a developer interested in building on top of the most
promising web3 infrastructure, or simply a crypto-enthusiast passionate about
the web3 movement.

Unlike most indexes in defi (a sector of web3) that weight listings based on
market capitalization or
["total value locked (TVL)"](https://messari.io/article/how-to-interpret-total-value-locked-tvl-in-defi),
The Web3 Index uses a
[fundamental index methodology](https://en.wikipedia.org/wiki/Fundamentally_based_indexes).
A key belief behind the fundamental index methodology is that underlying
valuation figures (i.e. network fees and usage) are more accurate estimators of
a network's intrinsic value, rather than the listed market value of the
protocol.

## Protocol Application Instructions

### Step 1: Submit an application

As the web3 ecosystem of applications continues to grow, there's been a surge in
interest to be listed on this site. In order for a protocol to be considered for
the index, we ask that you first submit
[this application](https://github.com/web3index/web3index-org/issues/new?assignees=&labels=&template=protocol_submission.md&title=New+Protocol+Submission).

### Step 2: Complete an integration

Protocol fee data must be surfaced in a format that's consumable by The Web3
Index site. This data can be provided using one of several different methods.

#### Method #1: The Graph (recommended)

If the protocol you'd like to add to the index is built on Ethereum or any other
blockchain supported by The Graph, we recommend adding it to The Web3 Index
subgraph. You can find the subgraph
[here](https://github.com/web3index/subgraph) and instructions on how to add a
protocol's fee data to it
[here](https://thegraph.com/docs/developer/quick-start).

Once you've successfully added your protocol to the subgraph, make sure to add
the protocol to the Web3 Index [registry](./registry.json) using its subgraph
protocol entity id as the key and set its `subgraph` field to `true`.

#### Method #2: The Web3 Index Database

If a protocol's blockchain is not supported by The Graph, you can index its fee
data using the Web Index's own database.

Step 1: Create a command line script inside `cmd/[your_protocol_name].ts`. This
endpoint will get called every hour by a Github action (create your Github
action in `.github/workflows/[your_protocol_name].yml`). When executed, it
should store the protocol's paid fees using the
[Prisma](https://www.prisma.io/docs/concepts/components/prisma-client/crud) ORM
according to the database [schema](./prisma/schema.prisma).

Step 2: Add your protocol to The Web3 Index [registry](./registry.json) using
the protocol and directory name you created. Make sure to set the set its
`subgraph` field to `false`.

#### Method #3: A Publically Accessible API Endpoint

If a protocol's blockchain is not supported by The Graph _and_ you can't use the
Web3 Index's own database for some reason, you can provide fee data via your own
publically accessible API endpoint. Its json response should return data in the
following format, updated at least twice a day:

```json
{
  // Revenue should be denominated in USD at time of payout
  "revenue": {
    "now": 61779.07, // total revenue as of now
    "oneDayAgo": 60579.17, // total revenue as of 1 day ago
    "twoDaysAgo": 60390.5, // total revenue as of two days ago
    "oneWeekAgo": 58620.2, // total revenue as of one week ago
    "twoWeeksAgo": 53635.26 // total revenue as of two weeks ago
    "thirtyDaysAgo": 48620.2, // total revenue as of thirty days ago
    "sixtyDaysAgo": 33635.26 // total revenue as of sixty days ago,
    "ninetyDaysAgo": 23635.26 // total revenue as of ninety days ago
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

Once this endpoint is available add your protocol to The Web3 Index
[registry](./registry.json), and include a `usage` field that points to your
endpoint.

Note: your API codebase must be open sourced in order to be considered for the
index.

## Running App Locally

Install dependencies (using the pinned Node/Yarn toolchain):

```bash
nvm use
npm install -g corepack
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn install
```

Copy `.env.example` to `.env` and fill all required values (database URL, API
keys, subgraph env variables).

### Provision a local Postgres database

If you don't already have Postgres running, the quickest option is to spin up a
disposable Docker container:

```bash
docker run --name web3index-postgres \
  -e POSTGRES_USER=web3index \
  -e POSTGRES_PASSWORD=web3index \
  -e POSTGRES_DB=web3index \
  -p 5432:5432 \
  -d postgres:15
```

Then point Prisma to it via `.env`:

```bash
DATABASE_URL="postgresql://web3index:web3index@localhost:5432/web3index?schema=public"
```

You can stop/remove the container when you're done:

```bash
docker stop web3index-postgres
docker rm web3index-postgres
```

### Prisma CLI on OpenSSL 3 hosts

Prisma's migration/schema engines expect OpenSSL 1.1 by default. On newer
distros (Ubuntu ≥22.04, Debian ≥12, etc.) only OpenSSL 3 is available, so we
ship `yarn` scripts that download and point Prisma to the OpenSSL-3 compatible
binaries for you:

```bash
# Install client w/ OpenSSL 3 engine
yarn prisma:generate:ossl3
# Run migrations with OpenSSL 3 engine
yarn prisma:migrate:dev:ossl3 --name init
```

If you're deploying migrations, use `yarn prisma:migrate:ossl3` instead.

(You only need to re-run the `prisma:generate:ossl3` script after deleting
`node_modules` or upgrading Prisma.)

Then run the development server (use `yarn dev:ossl3` on hosts that require the
OpenSSL 3 engine):

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

## Running the `cmd` import scripts locally

1. Configure env vars (`DATABASE_URL`, `CMC_API_KEY`, `POKTSCAN_API_KEY`, etc.),
   run the relevant Prisma commands (`yarn prisma:generate` / `yarn pry:generate:ossl3`,
   `yarn prisma:migrate:dev` / `yarn prisma:migrate:dev:ossl3`) depending on your host.
2. Run the desired importer via the helper scripts:

   ```bash
   DATABASE_URL=postgres://... yarn cmd cmd/pocket.ts
   ```

   On OpenSSL‑3 hosts use `yarn cmd:ossl3 cmd/pocket.ts`. Swap `cmd/pocket.ts`
   for `cmd/akash.ts`, `cmd/arweave.ts`, or `cmd/filecoin.ts` as needed.
3. Optional debugging aids:
   - `DEBUG=prisma:query` or `PRISMA_LOG_LEVEL=info` for verbose Prisma logs.
   - `NODE_OPTIONS="--inspect-brk" yarn cmd cmd/akash.ts` (or `yarn cmd:ossl3 cmd/akash.ts`)
     to use the Node inspector.
   - `psql "$DATABASE_URL" -c 'select date, revenue from "Day" where "projectId" = … order by date desc limit 5'` (or `yarn prisma studio`) to confirm results.

These scripts mirror the scheduled GitHub Actions jobs, so a successful local run means the cron run will behave the same.
