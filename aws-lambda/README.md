# AWS Lambda functions

## How to create layer

Build image `docker build . -t aws-layer`

Run image `docker run --name aws-layer aws-layer`

copy `node_modules` to `dist` ` docker cp aws-layer:/app/node_modules ./dist/nodejs/node_modules`

Goto dist fodler `cd ./dist`

Zip `nodejs`` folder

Upload this zip to AWS layer

Check this https://docs.aws.amazon.com/lambda/latest/dg/packaging-layers.html for more information
