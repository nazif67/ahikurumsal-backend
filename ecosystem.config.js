module.exports = {
  apps: [
    {
      name: "ahikurumsal-backend",
      script: "npm",
      args: "start",
      cwd: "/home/ahikurumsal-backend",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    }
  ]
};
