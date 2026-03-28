module.exports = {
  apps: [
    // ==============================
    // 3️⃣ Next.js Dashboard
    // ==============================
    {
      name: "dashboard",
      cwd: "/var/www/dashboard",

      script: "node_modules/next/dist/bin/next",
      args: "start",

      exec_mode: "cluster",
      instances: 2,

      watch: false,
      autorestart: true,

      max_memory_restart: "800M",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
      listen_timeout: 8000,

      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "127.0.0.1",
      },

      time: true,
    },
  ],
};
