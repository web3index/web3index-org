import Box from "../Box";
import Link from "next/link";
import { ArrowRightIcon } from "@modulz/radix-icons";

import { styled } from "../../stitches.config";

const TitleLink = styled(Link, {
  display: "block",
  textDecoration: "none",
  color: "$hiContrast",
  "&:hover": {
    textDecoration: "underline",
  },
});
const ReadMoreLink = styled(Link, {
  display: "flex",
  alignItems: "center",
  color: "$blue",
  textDecoration: "none",
});

const BlogCard = ({ title, date, abstract, slug }) => {
  return (
    <Box
      css={{
        mb: "$4",
        pb: "$5",
        px: "$4",
        borderBottom: "1px solid",
        borderColor: "$border",
        width: "100%",
        "&:last-child": {
          border: 0,
          mb: 0,
        },
        "@bp2": {
          maxWidth: 800,
          mx: "auto",
          pb: "$5",
          mb: "$5",
        },
      }}>
      <TitleLink href={`/blog/${slug}`}>
        <Box
          as="h2"
          css={{
            mt: 0,
            fontSize: "$4",
            mb: "$3",
            "@bp2": {
              fontSize: "$5",
            },
          }}>
          {title}
        </Box>
      </TitleLink>
      <Box css={{ fontSize: "$2", opacity: 0.7, mb: "$4" }}>{date}</Box>
      <Box as="p" css={{ mb: "$4", lineHeight: "28px" }}>
        {abstract}
      </Box>
      <ReadMoreLink href={`/blog/${slug}`}>
        <Box css={{ mr: "$2" }}>Read More</Box>
        <ArrowRightIcon />
      </ReadMoreLink>
    </Box>
  );
};

export default BlogCard;
