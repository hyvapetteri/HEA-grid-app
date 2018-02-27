import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

@Injectable()
export class SessionProvider {
  private _username: string;
  private _test_frequency: number;
  private _threshold: number;

  constructor() {
  }

  get username():string {
    return this._username;
  }

  set username(newname:string) {
    this._username = newname;
  }

  get testFrequency():number {
    return this._test_frequency;
  }

  set testFrequency(newfreq:number) {
    this._test_frequency = newfreq;
  }

  get threshold():number {
    return this._threshold;
  }

  set threshold(th:number) {
    this._threshold = th;
  }

}
