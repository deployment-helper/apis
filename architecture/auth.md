# Architecture

## Authentication

We are using AWS cognito based authenticaion.

- Managing users on AWS
- Using AWS provided UI
- Having local apis to generate, refresh and revoke token
- Using database chaching to validate the token signature(periodic updation or manual with lamda function)[ not required as of now]
- We can also verify signature directly with flag based appraoch

## Backend Service

We are writing backend service in `Nest.js`. This backend service is a docker package that can be deployed to any 
container based service. We are using AWS apprunner.


## Frontend 

We are writing frontend in `Next.js` 

**Libraries** 

- Reveal.js 
- zustand
- Microsoft fluentui componentes 
- Tailwindcss (For gridding and basic layout)
- Microsoft fluentui theme for web application development 
- Griffel js library for styling 


## Database AWS dynamodb
We are using dynamodb database

## Storage

AWS S3 storage

## Automated audio creation GCP speach service 

## Automated Video recording 

## AWS lambda 

We are using AWS lambda to update user record in dynamodb 



**Useful links**

- https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html
