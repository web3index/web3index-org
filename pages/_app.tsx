import { lightThemeClass, globalCss } from "../stitches.config";
import { ThemeProvider } from "next-themes";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";
import { IdProvider } from "@radix-ui/react-id";
import { pageview } from "../lib/utils";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import "@videojs/themes/dist/fantasy/index.css";
import "../css/tv.scss";
import "../css/video.js.css";

const queryClient = new QueryClient();

const globalStyles = globalCss({
  body: {
    margin: 0,
    backgroundColor: "$loContrast",
    color: "$hiContrast",
  },

  "body, button": {
    fontFamily: "$sans",
  },

  svg: { display: "block" },

  pre: { margin: 0 },

  "::selection": {
    backgroundColor: "$violet300",
  },

  "@font-face": {
    fontFamily: "Whyte Inktrap",
    src: 'url("/fonts/whyte/inktrap-heavy.woff2") format("woff2"), url("/fonts/whyte/inktrap-heavy.woff") format("woff")',
    fontWeight: 900,
    fontStyle: "normal",
    fontDisplay: "block",
  },
});

const App = ({ Component, pageProps }) => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      pageview(url);
    };
    //When the component is mounted, subscribe to router changes
    //and log those page views
    router.events.on("routeChangeComplete", handleRouteChange);

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  globalStyles();

  return (
    <IdProvider>
      <ThemeProvider
        disableTransitionOnChange
        attribute="class"
        defaultTheme="dark"
        value={{ light: lightThemeClass.className }}
      >
        <QueryClientProvider client={queryClient}>
          <DefaultSeo {...SEO} />
          <Component {...pageProps} />
        </QueryClientProvider>
      </ThemeProvider>
    </IdProvider>
  );
};

export default App;
