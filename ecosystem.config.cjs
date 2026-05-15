module.exports = {
  apps: [
    {
      name: "liveshare",
      script: "server/dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
        SERVE_FRONTEND: "true",
      },
    },
  ],
};
