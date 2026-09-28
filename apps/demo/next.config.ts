import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@loan-calculators/core"],
  // Monorepo: trace from workspace root for file tracing
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
