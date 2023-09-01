import { v4 as uuid } from 'uuid';
import { IProject, IUserWithProjectTypes, ProjectTypes } from 'src/types';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { USER_TABLE_NAME } from 'src/constants';

export class ProjectModel implements IProject {
  projectId: string;
  projectName: string;

  constructor(name: string) {
    this.projectName = name;
    this.projectId = uuid();
  }

  toJson() {
    return {
      projectId: this.projectId,
      projectName: this.projectName,
    };
  }
}

export class UserModel implements IUserWithProjectTypes {
  public static readonly tableName: string = USER_TABLE_NAME;

  email: string;
  userId: string;
  name: string;
  updated_at: Date;
  [ProjectTypes.slideProjects]: Array<ProjectModel> = [];

  constructor(email: string, updated_at: Date, userId: string, name?: string) {
    this.email = email;
    this.updated_at = updated_at;
    this.userId = userId;
    this.name = name;
  }

  addProject(projectType: ProjectTypes, project: ProjectModel) {
    this[projectType].push(project);
  }

  toDynamoDbPutCommand() {
    const command = new PutCommand({
      TableName: UserModel.tableName,
      Item: {
        email: this.email,
        userId: this.userId,
        updated_at: this.updated_at.toISOString(),
        name: this.name || '',
        [ProjectTypes.slideProjects]: this[ProjectTypes.slideProjects].map(
          (p) => p.toJson(),
        ),
      },
    });

    return command;
  }

  public static toDynamoDbGetItemCommand(email: string) {
    const command = new GetCommand({
      TableName: UserModel.tableName,
      Key: {
        email: email,
      },
    });

    return command;
  }
}
