import { Component, NgZone } from '@angular/core';
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as fs from "tns-core-modules/file-system";

import { SessionProvider } from '../../shared/session/session';
import { RouterExtensions } from 'nativescript-angular/router';

import { TNSPlayer } from 'nativescript-audio';

import { environment } from '../../config/environment';
import { sound_config } from './experiment-config';
import { ParamGrid, GridTracker, TrialAnswer, GridTrackingStatus } from '../../shared/grid/grid';

declare var NSURL;

function db2a(db:number) {
  return Math.pow(10, db/20);
}

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

  private name: string;

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

  constructor(private sessionProvider: SessionProvider,
              private routerExtensions: RouterExtensions,
              private _ngZone: NgZone) {

    // 2AFC --> two players
    this.n_alternatives = 2;

    this.name = 'original';

    let parameter_grid = new ParamGrid({
      xmin: 1,
      xmax: 18,
      xres: 1,
      ymin: 1,
      ymax: 26,
      yres: 1
    });

    console.log('Grid:');
    console.log(parameter_grid.printGrid());

    this.grid = new GridTracker({
      g: parameter_grid,
      m_up: 1,
      n_down: 3,
      n_revs: 2,
      n_step: 500
    });
    this.grid.initialize(0, 23);
    console.log('Grid initialized');

    this.players = [];
    for (let i = 0; i < this.n_alternatives; i++) {
      this.players.push(new TNSPlayer());
    }
    console.log('Players initialized: ' + this.players.length);
    this.ISI_ms = 200;

    this.volume = db2a(40)*sessionProvider.threshold;
    console.log('Volume: ' + this.volume);

    let appPath = fs.knownFolders.currentApp();
    this.audioPath = fs.path.join(appPath.path, 'audio');
    console.log(this.audioPath);

    this.trialNumber = 0;
    this.loadSounds().then(() => {
      console.log('Sounds loaded');
      for (let i = 0; i < this.n_alternatives; i++) {
        this.players[i].getAudioTrackDuration().then(dur => {
          console.log('Player ' + i + ', track duration ' + dur);
        });
      }

      this.playButtonText = "Play next";
      this.instructionText = "Press play button to hear the sound.";
      this.highlightedButton = -1;

      this.enablePlay = true;
      this.enableAnswer = false;
      this.answered = false;

      this.uid = sessionProvider.username;

      let docsPath = fs.knownFolders.documents().path;
      let now = new Date();
      let logfile = environment.experimentFilePrefix + this.uid + '-' + now.getHours() + '-' + now.getMinutes() + '-' + now.getDate() + '-' + now.getMonth() + '-' + now.getFullYear() + '.log';
      this.logFilePath = fs.path.join(docsPath, logfile);
      console.log('Logging to ' + logfile);
      return this.writeLog('Experiment started, subject ' + this.uid);
    }).then(() => {
      return this.writeLog('trial; soundfile; answer; correct');
    }).catch(err => this.showError(err));

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
      let [x, y] = this.grid.getCurrentGridParameters();
      console.log(JSON.stringify(this.grid.getStatus()));
      //console.log('new position ' + x + ', ' + y);

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
    //console.log('Loading sounds');
    let promises = [];
    this.target_idx = Math.floor(Math.random() * this.n_alternatives);
    //console.log('Target is at ' + this.target_idx);
    let [mask_i, targ_i] = this.grid.getCurrentGridParameters();

    for (let i = 0; i < this.n_alternatives; i++) {
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
            //console.log(this.name + ' Sound ' + i + ' ended, playing next');
            this.soundEnded(i);
            if (i < this.n_alternatives - 1) {
              setTimeout(() => this._ngZone.run(() => this.startSound(i+1)), this.ISI_ms);
            } else {
              this._ngZone.run(() => this.trialEnded());
            }
          },
          errorCallback: error => {
            console.log(JSON.stringify(error));
          }
        }).catch(err => {
          console.log('Error initializing player ' + i + ', ' + err.extra);
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
    this.name = 'playa';
    for (let i = 0; i < this.n_alternatives; i++) {
      this.players[i].volume = this.volume;
    }
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
    //this.players[player_idx].getAudioTrackDuration().then(duration => {
    //  console.log(this.name + ' playing stim ' + player_idx + ', duration ' + duration);
    //});
    if (this.isPlaying()) {
      return new Promise((resolve, reject) => reject('playing'));
    }
    this.highlightedButton = player_idx;
    return this.players[player_idx].play();
  }

  soundEnded(player_idx) {
    this.highlightedButton = -1;
  }

  trialEnded() {
    //console.log(this.name + ' Trial ended');
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
        return this.writeLog('Aborted trial.\n' + JSON.stringify(this.grid.getHistory())).then(() => {
          return this.routerExtensions.navigate(['/start'], {clearHistory: true});
        }).catch(err => this.showError(err));
      }
    });
  }

}
