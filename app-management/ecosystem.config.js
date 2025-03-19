module.exports = {
  apps: [
    {
      name: 'image-generation',
      script: './dist/apps/image-generation/main.js',
      env: {
        PORT: 9191,
      },
    },
  ],
};
