import { Injectable } from '@nestjs/common';
import { Firestore, Query } from '@google-cloud/firestore';

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
  async listByFields(
    collection: string,
    filters: { field: string; value: any }[],
  ) {
    let query: Query = this.db.collection(collection);

    filters.forEach((filter) => {
      query = query.where(filter.field, '==', filter.value);
    });

    const snapshot = await query.orderBy('createdAt', 'desc').get();

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
    data: any | Array<any>,
    sceneArrayIndex?: string,
    addAfter?: boolean,
  ) {
    const doc = await this.get(collection, sceneDocId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const scenes = doc.scenes;

    // Add new empty scene after sceneArrayIndex

    if (addAfter && sceneArrayIndex) {
      scenes.splice(Number(sceneArrayIndex) + 1, 0, {
        ...data,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    } else if (sceneArrayIndex) {
      scenes[sceneArrayIndex] = {
        ...scenes[sceneArrayIndex],
        ...data,
        updatedAt: new Date(),
      };
    } else if (Array.isArray(data)) {
      data.forEach((scene) => {
        scenes.push({
          ...scene,
          updatedAt: new Date(),
          createdAt: new Date(),
        });
      });
    } else {
      scenes.push({
        ...data,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    }

    return await this.update(collection, sceneDocId, { scenes });
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

  async deleteScene(
    collection: string,
    sceneDocId: string,
    sceneArrayIndex: number,
  ) {
    const doc = await this.get(collection, sceneDocId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const scenes = doc.scenes;

    scenes.splice(sceneArrayIndex, 1);

    return this.update(collection, sceneDocId, { scenes });
  }
}
