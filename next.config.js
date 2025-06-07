/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                port: '',
                pathname: '/**',
                search: '',
            },
            {
                protocol: 'https',
                hostname: 'heroui.com',
                port: '',
                pathname: '/**',
                search: '',
            },
        ],
    },
};

module.exports = nextConfig;
