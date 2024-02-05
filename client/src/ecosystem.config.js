module.exports = {
    apps: [{
      name: "HamLog",
      script: "npm",
      args: "start",
      env: {
        PORT: 4000, // Set your desired port here
        NODE_ENV: "development",
      }
    }]
  };
  