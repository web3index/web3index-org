import { darkThemeClass, global } from "../stitches.config";
import { ThemeProvider } from "next-themes";

const globalStyles = global({
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

  "@font-face": [
    {
      fontFamily: "Whyte Inktrap",
      src:
        'url("/fonts/whyte/inktrap-bold.woff2") format("woff2"), url("/fonts/whyte/inktrap-bold.woff") format("woff")',
      fontWeight: 700,
      fontStyle: "normal",
      fontDisplay: "block",
    },
    {
      fontFamily: "Whyte Inktrap",
      src:
        'url("/fonts/whyte/inktrap-heavy.woff2") format("woff2"), url("/fonts/whyte/inktrap-heavy.woff") format("woff")',
      fontWeight: 900,
      fontStyle: "normal",
      fontDisplay: "block",
    },
  ],
});

const App = ({ Component, pageProps }) => {
  globalStyles();

  return (
    <ThemeProvider
      disableTransitionOnChange
      attribute="class"
      defaultTheme="system"
      value={{ dark: darkThemeClass.className }}
    >
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default App;
