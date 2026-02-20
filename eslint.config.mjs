import nextConfig from "eslint-config-next";

const eslintConfig = [
  // Global ignores (replaces .eslintignore)
  {
    ignores: [".next/**", "node_modules/**"],
  },
  // Next.js native flat config (includes core-web-vitals)
  ...nextConfig,
];

export default eslintConfig;
