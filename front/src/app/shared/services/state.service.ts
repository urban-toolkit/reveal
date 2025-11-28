import { Injectable } from '@angular/core';
import { State } from '../models/state';
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
export class StateService {
  public userUid: string = '';
  public userStates: BehaviorSubject<any> = new BehaviorSubject({});

  constructor(public afs: AngularFirestore) {
    const user = localStorage.getItem('user');
    if (user && user !== 'null') {
      this.userUid = JSON.parse(user).uid;
    }
  }

  async saveUserStates(name: string, forceGraphData: any) {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      console.error('No user logged in');
      return;
    }
    this.userUid = JSON.parse(user).uid;

    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userUid}`
    );
    forceGraphData.nodes.forEach((node: any) => { node.fy = 0 });

    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return;
    }
    const userData = JSON.parse(userCollectionData);
    
    const links: any = [];
    for(let i = 0; i < forceGraphData.links.length; i++) {
      links.push({ source: forceGraphData.links[i].source.id, target: forceGraphData.links[i].target.id});
    }
    
    const serializedNodes = this.serializePolygons(forceGraphData.nodes);
    
    const state: State =  {
      id: userData.numberOfAddedStates,
      name: name,
      date: new Date().toLocaleString(),
      nodes: serializedNodes,
      links:  links
    };
    
    const numberOfAddedStates = userData.numberOfAddedStates + 1;
    userData.numberOfAddedStates = numberOfAddedStates;
    userData.states.push(state);
    userRef.set(userData);
    this.setData(userData);
    return userData.states;
  }

  async updateUserStates(name: string, forceGraphData: any) {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      console.error('No user logged in');
      return;
    }
    this.userUid = JSON.parse(user).uid;

    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userUid}`
    );
    forceGraphData.nodes.forEach((node: any) => { node.fy = 0 });
    
    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return;
    }
    const userData = JSON.parse(userCollectionData);

    const links: any = [];
    for(let i = 0; i < forceGraphData.links.length; i++) {
      links.push({ source: forceGraphData.links[i].source.id, target: forceGraphData.links[i].target.id});
    }

    const serializedNodes = this.serializePolygons(forceGraphData.nodes);

    for(let i = 0; i < userData.states.length; i++) {
      if(userData.states[i].name == name) {
        const state: State =  {
          id: userData.states[i].id,
          name: userData.states[i].name,
          date: userData.states[i].date,
          nodes: serializedNodes,
          links: links
        };
        userData.states[i] = state 
      }
    }

    userRef.set(userData);
    this.setData(userData);
    return userData.states;
  }

  async destroyState(stateId: number) {
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

    for(let i = 0; i < userData.states.length; i++) {
      if(userData.states[i].id == stateId) {
        userData.states.splice(i, 1);
      }
    }

    userRef.set(userData);
    this.setData(userData);
    return userData.states;
  }

  getSavedState(stateId: number) {
    const userCollectionData = localStorage.getItem('user_collection');
    if (!userCollectionData || userCollectionData === 'null') {
      console.error('No user collection data found');
      return null;
    }
    const userData = JSON.parse(userCollectionData);
    
    for(let i = 0; i < userData.states.length; i++) {
      if(userData.states[i].id == stateId) {
        const state = userData.states[i];
        state.nodes = this.deserializePolygons(state.nodes);
        return state;
      }
    }
    return null;
  }

  setData(data: any) {
    localStorage.setItem('user_collection', JSON.stringify(data));
  }

  private serializePolygons(nodes: any[]): any[] {
    return nodes.map(node => ({
      ...node,
      polygons: node.polygons ? JSON.stringify(node.polygons) : '[]'
    }));
  }

  private deserializePolygons(nodes: any[]): any[] {
    return nodes.map(node => ({
      ...node,
      polygons: node.polygons ? JSON.parse(node.polygons) : []
    }));
  }
}
