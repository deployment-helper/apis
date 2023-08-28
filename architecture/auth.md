# Architecture of authentication service

We are using AWS cognito based authenticaion.

- Managing users on AWS
- Using AWS provided UI
- Having local apis to generate, refresh and revoke token
- Using database chaching to validate the token signature(periodic updation or manual with lamda function)[ not required as of now]
- We can also verify signature directly with flag based appraoch

**Useful links**

- https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html
