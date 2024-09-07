import { v4 as uuid } from 'uuid';
import {
  IProject,
  IUserWithProjectTypes,
  ProjectTypes,
} from '@apps/app-management/types';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { USER_TABLE_NAME } from '@apps/app-management/constants';

export class ProjectModel implements Partial<IProject> {
  id: string;
  projectName: string;

  constructor(name: string) {
    this.projectName = name;
    this.id = uuid();
  }

  toJson() {
    return {
      projectId: this.id,
      projectName: this.projectName,
    };
  }
}

export class UserModel implements IUserWithProjectTypes {
  public static readonly tableName: string = USER_TABLE_NAME;

  email: string;
  userId: string;
  name: string;
  updatedAt: Date;
  createdAt?: Date;
  [ProjectTypes.slideProjects]: Array<ProjectModel> = [];

  constructor(email: string, updatedAt: Date, userId: string, name?: string) {
    this.email = email;
    this.updatedAt = updatedAt;
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
        updatedAt: this.updatedAt.toISOString(),
        createdAt: this.createdAt?.toISOString() || '',
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
