import { Injectable } from '@nestjs/common';
import { Firestore, Query, Timestamp } from '@google-cloud/firestore';

@Injectable()
export class FirestoreService {
  private readonly db: Firestore;

  constructor() {
    // TODO: Add the project id to the config
    this.db = new Firestore({
      projectId: 'chat-gpt-videos',
    });
  }

  async add(collection: string, data: any) {
    const docRef = this.db.collection(collection).doc();
    await docRef.set({
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // read value from this docRef
    const doc = await docRef.get();
    return { ...doc.data(), id: docRef.id };
  }

  async update(collection: string, id: string, data: any) {
    const docRef = this.db.collection(collection).doc(id);
    const keysToDelete = ['id', 'createdAt']; // Add the keys you want to delete

    keysToDelete.forEach((key) => {
      delete data[key];
    });

    await docRef.update(
      { ...data, updatedAt: Timestamp.now() },
      { merge: true },
    );
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
    const keysToDelete = ['id', 'createdAt']; // Add the keys you want to delete

    keysToDelete.forEach((key) => {
      delete data[key];
    });

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
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
    } else if (sceneArrayIndex) {
      scenes[sceneArrayIndex] = {
        ...scenes[sceneArrayIndex],
        ...data,
        updatedAt: Timestamp.now(),
      };
    } else if (Array.isArray(data)) {
      data.forEach((scene) => {
        scenes.push({
          ...scene,
          updatedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
        });
      });
    } else {
      scenes.push({
        ...data,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
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

  async fixCreatedAtAndUpdatedAt(collection: string) {
    const snapshot = await this.db.collection(collection).get();

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      // Check if `createdAt` is stored as an object
      if (data.createdAt && data.createdAt._seconds) {
        // Convert `_seconds` and `_nanoseconds` to Firestore Timestamp
        const createdAtTimestamp = new Timestamp(
          data.createdAt._seconds,
          data.createdAt._nanoseconds,
        );

        // Update the document with the new `createdAt` as a Firestore Timestamp
        await this.db.collection(collection).doc(doc.id).update({
          createdAt: createdAtTimestamp,
        });
      }
    });
  }
}
