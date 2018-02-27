import { Component } from '@angular/core';
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as fs from "tns-core-modules/file-system";
import { RouterExtensions } from "nativescript-angular/router";
import { TouchGestureEventData } from "ui/gestures";
import { TNSPlayer } from 'nativescript-audio';

import { SessionProvider } from '../../shared/session/session';

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
  private answerButtonPressed: boolean;

  private enablePlay: boolean;
  private enableAnswer: boolean;

  private player: TNSPlayer;
  private audioPath: string;

  private volume: number;
  private turns: number[];
  private direction: number;
  private max_turns: number;

  private volumeUpdateTimerId: number;

  constructor(private sessionProvider: SessionProvider,
              private routerExtensions: RouterExtensions) {

    this.enablePlay = false;
    this.enableAnswer = false;
    this.answerButtonPressed = false;

    this.turns = [];
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
    this.answerButtonText = 'Push'
  }

  onButtonTouch(args: TouchGestureEventData) {
    if (args.action == 'down') {
      this.answerButtonPressed = true;
      this.turns.push(this.volume);
      this.direction = -1;
      this.answerButtonText = 'Hold';
    } else if (args.action == 'up') {
      this.answerButtonPressed = false;
      this.turns.push(this.volume);
      this.direction = 1;
      this.answerButtonText = 'Push';
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
    this.turns = [];
  }

  finish() {
    let avg_threshold = 0;
    let n_last_turns = 6;
    for (let i = this.turns.length - 1; i >= this.turns.length - n_last_turns; i--) {
      avg_threshold = avg_threshold + this.turns[i];
    }
    console.log('sum: ' + avg_threshold + ', n: ' + n_last_turns);
    avg_threshold = avg_threshold / n_last_turns;
    this.sessionProvider.threshold = avg_threshold;
    console.log('Turns: ' + JSON.stringify(this.turns));
    console.log('Threshold: ' + avg_threshold);
    this.routerExtensions.navigate(["/experiment"], {clearHistory: true});
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
