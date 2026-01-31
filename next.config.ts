import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    experimental: {
        turbopack: {
            root: '.',
        }
    } as any
};

export default nextConfig;
