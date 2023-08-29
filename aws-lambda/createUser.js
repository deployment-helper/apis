import { config } from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

config();

export const handler = async (event) => {
  const client = new DynamoDBClient({
    region: "ap-south-1",
  });

  const docClient = DynamoDBDocumentClient.from(client);
  const DEFAULT_PROJECT_NAME = "Dream";
  const command = new PutCommand({
    TableName: "users",
    Item: {
      email: "test-l1@example.com",
      userId: "test-l1",
      slideProjects: [
        {
          projectName: DEFAULT_PROJECT_NAME,
          // base64 unique_id, combination userId + current date time
          projectId: Buffer.from(
            `test-l1-${new Date().toISOString()}`
          ).toString("base64"),
        },
      ],
      updated_at: new Date().toISOString(),
    },
  });

  await docClient.send(command);
  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify(event),
  };
  return response;
};

export default handler;
