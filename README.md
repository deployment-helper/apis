# APIs

This is a mono repo repository for backend services. 

**Architecture** 
![Arhitecture Design](./Architecture%20Design.jpg)

**Technology Stack**

- React
- Javascript
- Typescrip
- Nest.js
- Next.js
- Node.js
- AWS Lambda
- AWS S3
- AWS Dynamodb
- Docker
- GCP Cloud run 
- GCP text to speeach
- Radis 


In the current architecture, we deploy 

- **Next.js** 
- **Nest.js** 

frameworks, and integrate them with **AWS Cognito for authentication**. 

Specifically, GitHub authentication is facilitated through a custom OIDC service. 

The project also utilizes various AWS services such as **Lambda, S3, DynamoDB, SNS, and SQS**. Additionally, Google Cloud's **Text-to-Speech** service is used, along with local infrastructure, to achieve end-to-end workflow.
