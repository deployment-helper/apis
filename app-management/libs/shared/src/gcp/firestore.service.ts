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
    await docRef.set(data);
    // read value from this docRef
    const doc = await docRef.get();
    return { ...doc.data(), id: docRef.id };
  }

  async update(collection: string, id: string, data: any) {
    const docRef = this.db.collection(collection).doc(id);
    await docRef.update(data);
    // read value from this docRef
    const doc = await docRef.get();
    return { ...doc.data(), id: docRef.id };
  }

  // list all documents in a collection
  async list(collection: string) {
    const snapshot = await this.db.collection(collection).get();
    return snapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });
  }

  // get a document by id
  async get(collection: string, id: string) {
    const doc = await this.db.collection(collection).doc(id).get();
    const data = doc.data();
    return !!data ? { ...data, id: doc.id } : null;
  }
}
