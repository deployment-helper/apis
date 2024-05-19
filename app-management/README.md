# App-management

This is a collection of all APIs for youtube video generation project` project.

Domains will cover

- Auth/authorization

## Development

**Run database**
run docker compose file

**TODO: Add docker compose setup to run this project**

`npm run start:dev`

### Prerequisites

**TODO**

### Run App server

`docker build -t app-management .`
`docker run -p 9000:9000  --env-file ./.env app-management`


### Run batch server

`docker build -f Dockerfile.batch-service -t batch-server .`
`docker run -p 9000:9000  --env-file ./.env batch-server`
