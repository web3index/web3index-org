import Box from "../Box";

const ProjectHeader = ({ color, ...props }) => {
  return (
    <Box
      css={{
        background: color,
        height: 150,
        width: "100%",
      }}
      {...props}
    />
  );
};

export default ProjectHeader;
