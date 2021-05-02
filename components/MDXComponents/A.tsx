import Box from "../Box";
import Link from "next/link";

const A = ({ children, href }) => {
  return (
    <Link href={href} passHref>
      <Box as="a">{children}</Box>
    </Link>
  );
};

export default A;
