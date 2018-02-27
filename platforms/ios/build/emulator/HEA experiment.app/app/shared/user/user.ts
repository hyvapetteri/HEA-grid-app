import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

/*
  Generated class for the UserProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UserProvider {
  private _username: string;
  private _age: number;
  private _gender: string;

  constructor() {
  }

  get username():string {
    return this._username;
  }

  set username(newname:string) {
    this._username = newname;
  }

  get age():number {
    return this._age;
  }

  set age(newage:number) {
    this._age = newage;
  }

  get gender():string {
    return this._gender;
  }

  set gender(gen:string) {
    this._gender = gen;
  }

}
