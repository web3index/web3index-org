import Box from "../Box";

const Markdown = ({ children }) => {
  return (
    <Box
      css={{
        details: {
          display: "block",
        },

        summary: {
          display: "list-item",
        },

        a: {
          backgroundColor: "initial",
          fontWeight: "500",
          color: "$blue",
          textDecoration: "none",
          "&:hover": {
            outlineWidth: "0",
            textDecoration: "underline",
          },
          "&:active": {
            outlineWidth: "0",
            textDecoration: "underline",
            opacity: "0.8",
          },
        },

        strong: {
          fontWeight: "600",
        },

        "code, kbd, pre": {
          fontFamily: "monospace, monospace",
          fontSize: "1em",
        },

        input: {
          font: "inherit",
          margin: "0",
          overflow: "visible",
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
        },

        '[type="checkbox"]': {
          boxSizing: "border-box",
          padding: "0",
        },

        "*": {
          boxSizing: "border-box",
          lineHeight: "28px",
        },

        table: {
          display: "block",
          width: "100%",
          overflow: "auto",
          borderSpacing: "0",
          borderCollapse: "collapse",
        },

        "td, th": {
          padding: 0,
        },

        "details summary": {
          cursor: "pointer",
        },

        kbd: {
          display: "inline-block",
          padding: "3px 5px",
          font:
            "11px SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
          lineHeight: "10px",
          color: "#444d56",
          verticalAlign: "middle",
          backgroundColor: "#fafbfc",
          border: "1px solid #d1d5da",
          borderRadius: "3px",
          boxShadow: "inset 0 -1px 0 #d1d5da",
        },

        p: {
          marginTop: "0",
          marginBottom: "$4",
        },

        ol: {
          listStyle: "decimal",
        },

        ul: {
          listStyle: "disc",
        },

        "ol, ul": {
          paddingLeft: "2em",
          marginTop: "0",
          marginBottom: "0",
        },

        "ol ol, ul ol": {
          listStyleType: "lower-roman",
        },

        "ol ol ol, ol ul ol, ul ol ol, ul ul ol": {
          listStyleType: "lower-alpha",
        },

        dd: {
          marginLeft: "0",
        },

        "code, pre": {
          fontFamily:
            "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
          fontSize: "12px",
        },

        pre: {
          marginTop: "0",
          marginBottom: "0",
          wordWrap: "normal",
        },

        "input::-webkit-inner-spin-button, input::-webkit-outer-spin-button": {
          margin: "0",
          WebkitAppearance: "none",
          appearance: "none",
        },

        hr: {
          borderBottomColor: "#eee",
          height: "0",
          margin: "15px 0",
          overflow: "hidden",
          background: "transparent",
          border: "0",
          borderBottom: "1px solid #dfe2e5",
          padding: "0",
          backgroundColor: "#e1e4e8",
          boxSizing: "initial",
          "&:after": {
            display: "table",
            content: '""',
            clear: "both",
          },
          "&:befre": {
            display: "table",
            content: '""',
          },
        },

        "> :first-of-type": {
          marginTop: "0 !important",
        },

        "> :last-child": {
          marginBottom: "0 !important",
        },

        "a:not([href])": {
          color: "inherit",
          textDecoration: "none",
        },

        "blockquote, details, dl, ol, p, pre, table, ul": {
          marginTop: "0",
          marginBottom: "$4",
        },

        "pre > .codeblock-pre-container": {
          marginBottom: "0",
        },

        blockquote: {
          padding: "0 1em",
          color: "#6a737d",
          borderLeft: "0.25em solid #dfe2e5",
          mt: 0,
          ml: 0,
          mr: 0,
          mb: 5,
        },

        "blockquote > :first-of-type": {
          marginTop: "0",
        },

        "blockquote > :last-child": {
          marginBottom: "0",
        },

        h1: {
          fontSize: "40px",
          mb: "32px",
          "&:not(:first-of-type)": {
            mt: "72px",
          },
        },

        h2: {
          fontSize: "32px",
          mb: "24px",
          "&:not(:first-of-type)": {
            mt: "40px",
          },
        },

        h3: {
          fontSize: "24px",
          mb: "18px",
          "&:not(:first-of-type)": {
            mt: "48px",
          },
        },

        "h1, h2, h3, h4, h5, h6": {
          fontWeight: "bold",
          fontFamily: "$sans",
          textRendering: "optimizeLegibility",
          marginTop: "24px",
          lineHeight: "1.25",
        },

        "ol ol, ol ul, ul ol, ul ul": {
          marginTop: "0",
          marginBottom: "0",
        },

        "li > p": {
          marginTop: "16px",
        },

        "li + li": {
          marginTop: "0.25em",
        },

        dl: {
          padding: "0",
        },

        "dl dt": {
          padding: "0",
          marginTop: "16px",
          fontSize: "1em",
          fontStyle: "italic",
          fontWeight: "600",
        },

        "dl dd": {
          padding: "0 16px",
          marginBottom: "16px",
        },

        "table th": {
          fontWeight: "600",
        },

        "table td, table th": {
          padding: "6px 13px",
          border: "1px solid #dfe2e5",
        },

        "table tr": {
          backgroundColor: "#fff",
          borderTop: "1px solid #c6cbd1",
        },

        "table tr:nth-of-type(2n)": {
          backgroundColor: "#f6f8fa",
        },

        code: {
          padding: "0.2em 0.4em",
          margin: "0",
          fontSize: "85%",
          backgroundColor: "rgba(27, 31, 35, 0.05)",
          borderRadius: "3px",
        },

        "pre > code": {
          padding: "0",
          margin: "0",
          fontSize: "100%",
          wordBreak: "normal",
          whiteSpace: "pre",
          background: "transparent",
          border: "0",
        },

        ".highlight": {
          marginBottom: "16px",
        },

        ".highlight pre": {
          marginBottom: "0",
          wordBreak: "normal",
        },

        ".highlight pre, pre": {
          padding: "16px",
          overflow: "auto",
          fontSize: "16px",
          lineHeight: "1.45",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: "16px",
        },

        "pre code": {
          display: "inline",
          maxWidth: "auto",
          padding: "0",
          margin: "0",
          overflow: "visible",
          lineHeight: "inherit",
          wordWrap: "normal",
          backgroundColor: "initial",
          border: "0",
        },
        "p:first-of-type .dropcap": {
          float: "left",
          fontSize: "5rem",
          fontWeight: "bold",
          lineHeight: "3.5rem",
          margin: "0",
          padding: "0.8rem 0.8rem 0.8rem 0",
        },
        ".invisible": {
          clip: "rect(1px, 1px, 1px, 1px)",
          height: "1px",
          overflow: "hidden",
          position: "absolute",
          top: "auto",
          whiteSpace: "nowrap",
          width: "1px",
        },
      }}
    >
      {children}
    </Box>
  );
};

export default Markdown;
