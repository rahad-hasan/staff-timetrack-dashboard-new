module.exports = {
  apps: [
    // ==============================
    // 3️⃣ Next.js Dashboard
    // ==============================
    {
      name: "dashboard",
      cwd: "/var/www/dashboard",

      // IMPORTANT: Next.js must be built already
      script: "npm",
      args: "run start",
      interpreter: "none",

      exec_mode: "cluster",
      instances: 2,

      watch: false,
      autorestart: true,

      max_memory_restart: "800M",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 3000,

      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "127.0.0.1",
      },

      time: true,
    },
  ],
};
