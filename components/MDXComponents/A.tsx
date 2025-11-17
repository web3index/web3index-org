import Link from "next/link";

const A = ({ children, href }) => {
  return <Link href={href}>{children}</Link>;
};

export default A;
