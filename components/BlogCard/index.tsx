import Box from "../Box";
import Link from "next/link";
import { ArrowRightIcon } from "@modulz/radix-icons";

const BlogCard = ({ title, date, abstract, slug }) => {
  return (
    <Box
      css={{
        mb: "$4",
        pb: "$5",
        px: "$4",
        borderBottom: "1px solid",
        borderColor: "$border",
        "&:last-child": {
          border: 0,
          mb: 0,
        },
        "@bp2": {
          px: 380,
          pb: "$5",
          mb: "$5",
        },
      }}
    >
      <Link href={`/blog/${slug}`} passHref>
        <Box
          as="a"
          css={{
            textDecoration: "none",
            color: "$hiContrast",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          <Box
            as="h2"
            css={{
              mt: 0,
              fontSize: "$4",
              mb: "$3",
              "@bp2": {
                fontSize: "$5",
              },
            }}
          >
            {title}
          </Box>
        </Box>
      </Link>
      <Box css={{ fontSize: "$2", opacity: 0.7, mb: "$4" }}>{date}</Box>
      <Box as="p" css={{ mb: "$4", lineHeight: "28px" }}>
        {abstract}
      </Box>
      <Link href={`/blog/${slug}`} passHref>
        <Box
          as="a"
          css={{
            display: "flex",
            alignItems: "center",
            color: "$blue",
            textDecoration: "none",
          }}
        >
          <Box css={{ mr: "$2" }}>Read More</Box>
          <ArrowRightIcon />
        </Box>
      </Link>
    </Box>
  );
};

export default BlogCard;
