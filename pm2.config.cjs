module.exports = {
  apps: [
    {
      name: "whop-message-server",
      script: "src/server.ts",
      interpreter: "node",
      node_args: ["-r", "ts-node/register", "--max-old-space-size=256", "--expose-gc"],
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      min_uptime: "10s",
      max_restarts: 5,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "whop-updater",
      script: "src/updater.ts",
      interpreter: "node",
      node_args: ["-r", "ts-node/register", "--max-old-space-size=256", "--expose-gc"],
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      min_uptime: "10s",
      max_restarts: 5,
      env: {
        NODE_ENV: "production"
      }
    },
  ],
};


