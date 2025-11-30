import { Injectable } from '@angular/core';
import { Bucket} from '../models/bucket';
import { arrayUnion  } from '@angular/fire/firestore';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BucketService {
  public userUid: string = '';
  public userBuckets: BehaviorSubject<any> = new BehaviorSubject({});

  constructor(public afs: AngularFirestore) {
    const user = localStorage.getItem('user');
    if (user && user !== 'null') {
      this.userUid = JSON.parse(user).uid;
    }
  }

  async updateUserBuckets(name: string) {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      console.error('No user logged in');
      return;
    }
    this.userUid = JSON.parse(user).uid;

    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userUid}`
    );

    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return;
    }
    const userData = JSON.parse(userCollectionData);

    const numberOfAddedBuckets = userData.numberOfAddedBuckets + 1;
    userData.numberOfAddedBuckets = numberOfAddedBuckets;

    const bucket: Bucket =  {
      id: numberOfAddedBuckets,
      name: name,
      date: new Date().toLocaleString(),
      imageUrls: [],
      inUse: 1,
      isSaved: 0
    };

    userData.buckets.push(bucket);
    
    const userDataToSave = this.serializeUserData(userData);
    userRef.set(userDataToSave);
    this.setData(userData);
    return userData.buckets;
  }

  async saveUserBucket(bucketId: number) {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      console.error('No user logged in');
      return;
    }
    this.userUid = JSON.parse(user).uid;

    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userUid}`
    );

    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return;
    }
    const userData = JSON.parse(userCollectionData);

    for(let i = 0; i < userData.buckets.length; i++) {
      if(userData.buckets[i].id == bucketId) userData.buckets[i].isSaved = 1;
    }

    const userDataToSave = this.serializeUserData(userData);
    userRef.set(userDataToSave);
    this.setData(userData);
    return userData.buckets;
  }

  async closeUserBucket(bucketId: number) {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      console.error('No user logged in');
      return;
    }
    this.userUid = JSON.parse(user).uid;

    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userUid}`
    );

    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return;
    }
    const userData = JSON.parse(userCollectionData);
    
    for(let i = 0; i < userData.buckets.length; i++) {
      if(userData.buckets[i].id == bucketId) userData.buckets[i].inUse = 0;
    }

    const userDataToSave = this.serializeUserData(userData);
    userRef.set(userDataToSave);
    this.setData(userData);
    return userData.buckets;
  }

  async destroyUserBucket(bucketId: number) {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      console.error('No user logged in');
      return;
    }
    this.userUid = JSON.parse(user).uid;

    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userUid}`
    );

    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return;
    }
    const userData = JSON.parse(userCollectionData);

    for(let i = 0; i < userData.buckets.length; i++) {
      if(userData.buckets[i].id == bucketId) {
        userData.buckets.splice(i, 1);
      }
    }

    const userDataToSave = this.serializeUserData(userData);
    userRef.set(userDataToSave);
    this.setData(userData);
    return userData.buckets;
  }

  async openUserBucket(bucketId: number) {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      console.error('No user logged in');
      return;
    }
    this.userUid = JSON.parse(user).uid;

    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userUid}`
    );

    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return;
    }
    const userData = JSON.parse(userCollectionData);

    for(let i = 0; i < userData.buckets.length; i++) {
      if(userData.buckets[i].id == bucketId) {
        userData.buckets[i].inUse = 1;
      }
    }

    const userDataToSave = this.serializeUserData(userData);
    userRef.set(userDataToSave);
    this.setData(userData);
    return userData.buckets;
  }

  async addImageToBucket(bucketId: number, imageUrl: string) {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      console.error('No user logged in');
      return;
    }
    this.userUid = JSON.parse(user).uid;

    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userUid}`
    );

    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return;
    }
    const userData = JSON.parse(userCollectionData);

    for(let i = 0; i < userData.buckets.length; i++) {
      if(userData.buckets[i].id == bucketId) userData.buckets[i].imageUrls.push(imageUrl);
    }

    const userDataToSave = this.serializeUserData(userData);
    userRef.set(userDataToSave);
    this.setData(userData);
    return userData.buckets;
  }

  setData(data: any) {
    localStorage.setItem('user_collection', JSON.stringify(data));
  }

  private serializeUserData(userData: any): any {
    return {
      ...userData,
      states: userData.states ? userData.states.map((state: any) => ({
        ...state,
        nodes: state.nodes ? this.serializePolygons(state.nodes) : []
      })) : []
    };
  }

  private serializePolygons(nodes: any[]): any[] {
    return nodes.map(node => {
      const serialized: any = {
        ...node
      };
      
      if (node.polygons) {
        serialized.polygons = typeof node.polygons === 'string' 
          ? node.polygons
          : JSON.stringify(node.polygons);
      } else {
        serialized.polygons = '[]';
      }
      
      if (node.similarityValue && Array.isArray(node.similarityValue)) {
        if (node.similarityValue.length > 0 && Array.isArray(node.similarityValue[0])) {
          serialized.similarityValue = node.similarityValue.flat();
        }
      }
      
      if (node.locationsData && Array.isArray(node.locationsData)) {
        if (node.locationsData.length > 0 && Array.isArray(node.locationsData[0])) {
          serialized.locationsData = node.locationsData.flat();
        }
      }
      
      const arrayFields = [
        'textsQuery', 'imagesQuery', 'imagesIds', 'textsIds',
        'imagesSimilarities', 'textsSimilarities'
      ];
      
      arrayFields.forEach(field => {
        if (node[field] && Array.isArray(node[field])) {
          if (node[field].length > 0 && Array.isArray(node[field][0])) {
            serialized[field] = node[field].flat();
          }
        }
      });
      
      return serialized;
    });
  }
}