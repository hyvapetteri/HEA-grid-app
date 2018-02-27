import { Component } from '@angular/core';
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as fs from "tns-core-modules/file-system";
import { RouterExtensions } from "nativescript-angular/router";

import { UserProvider } from '../../shared/user/user';

@Component({
  moduleId: module.id,
  selector: 'page-start',
  templateUrl: './start.html',
  styleUrls: ['./start.css']
})
export class StartPage {
  private age: string;
  private name: string;

  private submitted: boolean;
  private age_invalid: boolean;
  private name_invalid: boolean;

  constructor(private userProvider: UserProvider,
              private routerExtensions: RouterExtensions) {

    this.submitted = false;
    this.age_invalid = true;
    this.name_invalid = true;
  }

  startEvaluation() {
    this.submitted = true;
    let age_number = Number.parseInt(this.age);
    console.log('Age: ' + this.age + ' is integer: ' + Number.isInteger(age_number) + ' type of: ' + typeof(age_number));
    if (!this.age || !Number.isInteger(age_number)) {
      this.age_invalid = true;
    } else {
      this.age_invalid = false;
    }
    if (!this.name) {
      this.name_invalid = true;
    } else {
      this.name_invalid = false;
    }

    if (this.age_invalid || this.name_invalid) {
      return
    }

    this.userProvider.age = age_number;
    this.userProvider.username = this.name;

    let docsFolder = fs.knownFolders.documents();
    let fileHandle = docsFolder.getFile('participants.txt');
    fileHandle.readText().then((subjects: string) => {
      let fullList = subjects.concat('subj: ' + this.name + ', age: ' + this.age + '\n');
      return fileHandle.writeText(fullList);
    }).then(() => {
      return dialogs.alert({
        title: 'Thank you!',
        message: 'Your participant ID is ' + this.name + '.',
        okButtonText: 'OK'
      });
    }).then(() => {
      this.routerExtensions.navigate(["/experiment"], {clearHistory: true});
    }).catch(err => {
      console.log(err);
    });
  }

  showActionSheet() {
    dialogs.action({
      title: 'Send the results',
      message: 'version 0.1',
      cancelButtonText: 'Cancel',
      actions: ['Send with email']
    }).then((result: string) => {
      console.log(result);
    });
  }

  sendResults() {

  }

}
