"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var session_1 = require("../../shared/session/session");
var router_1 = require("nativescript-angular/router");
var nativescript_audio_1 = require("nativescript-audio");
var environment_1 = require("../../config/environment");
var grid_1 = require("../../shared/grid/grid");
var ExperimentPage = (function () {
    function ExperimentPage(sessionProvider, routerExtensions, _ngZone) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this._ngZone = _ngZone;
        this.experimentLogText = [];
        // 2AFC --> two players
        this.n_alternatives = 2;
        this.name = 'original';
        var parameter_grid = new grid_1.ParamGrid({
            xmin: 1,
            xmax: 18,
            xres: 1,
            ymin: 1,
            ymax: 26,
            yres: 1
        });
        console.log('Grid:');
        console.log(parameter_grid.printGrid());
        this.grid = new grid_1.GridTracker({
            g: parameter_grid,
            m_up: 1,
            n_down: 3,
            n_revs: 2,
            n_step: 500
        });
        this.grid.initialize(0, 23);
        console.log('Grid initialized');
        this.players = [];
        for (var i = 0; i < this.n_alternatives; i++) {
            this.players.push(new nativescript_audio_1.TNSPlayer());
        }
        console.log('Players initialized: ' + this.players.length);
        this.ISI_ms = 200;
        this.volume = 0.7;
        var appPath = fs.knownFolders.currentApp();
        this.audioPath = fs.path.join(appPath.path, 'audio');
        console.log(this.audioPath);
        this.trialNumber = 0;
        this.loadSounds().then(function () {
            console.log('Sounds loaded');
            var _loop_1 = function (i) {
                _this.players[i].getAudioTrackDuration().then(function (dur) {
                    console.log('Player ' + i + ', track duration ' + dur);
                });
            };
            for (var i = 0; i < _this.n_alternatives; i++) {
                _loop_1(i);
            }
            _this.playButtonText = "Play next";
            _this.instructionText = "Press play button to hear the sound.";
            _this.highlightedButton = -1;
            _this.enablePlay = true;
            _this.enableAnswer = false;
            _this.answered = false;
            _this.uid = sessionProvider.username;
            var docsPath = fs.knownFolders.documents().path;
            var now = new Date();
            var logfile = environment_1.environment.experimentFilePrefix + _this.uid + '-' + now.getHours() + '-' + now.getMinutes() + '-' + now.getDate() + '-' + now.getMonth() + '-' + now.getFullYear() + '.log';
            _this.logFilePath = fs.path.join(docsPath, logfile);
            console.log('Logging to ' + logfile);
            return _this.writeLog('Experiment started, subject ' + _this.uid);
        }).then(function () {
            return _this.writeLog('trial; soundfile; answer; correct');
        }).catch(function (err) { return _this.showError(err); });
    }
    ExperimentPage.prototype.evaluateAnswer = function (answer) {
        var _this = this;
        this.enableAnswer = false;
        this.answered = true;
        this.enablePlay = true;
        this.playButtonText = 'Play next';
        this.isCorrect = (answer == this.target_idx);
        if (this.isCorrect) {
            this.instructionText = 'Correct';
        }
        else {
            this.instructionText = 'Wrong';
        }
        return this.writeLog('' + this.trialNumber + ';' + this.sound_id + ';' + answer + ';' + this.isCorrect).then(function () {
            var ans = _this.isCorrect ? grid_1.TrialAnswer.Correct : grid_1.TrialAnswer.Wrong;
            _this.grid.updatePosition(ans); // might throw error if something goes wrong, catched later
            var _a = _this.grid.getCurrentGridParameters(), x = _a[0], y = _a[1];
            console.log(JSON.stringify(_this.grid.getStatus()));
            //console.log('new position ' + x + ', ' + y);
            if (_this.grid.getStatus().finished) {
                return _this.writeLog(JSON.stringify(_this.grid.getHistory())).then(function () {
                    _this.finishExperiment();
                });
            }
            var _b = _this.grid.getCurrentGridParameters(), xparam = _b[0], yparam = _b[1];
            return _this.loadSounds();
        }).catch(function (err) { return _this.showError(err); });
    };
    ExperimentPage.prototype.loadSounds = function () {
        var _this = this;
        //console.log('Loading sounds');
        var promises = [];
        this.target_idx = Math.floor(Math.random() * this.n_alternatives);
        //console.log('Target is at ' + this.target_idx);
        var _a = this.grid.getCurrentGridParameters(), mask_i = _a[0], targ_i = _a[1];
        var _loop_2 = function (i) {
            var stim_id = '';
            if (i == this_1.target_idx) {
                stim_id = 'f1000_level' + targ_i + '_gap' + mask_i + '.wav';
                this_1.sound_id = stim_id;
            }
            else {
                stim_id = 'f1000_gap' + mask_i + '.wav';
            }
            var soundpath = fs.path.join(this_1.audioPath, stim_id);
            if (!fs.File.exists(soundpath)) {
                promises.push(new Promise(function (resolve, reject) { return reject('Sound file ' + stim_id + ' does not exist!'); }));
            }
            else {
                promises.push(this_1.players[i].initFromFile({
                    audioFile: soundpath,
                    loop: false,
                    completeCallback: function (args) {
                        // note: passing the current value of loop variable i to the callback is only
                        // possible when using 'let' in the loop initialization. keywords: "javascript closure"
                        //console.log(this.name + ' Sound ' + i + ' ended, playing next');
                        _this.soundEnded(i);
                        if (i < _this.n_alternatives - 1) {
                            setTimeout(function () { return _this._ngZone.run(function () { return _this.startSound(i + 1); }); }, _this.ISI_ms);
                        }
                        else {
                            _this._ngZone.run(function () { return _this.trialEnded(); });
                        }
                    },
                    errorCallback: function (error) {
                        console.log(JSON.stringify(error));
                    }
                }).catch(function (err) {
                    console.log('Error initializing player ' + i + ', ' + err.extra);
                    return new Promise(function (resolve, reject) { return reject(err.extra); });
                }));
            }
        };
        var this_1 = this;
        for (var i = 0; i < this.n_alternatives; i++) {
            _loop_2(i);
        }
        return Promise.all(promises).catch(function (err) { return _this.showError(err); });
    };
    ExperimentPage.prototype.isPlaying = function () {
        for (var i = 0; i < this.n_alternatives; i++) {
            if (this.players[i].isAudioPlaying()) {
                return true;
            }
        }
        return false;
    };
    ExperimentPage.prototype.playTrial = function () {
        var _this = this;
        this.name = 'playa';
        return this.startSound(0).then(function () {
            _this.trialNumber += 1;
            _this.instructionText = "Which sound has the target?";
            _this.enablePlay = false;
            _this.enableAnswer = false;
            _this.answered = false;
            _this.playButtonText = 'Listen';
        }, function (err) { return _this.showError('could not start sound: ' + err); });
    };
    ExperimentPage.prototype.startSound = function (player_idx) {
        //this.players[player_idx].getAudioTrackDuration().then(duration => {
        //  console.log(this.name + ' playing stim ' + player_idx + ', duration ' + duration);
        //});
        if (this.isPlaying()) {
            return new Promise(function (resolve, reject) { return reject('playing'); });
        }
        this.highlightedButton = player_idx;
        this.players[player_idx].volume = this.volume;
        return this.players[player_idx].play();
    };
    ExperimentPage.prototype.soundEnded = function (player_idx) {
        this.highlightedButton = -1;
    };
    ExperimentPage.prototype.trialEnded = function () {
        //console.log(this.name + ' Trial ended');
        this.instructionText = 'Click on the sound that had the target';
        this.enableAnswer = true;
        this.playButtonText = 'Waiting for answer';
    };
    ExperimentPage.prototype.writeLog = function (message) {
        var _this = this;
        this.experimentLogText.push(message);
        var fileHandle = fs.File.fromPath(this.logFilePath);
        var logstring = '';
        for (var _i = 0, _a = this.experimentLogText; _i < _a.length; _i++) {
            var row = _a[_i];
            logstring = logstring.concat(row + '\n');
        }
        return fileHandle.writeText(logstring).catch(function (err) {
            _this.showError(err);
        });
    };
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
    ExperimentPage.prototype.showInstructions = function () {
    };
    ExperimentPage.prototype.showError = function (err) {
        dialogs.alert({
            title: 'Error',
            message: err,
            okButtonText: 'Close'
        }).then(function () {
            // pass
        });
    };
    ExperimentPage.prototype.finishExperiment = function () {
        var _this = this;
        dialogs.alert({
            title: 'Experiment completed',
            message: 'The experiment is now finished, thank you for participating!',
            okButtonText: 'OK'
        }).then(function () {
            _this.sessionProvider.username = '';
            return _this.routerExtensions.navigate(['/start'], { clearHistory: true });
        }).catch(function (err) {
            _this.showError(err);
        });
    };
    ExperimentPage.prototype.abortExperiment = function () {
        var _this = this;
        dialogs.confirm({
            title: 'Abort experiment?',
            message: 'The experiment is not finished, are you sure you want to abort? You cannot continue the experiment after quitting.',
            okButtonText: 'Quit',
            cancelButtonText: 'Stay'
        }).then(function (ans) {
            if (ans) {
                _this.sessionProvider.username = '';
                return _this.writeLog('Aborted trial.\n' + JSON.stringify(_this.grid.getHistory())).then(function () {
                    return _this.routerExtensions.navigate(['/start'], { clearHistory: true });
                }).catch(function (err) { return _this.showError(err); });
            }
        });
    };
    ExperimentPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-experiment',
            templateUrl: './experiment.html',
            styleUrls: ['./experiment.css']
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            core_1.NgZone])
    ], ExperimentPage);
    return ExperimentPage;
}());
exports.ExperimentPage = ExperimentPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4cGVyaW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFDbEQscURBQXVEO0FBQ3ZELGlEQUFtRDtBQUVuRCx3REFBK0Q7QUFDL0Qsc0RBQStEO0FBRS9ELHlEQUErQztBQUUvQyx3REFBdUQ7QUFFdkQsK0NBQWlHO0FBVWpHO0lBNEJFLHdCQUFvQixlQUFnQyxFQUNoQyxnQkFBa0MsRUFDbEMsT0FBZTtRQUZuQyxpQkF5RUM7UUF6RW1CLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBQ2xDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFMM0Isc0JBQWlCLEdBQWtCLEVBQUUsQ0FBQztRQU81Qyx1QkFBdUI7UUFDdkIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7UUFFdkIsSUFBSSxjQUFjLEdBQUcsSUFBSSxnQkFBUyxDQUFDO1lBQ2pDLElBQUksRUFBRSxDQUFDO1lBQ1AsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsQ0FBQztZQUNQLElBQUksRUFBRSxDQUFDO1lBQ1AsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsQ0FBQztTQUNSLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUV4QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksa0JBQVcsQ0FBQztZQUMxQixDQUFDLEVBQUUsY0FBYztZQUNqQixJQUFJLEVBQUUsQ0FBQztZQUNQLE1BQU0sRUFBRSxDQUFDO1lBQ1QsTUFBTSxFQUFFLENBQUM7WUFDVCxNQUFNLEVBQUUsR0FBRztTQUNaLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSw4QkFBUyxFQUFFLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBRWxCLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBRWxCLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTVCLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQ0FDcEIsQ0FBQztnQkFDUixLQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUEsR0FBRztvQkFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFKRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFO3dCQUFuQyxDQUFDO2FBSVQ7WUFFRCxLQUFJLENBQUMsY0FBYyxHQUFHLFdBQVcsQ0FBQztZQUNsQyxLQUFJLENBQUMsZUFBZSxHQUFHLHNDQUFzQyxDQUFDO1lBQzlELEtBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUU1QixLQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixLQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMxQixLQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUV0QixLQUFJLENBQUMsR0FBRyxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUM7WUFFcEMsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFDaEQsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNyQixJQUFJLE9BQU8sR0FBRyx5QkFBVyxDQUFDLG9CQUFvQixHQUFHLEtBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLFVBQVUsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLE1BQU0sQ0FBQztZQUMxTCxLQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsS0FBSSxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsR0FBRyxLQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sTUFBTSxDQUFDLEtBQUksQ0FBQyxRQUFRLENBQUMsbUNBQW1DLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFuQixDQUFtQixDQUFDLENBQUM7SUFFdkMsQ0FBQztJQUVELHVDQUFjLEdBQWQsVUFBZSxNQUFNO1FBQXJCLGlCQTZCQztRQTVCQyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUMxQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN2QixJQUFJLENBQUMsY0FBYyxHQUFHLFdBQVcsQ0FBQztRQUVsQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztRQUNuQyxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQztRQUNqQyxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMzRyxJQUFJLEdBQUcsR0FBRyxLQUFJLENBQUMsU0FBUyxHQUFHLGtCQUFXLENBQUMsT0FBTyxHQUFHLGtCQUFXLENBQUMsS0FBSyxDQUFDO1lBQ25FLEtBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsMkRBQTJEO1lBQ3RGLElBQUEsMENBQTZDLEVBQTVDLFNBQUMsRUFBRSxTQUFDLENBQXlDO1lBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRCw4Q0FBOEM7WUFFOUMsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLENBQUMsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDaEUsS0FBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzFCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUVHLElBQUEsMENBQXVELEVBQXRELGNBQU0sRUFBRSxjQUFNLENBQXlDO1lBQzVELE1BQU0sQ0FBQyxLQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsS0FBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBbkIsQ0FBbUIsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxtQ0FBVSxHQUFWO1FBQUEsaUJBNENDO1FBM0NDLGdDQUFnQztRQUNoQyxJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbEUsaURBQWlEO1FBQzdDLElBQUEseUNBQXVELEVBQXRELGNBQU0sRUFBRSxjQUFNLENBQXlDO2dDQUVuRCxDQUFDO1lBQ1IsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLE9BQU8sR0FBRyxhQUFhLEdBQUcsTUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDO2dCQUM1RCxPQUFLLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDMUIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLE9BQU8sR0FBRyxXQUFXLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUMxQyxDQUFDO1lBQ0QsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBSyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxJQUFLLE9BQUEsTUFBTSxDQUFDLGFBQWEsR0FBRyxPQUFPLEdBQUcsa0JBQWtCLENBQUMsRUFBcEQsQ0FBb0QsQ0FBQyxDQUFDLENBQUM7WUFDeEcsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO29CQUN6QyxTQUFTLEVBQUUsU0FBUztvQkFDcEIsSUFBSSxFQUFFLEtBQUs7b0JBQ1gsZ0JBQWdCLEVBQUUsVUFBQSxJQUFJO3dCQUNwQiw2RUFBNkU7d0JBQzdFLHVGQUF1Rjt3QkFDdkYsa0VBQWtFO3dCQUNsRSxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNuQixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNoQyxVQUFVLENBQUMsY0FBTSxPQUFBLEtBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBcEIsQ0FBb0IsQ0FBQyxFQUE1QyxDQUE0QyxFQUFFLEtBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDOUUsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDTixLQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFVBQVUsRUFBRSxFQUFqQixDQUFpQixDQUFDLENBQUM7d0JBQzVDLENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxhQUFhLEVBQUUsVUFBQSxLQUFLO3dCQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDckMsQ0FBQztpQkFDRixDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUEsR0FBRztvQkFDVixPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqRSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUMsTUFBTSxJQUFLLE9BQUEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBakIsQ0FBaUIsQ0FBQyxDQUFDO2dCQUM1RCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ04sQ0FBQztRQUNILENBQUM7O1FBbENELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUU7b0JBQW5DLENBQUM7U0FrQ1Q7UUFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFuQixDQUFtQixDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVELGtDQUFTLEdBQVQ7UUFDRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNkLENBQUM7UUFDSCxDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxrQ0FBUyxHQUFUO1FBQUEsaUJBYUM7UUFaQyxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQzVCO1lBQ0UsS0FBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUM7WUFDdEIsS0FBSSxDQUFDLGVBQWUsR0FBRyw2QkFBNkIsQ0FBQztZQUNyRCxLQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN4QixLQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMxQixLQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN0QixLQUFJLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQztRQUNqQyxDQUFDLEVBQ0QsVUFBQSxHQUFHLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLHlCQUF5QixHQUFHLEdBQUcsQ0FBQyxFQUEvQyxDQUErQyxDQUN2RCxDQUFDO0lBQ0osQ0FBQztJQUVELG1DQUFVLEdBQVYsVUFBVyxVQUFVO1FBQ25CLHFFQUFxRTtRQUNyRSxzRkFBc0Y7UUFDdEYsS0FBSztRQUNMLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sSUFBSyxPQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBakIsQ0FBaUIsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFDRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDOUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDekMsQ0FBQztJQUVELG1DQUFVLEdBQVYsVUFBVyxVQUFVO1FBQ25CLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsbUNBQVUsR0FBVjtRQUNFLDBDQUEwQztRQUMxQyxJQUFJLENBQUMsZUFBZSxHQUFHLHdDQUF3QyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsb0JBQW9CLENBQUM7SUFDN0MsQ0FBQztJQUVELGlDQUFRLEdBQVIsVUFBUyxPQUFlO1FBQXhCLGlCQVdDO1FBVkMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVyQyxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEQsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ25CLEdBQUcsQ0FBQyxDQUFZLFVBQXNCLEVBQXRCLEtBQUEsSUFBSSxDQUFDLGlCQUFpQixFQUF0QixjQUFzQixFQUF0QixJQUFzQjtZQUFqQyxJQUFJLEdBQUcsU0FBQTtZQUNWLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztTQUMxQztRQUNELE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFBLEdBQUc7WUFDOUMsS0FBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxpQkFBaUI7SUFDakIsNkJBQTZCO0lBQzdCLDBCQUEwQjtJQUMxQixNQUFNO0lBQ04sNkJBQTZCO0lBQzdCLHNDQUFzQztJQUN0QyxJQUFJO0lBQ0osRUFBRTtJQUNGLGVBQWU7SUFDZiw4QkFBOEI7SUFDOUIsMEJBQTBCO0lBQzFCLE1BQU07SUFDTiw2QkFBNkI7SUFDN0IsdUNBQXVDO0lBQ3ZDLElBQUk7SUFFSix1QkFBdUI7SUFDdkIsOEJBQThCO0lBQzlCLHVDQUF1QztJQUN2QyxxQ0FBcUM7SUFDckMsdUNBQXVDO0lBQ3ZDLGFBQWE7SUFDYixxQ0FBcUM7SUFDckMsTUFBTTtJQUNOLElBQUk7SUFFSix5Q0FBZ0IsR0FBaEI7SUFFQSxDQUFDO0lBRUQsa0NBQVMsR0FBVCxVQUFVLEdBQUc7UUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ1osS0FBSyxFQUFFLE9BQU87WUFDZCxPQUFPLEVBQUUsR0FBRztZQUNaLFlBQVksRUFBRSxPQUFPO1NBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixPQUFPO1FBQ1QsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQseUNBQWdCLEdBQWhCO1FBQUEsaUJBWUM7UUFYQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ1osS0FBSyxFQUFFLHNCQUFzQjtZQUM3QixPQUFPLEVBQUUsOERBQThEO1lBQ3ZFLFlBQVksRUFBRSxJQUFJO1NBQ25CLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixLQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFFbkMsTUFBTSxDQUFDLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFDLFlBQVksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFBLEdBQUc7WUFDVixLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELHdDQUFlLEdBQWY7UUFBQSxpQkFlQztRQWRDLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDZCxLQUFLLEVBQUUsbUJBQW1CO1lBQzFCLE9BQU8sRUFBRSxvSEFBb0g7WUFDN0gsWUFBWSxFQUFFLE1BQU07WUFDcEIsZ0JBQWdCLEVBQUUsTUFBTTtTQUN6QixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsR0FBRztZQUNULEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ1IsS0FBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUVuQyxNQUFNLENBQUMsS0FBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDckYsTUFBTSxDQUFDLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFDLFlBQVksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFuQixDQUFtQixDQUFDLENBQUM7WUFDdkMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXJUVSxjQUFjO1FBTjFCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLGlCQUFpQjtZQUMzQixXQUFXLEVBQUUsbUJBQW1CO1lBQ2hDLFNBQVMsRUFBRSxDQUFDLGtCQUFrQixDQUFDO1NBQ2hDLENBQUM7eUNBNkJxQyx5QkFBZTtZQUNkLHlCQUFnQjtZQUN6QixhQUFNO09BOUJ4QixjQUFjLENBdVQxQjtJQUFELHFCQUFDO0NBQUEsQUF2VEQsSUF1VEM7QUF2VFksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuXG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zaGFyZWQvc2Vzc2lvbi9zZXNzaW9uJztcbmltcG9ydCB7IFJvdXRlckV4dGVuc2lvbnMgfSBmcm9tICduYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXInO1xuXG5pbXBvcnQgeyBUTlNQbGF5ZXIgfSBmcm9tICduYXRpdmVzY3JpcHQtYXVkaW8nO1xuXG5pbXBvcnQgeyBlbnZpcm9ubWVudCB9IGZyb20gJy4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudCc7XG5pbXBvcnQgeyBzb3VuZF9jb25maWcgfSBmcm9tICcuL2V4cGVyaW1lbnQtY29uZmlnJztcbmltcG9ydCB7IFBhcmFtR3JpZCwgR3JpZFRyYWNrZXIsIFRyaWFsQW5zd2VyLCBHcmlkVHJhY2tpbmdTdGF0dXMgfSBmcm9tICcuLi8uLi9zaGFyZWQvZ3JpZC9ncmlkJztcblxuZGVjbGFyZSB2YXIgTlNVUkw7XG5cbkBDb21wb25lbnQoe1xuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICBzZWxlY3RvcjogJ3BhZ2UtZXhwZXJpbWVudCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9leHBlcmltZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9leHBlcmltZW50LmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIEV4cGVyaW1lbnRQYWdlIHtcblxuICBwcml2YXRlIHZvbHVtZTogbnVtYmVyO1xuICBwcml2YXRlIHRyaWFsTnVtYmVyOiBudW1iZXI7XG4gIHByaXZhdGUgdWlkOiBzdHJpbmc7XG4gIHByaXZhdGUgYXVkaW9QYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgdm9sdW1lSWNvbjogc3RyaW5nO1xuICBwcml2YXRlIG5fYWx0ZXJuYXRpdmVzOiBudW1iZXI7XG4gIHByaXZhdGUgcGxheWVyczogQXJyYXk8VE5TUGxheWVyPjtcbiAgcHJpdmF0ZSBJU0lfbXM6IG51bWJlcjtcblxuICBwcml2YXRlIG5hbWU6IHN0cmluZztcblxuICBwcml2YXRlIHNvdW5kX2lkOiBzdHJpbmc7XG4gIHByaXZhdGUgaXNDb3JyZWN0OiBib29sZWFuO1xuICBwcml2YXRlIHRhcmdldF9pZHg6IG51bWJlcjtcblxuICBwcml2YXRlIHBsYXlCdXR0b25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgaW5zdHJ1Y3Rpb25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgaGlnaGxpZ2h0ZWRCdXR0b246IG51bWJlcjtcbiAgcHJpdmF0ZSBlbmFibGVQbGF5OiBib29sZWFuO1xuICBwcml2YXRlIGVuYWJsZUFuc3dlcjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBhbnN3ZXJlZDogYm9vbGVhbjtcblxuICBwcml2YXRlIGxvZ0ZpbGVQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgZXhwZXJpbWVudExvZ1RleHQ6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgcHJpdmF0ZSBncmlkOiBHcmlkVHJhY2tlcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNlc3Npb25Qcm92aWRlcjogU2Vzc2lvblByb3ZpZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lKSB7XG5cbiAgICAvLyAyQUZDIC0tPiB0d28gcGxheWVyc1xuICAgIHRoaXMubl9hbHRlcm5hdGl2ZXMgPSAyO1xuXG4gICAgdGhpcy5uYW1lID0gJ29yaWdpbmFsJztcblxuICAgIGxldCBwYXJhbWV0ZXJfZ3JpZCA9IG5ldyBQYXJhbUdyaWQoe1xuICAgICAgeG1pbjogMSxcbiAgICAgIHhtYXg6IDE4LFxuICAgICAgeHJlczogMSxcbiAgICAgIHltaW46IDEsXG4gICAgICB5bWF4OiAyNixcbiAgICAgIHlyZXM6IDFcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKCdHcmlkOicpO1xuICAgIGNvbnNvbGUubG9nKHBhcmFtZXRlcl9ncmlkLnByaW50R3JpZCgpKTtcblxuICAgIHRoaXMuZ3JpZCA9IG5ldyBHcmlkVHJhY2tlcih7XG4gICAgICBnOiBwYXJhbWV0ZXJfZ3JpZCxcbiAgICAgIG1fdXA6IDEsXG4gICAgICBuX2Rvd246IDMsXG4gICAgICBuX3JldnM6IDIsXG4gICAgICBuX3N0ZXA6IDUwMFxuICAgIH0pO1xuICAgIHRoaXMuZ3JpZC5pbml0aWFsaXplKDAsIDIzKTtcbiAgICBjb25zb2xlLmxvZygnR3JpZCBpbml0aWFsaXplZCcpO1xuXG4gICAgdGhpcy5wbGF5ZXJzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcbiAgICAgIHRoaXMucGxheWVycy5wdXNoKG5ldyBUTlNQbGF5ZXIoKSk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdQbGF5ZXJzIGluaXRpYWxpemVkOiAnICsgdGhpcy5wbGF5ZXJzLmxlbmd0aCk7XG4gICAgdGhpcy5JU0lfbXMgPSAyMDA7XG5cbiAgICB0aGlzLnZvbHVtZSA9IDAuNztcblxuICAgIGxldCBhcHBQYXRoID0gZnMua25vd25Gb2xkZXJzLmN1cnJlbnRBcHAoKTtcbiAgICB0aGlzLmF1ZGlvUGF0aCA9IGZzLnBhdGguam9pbihhcHBQYXRoLnBhdGgsICdhdWRpbycpO1xuICAgIGNvbnNvbGUubG9nKHRoaXMuYXVkaW9QYXRoKTtcblxuICAgIHRoaXMudHJpYWxOdW1iZXIgPSAwO1xuICAgIHRoaXMubG9hZFNvdW5kcygpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1NvdW5kcyBsb2FkZWQnKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICAgIHRoaXMucGxheWVyc1tpXS5nZXRBdWRpb1RyYWNrRHVyYXRpb24oKS50aGVuKGR1ciA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1BsYXllciAnICsgaSArICcsIHRyYWNrIGR1cmF0aW9uICcgKyBkdXIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9IFwiUGxheSBuZXh0XCI7XG4gICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiUHJlc3MgcGxheSBidXR0b24gdG8gaGVhciB0aGUgc291bmQuXCI7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gLTE7XG5cbiAgICAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG4gICAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbnN3ZXJlZCA9IGZhbHNlO1xuXG4gICAgICB0aGlzLnVpZCA9IHNlc3Npb25Qcm92aWRlci51c2VybmFtZTtcblxuICAgICAgbGV0IGRvY3NQYXRoID0gZnMua25vd25Gb2xkZXJzLmRvY3VtZW50cygpLnBhdGg7XG4gICAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBsb2dmaWxlID0gZW52aXJvbm1lbnQuZXhwZXJpbWVudEZpbGVQcmVmaXggKyB0aGlzLnVpZCArICctJyArIG5vdy5nZXRIb3VycygpICsgJy0nICsgbm93LmdldE1pbnV0ZXMoKSArICctJyArIG5vdy5nZXREYXRlKCkgKyAnLScgKyBub3cuZ2V0TW9udGgoKSArICctJyArIG5vdy5nZXRGdWxsWWVhcigpICsgJy5sb2cnO1xuICAgICAgdGhpcy5sb2dGaWxlUGF0aCA9IGZzLnBhdGguam9pbihkb2NzUGF0aCwgbG9nZmlsZSk7XG4gICAgICBjb25zb2xlLmxvZygnTG9nZ2luZyB0byAnICsgbG9nZmlsZSk7XG4gICAgICByZXR1cm4gdGhpcy53cml0ZUxvZygnRXhwZXJpbWVudCBzdGFydGVkLCBzdWJqZWN0ICcgKyB0aGlzLnVpZCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy53cml0ZUxvZygndHJpYWw7IHNvdW5kZmlsZTsgYW5zd2VyOyBjb3JyZWN0Jyk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuXG4gIH1cblxuICBldmFsdWF0ZUFuc3dlcihhbnN3ZXIpIHtcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgIHRoaXMuYW5zd2VyZWQgPSB0cnVlO1xuICAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG4gICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdQbGF5IG5leHQnO1xuXG4gICAgdGhpcy5pc0NvcnJlY3QgPSAoYW5zd2VyID09IHRoaXMudGFyZ2V0X2lkeCk7XG4gICAgaWYgKHRoaXMuaXNDb3JyZWN0KSB7XG4gICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdDb3JyZWN0JztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnV3JvbmcnO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLndyaXRlTG9nKCcnICsgdGhpcy50cmlhbE51bWJlciArICc7JyArIHRoaXMuc291bmRfaWQgKyAnOycgKyBhbnN3ZXIgKyAnOycgKyB0aGlzLmlzQ29ycmVjdCkudGhlbigoKSA9PiB7XG4gICAgICBsZXQgYW5zID0gdGhpcy5pc0NvcnJlY3QgPyBUcmlhbEFuc3dlci5Db3JyZWN0IDogVHJpYWxBbnN3ZXIuV3Jvbmc7XG4gICAgICB0aGlzLmdyaWQudXBkYXRlUG9zaXRpb24oYW5zKTsgLy8gbWlnaHQgdGhyb3cgZXJyb3IgaWYgc29tZXRoaW5nIGdvZXMgd3JvbmcsIGNhdGNoZWQgbGF0ZXJcbiAgICAgIGxldCBbeCwgeV0gPSB0aGlzLmdyaWQuZ2V0Q3VycmVudEdyaWRQYXJhbWV0ZXJzKCk7XG4gICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmdyaWQuZ2V0U3RhdHVzKCkpKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ25ldyBwb3NpdGlvbiAnICsgeCArICcsICcgKyB5KTtcblxuICAgICAgaWYgKHRoaXMuZ3JpZC5nZXRTdGF0dXMoKS5maW5pc2hlZCkge1xuICAgICAgICByZXR1cm4gdGhpcy53cml0ZUxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmdyaWQuZ2V0SGlzdG9yeSgpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2hFeHBlcmltZW50KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBsZXQgW3hwYXJhbSwgeXBhcmFtXSA9IHRoaXMuZ3JpZC5nZXRDdXJyZW50R3JpZFBhcmFtZXRlcnMoKTtcbiAgICAgIHJldHVybiB0aGlzLmxvYWRTb3VuZHMoKTtcbiAgICB9KS5jYXRjaChlcnIgPT4gdGhpcy5zaG93RXJyb3IoZXJyKSk7XG4gIH1cblxuICBsb2FkU291bmRzKCkge1xuICAgIC8vY29uc29sZS5sb2coJ0xvYWRpbmcgc291bmRzJyk7XG4gICAgbGV0IHByb21pc2VzID0gW107XG4gICAgdGhpcy50YXJnZXRfaWR4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5uX2FsdGVybmF0aXZlcyk7XG4gICAgLy9jb25zb2xlLmxvZygnVGFyZ2V0IGlzIGF0ICcgKyB0aGlzLnRhcmdldF9pZHgpO1xuICAgIGxldCBbbWFza19pLCB0YXJnX2ldID0gdGhpcy5ncmlkLmdldEN1cnJlbnRHcmlkUGFyYW1ldGVycygpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcbiAgICAgIGxldCBzdGltX2lkID0gJyc7XG4gICAgICBpZiAoaSA9PSB0aGlzLnRhcmdldF9pZHgpIHtcbiAgICAgICAgc3RpbV9pZCA9ICdmMTAwMF9sZXZlbCcgKyB0YXJnX2kgKyAnX2dhcCcgKyBtYXNrX2kgKyAnLndhdic7XG4gICAgICAgIHRoaXMuc291bmRfaWQgPSBzdGltX2lkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RpbV9pZCA9ICdmMTAwMF9nYXAnICsgbWFza19pICsgJy53YXYnO1xuICAgICAgfVxuICAgICAgbGV0IHNvdW5kcGF0aCA9IGZzLnBhdGguam9pbih0aGlzLmF1ZGlvUGF0aCwgc3RpbV9pZCk7XG4gICAgICBpZiAoIWZzLkZpbGUuZXhpc3RzKHNvdW5kcGF0aCkpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QoJ1NvdW5kIGZpbGUgJyArIHN0aW1faWQgKyAnIGRvZXMgbm90IGV4aXN0IScpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMucGxheWVyc1tpXS5pbml0RnJvbUZpbGUoe1xuICAgICAgICAgIGF1ZGlvRmlsZTogc291bmRwYXRoLFxuICAgICAgICAgIGxvb3A6IGZhbHNlLFxuICAgICAgICAgIGNvbXBsZXRlQ2FsbGJhY2s6IGFyZ3MgPT4ge1xuICAgICAgICAgICAgLy8gbm90ZTogcGFzc2luZyB0aGUgY3VycmVudCB2YWx1ZSBvZiBsb29wIHZhcmlhYmxlIGkgdG8gdGhlIGNhbGxiYWNrIGlzIG9ubHlcbiAgICAgICAgICAgIC8vIHBvc3NpYmxlIHdoZW4gdXNpbmcgJ2xldCcgaW4gdGhlIGxvb3AgaW5pdGlhbGl6YXRpb24uIGtleXdvcmRzOiBcImphdmFzY3JpcHQgY2xvc3VyZVwiXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMubmFtZSArICcgU291bmQgJyArIGkgKyAnIGVuZGVkLCBwbGF5aW5nIG5leHQnKTtcbiAgICAgICAgICAgIHRoaXMuc291bmRFbmRlZChpKTtcbiAgICAgICAgICAgIGlmIChpIDwgdGhpcy5uX2FsdGVybmF0aXZlcyAtIDEpIHtcbiAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHRoaXMuc3RhcnRTb3VuZChpKzEpKSwgdGhpcy5JU0lfbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLnRyaWFsRW5kZWQoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBlcnJvckNhbGxiYWNrOiBlcnJvciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShlcnJvcikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3IgaW5pdGlhbGl6aW5nIHBsYXllciAnICsgaSArICcsICcgKyBlcnIuZXh0cmEpO1xuICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHJlamVjdChlcnIuZXh0cmEpKTtcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuICB9XG5cbiAgaXNQbGF5aW5nKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5wbGF5ZXJzW2ldLmlzQXVkaW9QbGF5aW5nKCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBsYXlUcmlhbCgpIHtcbiAgICB0aGlzLm5hbWUgPSAncGxheWEnO1xuICAgIHJldHVybiB0aGlzLnN0YXJ0U291bmQoMCkudGhlbihcbiAgICAgICgpID0+IHtcbiAgICAgICAgdGhpcy50cmlhbE51bWJlciArPSAxO1xuICAgICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiV2hpY2ggc291bmQgaGFzIHRoZSB0YXJnZXQ/XCI7XG4gICAgICAgIHRoaXMuZW5hYmxlUGxheSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmFuc3dlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnTGlzdGVuJztcbiAgICAgIH0sXG4gICAgICBlcnIgPT4gdGhpcy5zaG93RXJyb3IoJ2NvdWxkIG5vdCBzdGFydCBzb3VuZDogJyArIGVycilcbiAgICApO1xuICB9XG5cbiAgc3RhcnRTb3VuZChwbGF5ZXJfaWR4KSB7XG4gICAgLy90aGlzLnBsYXllcnNbcGxheWVyX2lkeF0uZ2V0QXVkaW9UcmFja0R1cmF0aW9uKCkudGhlbihkdXJhdGlvbiA9PiB7XG4gICAgLy8gIGNvbnNvbGUubG9nKHRoaXMubmFtZSArICcgcGxheWluZyBzdGltICcgKyBwbGF5ZXJfaWR4ICsgJywgZHVyYXRpb24gJyArIGR1cmF0aW9uKTtcbiAgICAvL30pO1xuICAgIGlmICh0aGlzLmlzUGxheWluZygpKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gcmVqZWN0KCdwbGF5aW5nJykpO1xuICAgIH1cbiAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gcGxheWVyX2lkeDtcbiAgICB0aGlzLnBsYXllcnNbcGxheWVyX2lkeF0udm9sdW1lID0gdGhpcy52b2x1bWU7XG4gICAgcmV0dXJuIHRoaXMucGxheWVyc1twbGF5ZXJfaWR4XS5wbGF5KCk7XG4gIH1cblxuICBzb3VuZEVuZGVkKHBsYXllcl9pZHgpIHtcbiAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gLTE7XG4gIH1cblxuICB0cmlhbEVuZGVkKCkge1xuICAgIC8vY29uc29sZS5sb2codGhpcy5uYW1lICsgJyBUcmlhbCBlbmRlZCcpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ0NsaWNrIG9uIHRoZSBzb3VuZCB0aGF0IGhhZCB0aGUgdGFyZ2V0JztcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IHRydWU7XG4gICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdXYWl0aW5nIGZvciBhbnN3ZXInO1xuICB9XG5cbiAgd3JpdGVMb2cobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgdGhpcy5leHBlcmltZW50TG9nVGV4dC5wdXNoKG1lc3NhZ2UpO1xuXG4gICAgbGV0IGZpbGVIYW5kbGUgPSBmcy5GaWxlLmZyb21QYXRoKHRoaXMubG9nRmlsZVBhdGgpO1xuICAgIGxldCBsb2dzdHJpbmcgPSAnJztcbiAgICBmb3IgKGxldCByb3cgb2YgdGhpcy5leHBlcmltZW50TG9nVGV4dCkge1xuICAgICAgbG9nc3RyaW5nID0gbG9nc3RyaW5nLmNvbmNhdChyb3cgKyAnXFxuJyk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlSGFuZGxlLndyaXRlVGV4dChsb2dzdHJpbmcpLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLnNob3dFcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gdm9sdW1lRG93bigpIHtcbiAgLy8gICBpZiAodGhpcy52b2x1bWUgPiAwLjEpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lIC09IDAuMTtcbiAgLy8gICB9XG4gIC8vICAgdGhpcy51cGRhdGVWb2x1bWVJY29uKCk7XG4gIC8vICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdGhpcy52b2x1bWU7XG4gIC8vIH1cbiAgLy9cbiAgLy8gdm9sdW1lVXAoKSB7XG4gIC8vICAgaWYgKHRoaXMudm9sdW1lIDw9IDAuOSkge1xuICAvLyAgICAgdGhpcy52b2x1bWUgKz0gMC4xO1xuICAvLyAgIH1cbiAgLy8gICB0aGlzLnVwZGF0ZVZvbHVtZUljb24oKTtcbiAgLy8gICB0aGlzLnBsYXllci52b2x1bWUgPSAgdGhpcy52b2x1bWU7XG4gIC8vIH1cblxuICAvLyB1cGRhdGVWb2x1bWVJY29uKCkge1xuICAvLyAgIGlmICh0aGlzLnZvbHVtZSA8PSAwLjIpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtbXV0ZSc7XG4gIC8vICAgfSBlbHNlIGlmICh0aGlzLnZvbHVtZSA8PSAwLjYpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtZG93bic7XG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtdXAnO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHNob3dJbnN0cnVjdGlvbnMoKSB7XG5cbiAgfVxuXG4gIHNob3dFcnJvcihlcnIpIHtcbiAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBwYXNzXG4gICAgfSk7XG4gIH1cblxuICBmaW5pc2hFeHBlcmltZW50KCkge1xuICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgdGl0bGU6ICdFeHBlcmltZW50IGNvbXBsZXRlZCcsXG4gICAgICBtZXNzYWdlOiAnVGhlIGV4cGVyaW1lbnQgaXMgbm93IGZpbmlzaGVkLCB0aGFuayB5b3UgZm9yIHBhcnRpY2lwYXRpbmchJyxcbiAgICAgIG9rQnV0dG9uVGV4dDogJ09LJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIudXNlcm5hbWUgPSAnJztcblxuICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJy9zdGFydCddLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRoaXMuc2hvd0Vycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBhYm9ydEV4cGVyaW1lbnQoKSB7XG4gICAgZGlhbG9ncy5jb25maXJtKHtcbiAgICAgIHRpdGxlOiAnQWJvcnQgZXhwZXJpbWVudD8nLFxuICAgICAgbWVzc2FnZTogJ1RoZSBleHBlcmltZW50IGlzIG5vdCBmaW5pc2hlZCwgYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGFib3J0PyBZb3UgY2Fubm90IGNvbnRpbnVlIHRoZSBleHBlcmltZW50IGFmdGVyIHF1aXR0aW5nLicsXG4gICAgICBva0J1dHRvblRleHQ6ICdRdWl0JyxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6ICdTdGF5J1xuICAgIH0pLnRoZW4oYW5zID0+IHtcbiAgICAgIGlmIChhbnMpIHtcbiAgICAgICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIudXNlcm5hbWUgPSAnJztcblxuICAgICAgICByZXR1cm4gdGhpcy53cml0ZUxvZygnQWJvcnRlZCB0cmlhbC5cXG4nICsgSlNPTi5zdHJpbmdpZnkodGhpcy5ncmlkLmdldEhpc3RvcnkoKSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoWycvc3RhcnQnXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4gdGhpcy5zaG93RXJyb3IoZXJyKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxufVxuIl19