import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  constructor() {
    this.init();
  }

  init() {
    const schema = {
      key: "schema",
      number_of_queries: 0,
      query: [],
    };
    this.setGlobal(schema);

    const embedding_link = {
      key: "embedding_link",
      value: "link"
    }
    this.setGlobal(embedding_link);

    const embedding_search_mode = {
      key: "embedding_search_mode",
      value: "simple search"
    }
    this.setGlobal(embedding_search_mode);

    this.setGlobal(embedding_link);
    const main_embedding = {
      key: "main_embedding",
      value: "images"
    }
    this.setGlobal(main_embedding);

    const embedding_selection = {
      key: "embedding_selection",
      value: "pan"
    }
    this.setGlobal(embedding_selection);
  };

  getGlobal(key: string): any {
    if (key === null) {
      console.log(`getGlobal --> Ivalid key: ${key}`);
      return undefined;
    }

    const value = sessionStorage.getItem(key);
    if (value === null) {
      console.log(`getGlobal --> Key not found: ${key}`);
      return undefined;
    }

    return JSON.parse(value);
  }

  setGlobal(object: any) {
    sessionStorage.setItem(object.key, JSON.stringify(object));
  }
}

