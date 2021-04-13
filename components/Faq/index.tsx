import Box from "../Box";
import Markdown from "../Markdown";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@modulz/radix-icons";
import { styled } from "../../stitches.config";
import { filterCssFromProps } from "../../lib/utils";
import ReactMarkdown from "react-markdown";

const AccordionChevron = styled(ChevronDownIcon, {
  transition: "transform 300ms",
  "[data-state=open] &": {
    transform: "rotate(180deg)",
  },
});

const Item = ({ emoji, question, answer }) => (
  <Box
    as={Accordion.Item}
    value={emoji}
    css={{
      borderBottom: "1px solid",
      borderColor: "$border",
      h3: {
        m: 0,
      },
      "&:last-child": {
        borderBottom: 0,
      },
    }}
  >
    <Box as={Accordion.Header} css={{ margin: 0 }}>
      <Box
        as={Accordion.Button}
        css={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "transparent",
          border: "none",
          py: "$4",
          outline: "none",
          flex: 1,
          textAlign: "left",
          background: "transparent",
          my: 0,
          width: "100%",
          fontSize: "$4",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        <Box
          css={{
            display: "flex",
            color: "$hiContrast",
            alignItems: "center",
            mr: "auto",
          }}
        >
          <Box css={{ mr: "$3" }}>
            <Box role="img" aria-label="What is Web3">
              {emoji}
            </Box>
          </Box>
          {question}
        </Box>
        <AccordionChevron />
      </Box>
    </Box>
    <Box
      as={Accordion.Panel}
      css={{ pb: "$3", mb: 0, fontSize: "$3", lineHeight: "$4" }}
    >
      {answer}
    </Box>
  </Box>
);

const Faq = ({ items, ...props }) => {
  return (
    <Box
      css={{ maxWidth: 600, mx: "auto", ...props?.css }}
      {...filterCssFromProps(props)}
    >
      <Accordion.Root type="single" defaultValue="🌐">
        {items.map((item, i) => (
          <Markdown key={i}>
            <Item
              emoji={item.data.emoji}
              question={item.data.title}
              answer={<ReactMarkdown source={item.content} />}
            />
          </Markdown>
        ))}
      </Accordion.Root>
    </Box>
  );
};

export default Faq;
