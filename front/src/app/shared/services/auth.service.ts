import { Injectable, NgZone } from '@angular/core';
import { User, UserCollection } from '../models/user';
import * as auth from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { arrayUnion  } from '@angular/fire/firestore';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public currentUserData: any;
  userData: any; 
  public userCollection: BehaviorSubject<any> = new BehaviorSubject({});
  constructor(
    public afs: AngularFirestore,
    public afAuth: AngularFireAuth, 
    public router: Router,
    public ngZone: NgZone, 
  ) {
    
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user')!);
        this.router.navigate(['home']);
      } else {
        localStorage.setItem('user', 'null');
        JSON.parse(localStorage.getItem('user')!);
        localStorage.setItem('user_collection', 'null');
        JSON.parse(localStorage.getItem('user_collection')!);
      }
    });
  }
  
  SignIn(email: string, password: string) {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.SetUserData(result.user);
        //@ts-ignore
        if(result.additionalUserInfo.isNewUser) {
          console.log('new user')
          this.SetUserCollectionDataDataOnFirstLogin(result.user);
        } else {
          this.SetUserCollectionData(result.user);
        }
        this.ngZone.run(() => {
          this.router.navigate(['home']);
        });
      })
      .catch((error) => {
        window.alert(error.message);
      });
  }
  
  SignUp(email: string, password: string) {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        this.SendVerificationMail();
        this.SetUserData(result.user);
        //@ts-ignore
        if(result.additionalUserInfo.isNewUser) {
          console.log('new user')
          this.SetUserCollectionDataDataOnFirstLogin(result.user);
        } else {
          this.SetUserCollectionData(result.user);
        }
      })
      .catch((error) => {
        window.alert(error.message);
      });
  }
  
  SendVerificationMail() {
    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['verify-email-address']);
      });
  }
  
  ForgotPassword(passwordResetEmail: string) {
    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent, check your inbox.');
      })
      .catch((error) => {
        window.alert(error);
      });
  }
  
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user !== null && user.emailVerified !== false ? true : false;
  }
  
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider()).then((res: any) => {
      if (res) {
        this.router.navigate(['home']);
      }
    });
  }
  
  AuthLogin(provider: any) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.SetUserData(result.user);
        //@ts-ignore
        if(result.additionalUserInfo.isNewUser) {
          console.log('new user')
          this.SetUserCollectionDataDataOnFirstLogin(result.user);
        } else {
          this.SetUserCollectionData(result.user);
        }
        this.ngZone.run(() => {
          this.router.navigate(['home']);
        });
      })
      .catch((error) => {
        window.alert(error);
      });
  }
  
  SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );

    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
    
    return userRef.set(userData, {
      merge: true,
    });
  }

  SetUserCollectionDataDataOnFirstLogin(user: any) {
    if (!user || !user.uid) {
      console.error('Invalid user data');
      return Promise.reject('Invalid user data');
    }
    
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${user.uid}`
    );

    const userData: UserCollection = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified || false,
      numberOfAddedBuckets: 0,
      numberOfAddedStates: 0,
      buckets: [],
      states: []
    };
    
    this.setData(userData);
    return userRef.set(userData);
  }

  SetUserCollectionData(user: any) {
    if (!user || !user.uid) {
      console.error('Invalid user data');
      return;
    }
    
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${user.uid}`
    );

    const attemptLoad = (retries = 3) => {
      userRef.valueChanges().pipe(take(1)).subscribe(res => {
        if (res) {
          this.setData(res);
          userRef.set(res);
          this.userCollection.next(res);
        } else if (retries > 0) {
          console.log(`User collection not found, retrying... (${retries} attempts left)`);
          setTimeout(() => attemptLoad(retries - 1), 1000);
        } else {
          console.error('No user collection data found in Firestore after retries');
          this.SetUserCollectionDataDataOnFirstLogin(user);
        }
      });
    };
    
    attemptLoad();
  }

  SignOut() {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('user_collection');
      this.router.navigate(['sign-in']);
    });
  }

  async getUserCollection() {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users_collection/${this.userData.uid}`
    );
    return userRef.valueChanges();
  }

  setData(data: any) {
    localStorage.setItem('user_collection', JSON.stringify(data));
  }
}