import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
@Injectable()
export class FirestoreService {
  private readonly db: Firestore;

  constructor() {
    this.db = new Firestore({
      projectId: 'chat-gpt-videos',
    });
  }

  async add(collection: string, data: any) {
    const docRef = this.db.collection(collection).doc();
    await docRef.set({ ...data, createdAt: new Date(), updatedAt: new Date() });
    // read value from this docRef
    const doc = await docRef.get();
    return { ...doc.data(), id: docRef.id };
  }

  async update(collection: string, id: string, data: any) {
    const docRef = this.db.collection(collection).doc(id);
    await docRef.update({ ...data, updatedAt: new Date() }, { merge: true });
    // read value from this docRef
    const doc = await docRef.get();
    return { ...doc.data(), id: docRef.id };
  }

  // list all documents in a collection
  async list<T>(collection: string): Promise<T[]> {
    const snapshot = await this.db.collection(collection).get();
    return snapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    }) as T[];
  }

  // get a document by id
  async get<T>(collection: string, id: string): Promise<T> {
    const doc = await this.db.collection(collection).doc(id).get();
    const data = doc.data();
    return !!data ? ({ ...data, id: doc.id } as T) : null;
  }

  // get all documents in a collection by a field
  async listByField(collection: string, field: string, value: any) {
    const snapshot = await this.db
      .collection(collection)
      .where(field, '==', value)
      .orderBy('createdAt')
      .get();

    return snapshot.docs
      .map((doc) => {
        return { ...doc.data(), id: doc.id };
      })
      .filter(
        (doc: any) => doc.isDeleted === false || doc.isDeleted === undefined,
      );
  }

  async updateScene(
    collection: string,
    sceneDocId: string,
    data: any,
    sceneArrayIndex?: string,
  ) {
    const doc = await this.get(collection, sceneDocId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const scenes = doc.scenes;

    if (sceneArrayIndex) {
      scenes[sceneArrayIndex] = {
        ...scenes[sceneArrayIndex],
        ...data,
        updatedAt: new Date(),
      };
    } else {
      scenes.push({
        ...data,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    }

    return this.update(collection, sceneDocId, { scenes });
  }

  async changeScenePosition(
    collection: string,
    sceneDocId: string,
    sceneArrayIndex: number,
    newPosition: number,
  ) {
    const doc = await this.get(collection, sceneDocId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const scenes = doc.scenes;

    const scene = scenes.splice(sceneArrayIndex, 1)[0];
    scenes.splice(newPosition, 0, scene);

    return this.update(collection, sceneDocId, { scenes });
  }
}
