module.exports = {
  apps: [
    {
      name: "whop-message-server",
      script: "src/server.ts",
      interpreter: "node",
      node_args: ["-r", "ts-node/register"],
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: "whop-updater",
      script: "src/updater.ts",
      interpreter: "node",
      node_args: ["-r", "ts-node/register"],
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};


