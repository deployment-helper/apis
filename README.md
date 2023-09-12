# APIs

This is a mono repo repository for backend services. 

**Architecture** 
![Arhitecture Design](./Architecture%20Design.jpg)

In the current architecture, we employ Next.js and Nest.js frameworks, and integrate them with AWS Cognito for authentication. Specifically, GitHub authentication is facilitated through a custom OIDC service. The project also utilizes various AWS services such as Lambda, S3, DynamoDB, SNS, and SQS. Additionally, Google Cloud's Text-to-Speech service is used, along with local infrastructure, to achieve end-to-end workflow.
