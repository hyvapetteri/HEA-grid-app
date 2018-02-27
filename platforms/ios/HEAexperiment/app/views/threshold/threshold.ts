import { Component } from '@angular/core';
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as fs from "tns-core-modules/file-system";
import { RouterExtensions } from "nativescript-angular/router";
import { TouchGestureEventData } from "ui/gestures";
import { TNSPlayer } from 'nativescript-audio';

import { UserProvider } from '../../shared/user/user';

declare var NSURL;

function db2a(db:number) {
  return Math.pow(10, db/20);
}

@Component({
  moduleId: module.id,
  selector: 'page-threshold',
  templateUrl: './threshold.html',
  styleUrls: ['./threshold.css']
})
export class ThresholdPage {
  private instructionText: string;
  private answerButtonText: string;
  private playButtonText: string;

  private enablePlay: boolean;
  private enableAnswer: boolean;

  private player: TNSPlayer;
  private audioPath: string;

  private volume: number;
  private turns: number[];
  private direction: number;
  private max_turns: number;

  private volumeUpdateTimerId: number;

  constructor(private userProvider: UserProvider,
              private routerExtensions: RouterExtensions) {

    this.enablePlay = false;
    this.enableAnswer = false;

    this.max_turns = 10;

    this.player = new TNSPlayer();

    let appPath = fs.knownFolders.currentApp();
    this.audioPath = fs.path.join(appPath.path, 'audio');
    console.log(this.audioPath);

    this.player.initFromFile({
      audioFile: fs.path.join(this.audioPath, 'f1000_ref.wav'),
      loop: true
    }).then(() => {
      this.enablePlay = true;
    }).catch(err => this.showError(err));

    this.reset();
    this.instructionText = 'Press play to start';
  }

  onButtonTouch(args: TouchGestureEventData) {
    if (args.action == 'down') {
      this.turns.push(this.volume);
      this.direction = -1;
    } else if (args.action == 'up') {
      this.turns.push(this.volume);
      this.direction = 1;
    }
    if (this.turns.length >= this.max_turns) {
      this.player.pause().then(() => {
        clearInterval(this.volumeUpdateTimerId);
        this.instructionText = 'Done';
        this.finish();
      });
    }
  }

  play() {
    if (this.player.isAudioPlaying()) {
      this.player.pause().then(() => {
        clearInterval(this.volumeUpdateTimerId);
        this.reset();
        this.instructionText = 'Reset. Press play to start again.';
      });
    } else {
      this.direction = 1;
      this.player.play().then(() => {
        this.volumeUpdateTimerId = setInterval(() => this.updateVolume(), 100);
        this.enableAnswer = true;
        this.playButtonText = 'Reset';
        this.instructionText = "When you hear a sound, press the button and keep it pressed until you can't hear it anymore. Then release and repeat.";
      });
    }
  }

  updateVolume() {
    this.volume = db2a(this.direction * 0.3) * this.volume;
    this.player.volume = this.volume;
  }

  reset() {
    this.playButtonText = 'Play';
    this.enableAnswer = false;
    this.volume = db2a(-40);
    this.player.volume = this.volume;
  }

  finish() {
    let avg_threshold = 0;
    for (let i = 0; i < this.turns.length; i++) {
      avg_threshold = avg_threshold + this.turns[i];
    }
    avg_threshold = avg_threshold / this.turns.length;
  }

  showError(err) {
    dialogs.alert({
      title: 'Error',
      message: err,
      okButtonText: 'Close'
    }).then(() => {
      // pass
    });
  }
}
