# Deploying image Application to Production

## 1. Build the Nest.js Application

Ensure your project is built for production by running:

```bash
npm run build
```


**Run the Nest.js App**
Start tmux session 

```bash
tmux new -s image-generation
```
Start the application with pm2:

We are created a `ecosystem.config.js` file in the root of the project to configure the pm2 process manager. 

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

start tmux session for ngrock

```bash
tmux new -s ngrok
```

start ngrok

```bash
ngrok http 9191
```

close the tmux session

```bash
ctrl+b d
```

