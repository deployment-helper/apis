import { Injectable } from '@nestjs/common';
import { DynamodbClientService } from './dynamodb.service';
import PresentationCreateDto from 'src/slides/slides.dto';
import PresentationModel from 'src/models/presentation.model';
import { IPresentation } from 'src/types';

@Injectable()
export class PresentationEntity {
  private tableName = 'presentations';

  constructor(private db: DynamodbClientService) {}

  create(
    pres: PresentationCreateDto,
    userId: string,
    id: string,
    s3FileName: string,
  ) {
    const presentation = new PresentationModel(
      id,
      userId,
      pres.name,
      pres.projectId,
      s3FileName,
      '',
    );

    return this.db.send(presentation.toDynamoDbPutCommand());
  }

  list(projectId: string) {
    const query = PresentationModel.toQuery(projectId);
    return this.db.send(query);
  }

  updateAuidoStatus(pres: IPresentation): Promise<any> {
    const command = PresentationModel.toUpdateAudioGenerated(pres);
    return this.db.send(command);
  }

  getItem(pid: string, updateAt: number): Promise<any> {
    return this.db.send(PresentationModel.getItem(pid, updateAt));
  }
}
