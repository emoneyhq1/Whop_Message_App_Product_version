module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: __dirname,
      script: "node_modules/vite/bin/vite.js",
      args: "preview --host 0.0.0.0 --port 8882",
      interpreter: process.execPath,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
    }
  ]
};


