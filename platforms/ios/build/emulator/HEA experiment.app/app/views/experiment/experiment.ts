import { Component } from '@angular/core';
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as fs from "tns-core-modules/file-system";

import { UserProvider } from '../../shared/user/user';
import { RouterExtensions } from 'nativescript-angular/router';

import { TNSPlayer } from 'nativescript-audio';

import { environment } from '../../config/environment';
import { sound_config } from './experiment-config';
import { ParamGrid, GridTracker, TrialAnswer, GridTrackingStatus } from '../../shared/grid/grid';

declare var NSURL;

@Component({
  moduleId: module.id,
  selector: 'page-experiment',
  templateUrl: './experiment.html',
  styleUrls: ['./experiment.css']
})
export class ExperimentPage {

  private volume: number;
  private trialNumber: number;
  private uid: string;
  private audioPath: string;
  private volumeIcon: string;
  private n_alternatives: number;
  private players: Array<TNSPlayer>;
  private ISI_ms: number;

  private sound_id: string;
  private isCorrect: boolean;
  private target_idx: number;

  private playButtonText: string;
  private instructionText: string;
  private highlightedButton: number;
  private enablePlay: boolean;
  private enableAnswer: boolean;
  private answered: boolean;

  private logFilePath: string;
  private experimentLogText: Array<string> = [];
  private grid: GridTracker;

  constructor(private userProvider: UserProvider,
              private routerExtensions: RouterExtensions) {

    // 2AFC --> two players
    this.n_alternatives = 2;

    let parameter_grid = new ParamGrid({
      xmin: 1,
      xmax: 18,
      xres: 1,
      ymin: 1,
      ymax: 26,
      yres: 1
    });

    this.grid = new GridTracker({
      g: parameter_grid,
      m_up: 1,
      n_down: 3,
      n_revs: 2,
      n_step: 500
    });
    this.grid.initialize(1, 23);

    this.players = [];
    for (let i = 0; i < this.n_alternatives; i++) {
      this.players.push(new TNSPlayer());
    }
    this.ISI_ms = 200;

    this.volume = 0.7;

    let appPath = fs.knownFolders.currentApp();
    this.audioPath = fs.path.join(appPath.path, 'audio');
    console.log(this.audioPath);

    this.trialNumber = 0;
    this.loadSounds();

    this.playButtonText = "Play next";
    this.instructionText = "Press play button to hear the sound.";
    this.highlightedButton = -1;

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
    this.playButtonText = 'Play next';

    this.isCorrect = (answer == this.target_idx);
    if (this.isCorrect) {
      this.instructionText = 'Correct';
    } else {
      this.instructionText = 'Wrong';
    }

    return this.writeLog('' + this.trialNumber + ';' + this.sound_id + ';' + answer + ';' + this.isCorrect).then(() => {
      let ans = this.isCorrect ? TrialAnswer.Correct : TrialAnswer.Wrong;
      this.grid.updatePosition(ans); // might throw error if something goes wrong, catched later

      if (this.grid.getStatus().finished) {
        return this.writeLog(JSON.stringify(this.grid.getHistory())).then(() => {
          this.finishExperiment();
        });
      }

      let [xparam, yparam] = this.grid.getCurrentGridParameters();
      return this.loadSounds();
    }).catch(err => this.showError(err));
  }

  loadSounds() {
    let promises = [];
    this.target_idx = Math.floor(Math.random() * this.n_alternatives);
    let [mask_i, targ_i] = this.grid.getCurrentGridParameters();

    for (let i = 0; i < this.n_alternatives - 1; i++) {
      let stim_id = '';
      if (i == this.target_idx) {
        stim_id = 'f1000_level' + targ_i + '_gap' + mask_i + '.wav';
        this.sound_id = stim_id;
      } else {
        stim_id = 'f1000_gap' + mask_i + '.wav';
      }
      let soundpath = fs.path.join(this.audioPath, stim_id);
      if (!fs.File.exists(soundpath)) {
        promises.push(new Promise((resolve, reject) => reject('Sound file ' + stim_id + ' does not exist!')));
      } else {
        promises.push(this.players[i].initFromFile({
          audioFile: soundpath,
          loop: false,
          completeCallback: args => {
            // note: passing the current value of loop variable i to the callback is only
            // possible when using 'let' in the loop initialization. keywords: "javascript closure"
            this.soundEnded(i);
            if (i < this.n_alternatives - 1) {
              setTimeout(() => this.startSound(i+1), this.ISI_ms);
            } else {
              this.trialEnded();
            }
          },
          errorCallback: error => {
            console.log(JSON.stringify(error));
          }
        }).catch(err => {
          return new Promise((resolve,reject) => reject(err.extra));
        }));
      }
    }

    return Promise.all(promises).catch(err => this.showError(err));
  }

  isPlaying() {
    for (let i = 0; i < this.n_alternatives; i++) {
      if (this.players[i].isAudioPlaying()) {
        return true;
      }
    }
    return false;
  }

  playTrial() {
    return this.startSound(0).then(
      () => {
        this.trialNumber += 1;
        this.instructionText = "Which sound has the target?";
        this.enablePlay = false;
        this.enableAnswer = false;
        this.answered = false;
        this.playButtonText = 'Listen';
      },
      err => this.showError('could not start sound: ' + err)
    );
  }

  startSound(player_idx) {
    if (this.isPlaying()) {
      return new Promise((resolve, reject) => reject('playing'));
    }
    this.highlightedButton = player_idx;
    this.players[player_idx].volume = this.volume;
    return this.players[player_idx].play();
  }

  soundEnded(player_idx) {
    this.highlightedButton = -1;
  }

  trialEnded() {
    this.instructionText = 'Click on the sound that had the target';
    this.enableAnswer = true;
    this.playButtonText = 'Waiting for answer';
  }

  writeLog(message: string) {
    this.experimentLogText.push(message);

    let fileHandle = fs.File.fromPath(this.logFilePath);
    let logstring = '';
    for (let row of this.experimentLogText) {
      logstring = logstring.concat(row + '\n');
    }
    return fileHandle.writeText(logstring).catch(err => {
      this.showError(err);
    });
  }

  // volumeDown() {
  //   if (this.volume > 0.1) {
  //     this.volume -= 0.1;
  //   }
  //   this.updateVolumeIcon();
  //   this.player.volume = this.volume;
  // }
  //
  // volumeUp() {
  //   if (this.volume <= 0.9) {
  //     this.volume += 0.1;
  //   }
  //   this.updateVolumeIcon();
  //   this.player.volume =  this.volume;
  // }

  // updateVolumeIcon() {
  //   if (this.volume <= 0.2) {
  //     this.volumeIcon = 'volume-mute';
  //   } else if (this.volume <= 0.6) {
  //     this.volumeIcon = 'volume-down';
  //   } else {
  //     this.volumeIcon = 'volume-up';
  //   }
  // }

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
      cancelButtonText: 'Stay'
    }).then(ans => {
      if (ans) {
        this.userProvider.username = '';
        this.userProvider.age = null;

        return this.writeLog('Aborted trial.\n' + JSON.stringify(this.grid.getHistory())).then(() => {
          return this.routerExtensions.navigate(['/start'], {clearHistory: true});
        }).catch(err => this.showError(err));
      }
    });
  }

}
