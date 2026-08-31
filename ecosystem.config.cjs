module.exports = {
  apps: [
    {
      name: "liveshare-backend",
      cwd: "../liveshare-backend",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
