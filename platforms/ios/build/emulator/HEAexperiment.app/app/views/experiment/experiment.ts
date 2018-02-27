import { Component } from '@angular/core';
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as fs from "tns-core-modules/file-system";

import { UserProvider } from '../../shared/user/user';
import { RouterExtensions } from 'nativescript-angular/router';

import { TNSPlayer } from 'nativescript-audio';

import { environment } from '../../config/environment';
import { sound_config } from './experiment-config';

declare var NSURL;

@Component({
  moduleId: module.id,
  selector: 'page-experiment',
  templateUrl: './experiment.html',
  styleUrls: ['./experiment.css']
})
export class ExperimentPage {

  private volume: number;
  private soundIndex: number;
  private trialNumber: number;
  private soundId: string;
  private soundCategory: string;
  private uid: string;
  private audioPath: string;
  private volumeIcon: string;
  private player: TNSPlayer;
  private sounds: Array<any>;

  private isCorrect: boolean;

  private playButtonText: string;
  private instructionText: string;
  private enablePlay: boolean;
  private enableAnswer: boolean;
  private answered: boolean;

  private logFilePath: string;
  private experimentLogText: Array<string> = [];

  constructor(private userProvider: UserProvider,
              private routerExtensions: RouterExtensions) {

    this.player = new TNSPlayer();
    let appPath = fs.knownFolders.currentApp();
    this.audioPath = fs.path.join(appPath.path, 'audio');
    console.log(this.audioPath);

    this.sounds = sound_config;

    for (let i = this.sounds.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [this.sounds[i], this.sounds[j]] = [this.sounds[j], this.sounds[i]];
    }

    this.soundIndex = 0;
    this.trialNumber = 0;
    this.loadSound();

    this.playButtonText = "Play next";
    this.instructionText = "Press play button to hear the sound.";

    this.enablePlay = true;
    this.enableAnswer = false;
    this.answered = false;

    this.uid = userProvider.username;

    let docsPath = fs.knownFolders.documents().path;
    let now = new Date();
    let logfile = environment.experimentFilePrefix + this.uid + '-' + now.getHours() + '-' + now.getMinutes() + '-' + now.getDate() + '-' + now.getMonth() + '-' + now.getFullYear() + '.log';
    this.logFilePath = fs.path.join(docsPath, logfile);
    console.log('Logging to ' + logfile);
    this.writeLog('Experiment started, subject ' + this.uid);
    this.writeLog('trial; soundfile; answer; correct');
  }

  evaluateAnswer(answer) {
    this.enableAnswer = false;
    this.answered = true;
    this.enablePlay = true;

    return this.pauseSound().then(() => {
      this.isCorrect = (answer == this.soundCategory);
      if (this.isCorrect) {
        this.instructionText = 'Correct';
      } else {
        this.instructionText = 'Wrong';
      }

      return this.writeLog('' + this.soundIndex + ';' + this.soundId + ';' + answer + ';' + this.isCorrect);
    }).then(() => {
      this.soundIndex += 1;
      return this.loadSound();
    }).catch(err => this.showError(err));
  }

  loadSound() {
    if (this.soundIndex >= this.sounds.length) {
      return this.finishExperiment();
    }
    let soundInfo = this.sounds[this.soundIndex];
    this.soundId = soundInfo.id;
    this.soundCategory = soundInfo.cat;

    let soundpath = fs.path.join(this.audioPath, this.soundId);
    if (!fs.File.exists(soundpath)) {
      this.showError('Sound file ' + this.soundId + ' does not exist!');
      return new Promise((resolve, reject) => reject('File not found'));
    }
    return this.player.initFromFile({
      audioFile: soundpath,
      loop: false,
      errorCallback: error => {
        console.log(JSON.stringify(error));
      }
    }).catch(err => {
      this.showError(err.extra);
    });
  }

  startSound() {
    if (this.player.isAudioPlaying()) {
      return new Promise((resolve, reject) => resolve('playing'));
    }
    return this.player.play().then(
      () => {
        this.trialNumber += 1;
        this.instructionText = "Is this sound A or B?";
        this.enablePlay = false;
        this.enableAnswer = true;
        this.answered = false;
      },
      err => this.showError('could not start sound: ' + err)
    );
  }

  pauseSound() {
    if (!this.player.isAudioPlaying()) {
      return new Promise((resolve, reject) => resolve('paused'));
    }
    return this.player.pause().then(
      () => {
        return this.player.dispose();
      }
    );
  }

  writeLog(message: string) {
    this.experimentLogText.push(message);
    let fileHandle = fs.File.fromPath(this.logFilePath);
    let logstring = '';
    for (let row of this.experimentLogText) {
      logstring.concat(row + '\n');
    }
    return fileHandle.writeText(logstring);
  }

  volumeDown() {
    if (this.volume > 0.1) {
      this.volume -= 0.1;
    }
    this.updateVolumeIcon();
    this.player.volume = this.volume;
  }

  volumeUp() {
    if (this.volume <= 0.9) {
      this.volume += 0.1;
    }
    this.updateVolumeIcon();
    this.player.volume =  this.volume;
  }

  updateVolumeIcon() {
    if (this.volume <= 0.2) {
      this.volumeIcon = 'volume-mute';
    } else if (this.volume <= 0.6) {
      this.volumeIcon = 'volume-down';
    } else {
      this.volumeIcon = 'volume-up';
    }
  }

  showInstructions() {

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

  finishExperiment() {
    dialogs.alert({
      title: 'Experiment completed',
      message: 'The experiment is now finished, thank you for participating!',
      okButtonText: 'OK'
    }).then(() => {
      this.userProvider.username = '';
      this.userProvider.age = null;

      return this.routerExtensions.navigate(['/start'], {clearHistory: true});
    }).catch(err => {
      this.showError(err);
    });
  }

  abortExperiment() {
    dialogs.confirm({
      title: 'Abort experiment?',
      message: 'The experiment is not finished, are you sure you want to abort? You cannot continue the experiment after quitting.',
      okButtonText: 'Quit',
      cancelButtonText: 'Continue'
    }).then(ans => {
      if (ans) {
        this.userProvider.username = '';
        this.userProvider.age = null;

        return this.routerExtensions.navigate(['/start'], {clearHistory: true});
      }
    })
  }

}
