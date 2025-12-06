const js = require("@eslint/js");
const next = require("eslint-config-next");
const tseslint = require("typescript-eslint");

module.exports = [
  {
    ignores: ["**/*.css", "node_modules/**", ".next/**"],
  },
  js.configs.recommended,
  ...next,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-var-requires": "off",
      "jsx-a11y/media-has-caption": "off",
      "jsx-a11y/label-has-associated-control": [
        "error",
        {
          labelComponents: [],
          labelAttributes: [],
          controlComponents: [],
          assert: "either",
          depth: 25,
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
