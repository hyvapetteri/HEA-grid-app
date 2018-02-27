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
function db2a(db) {
    return Math.pow(10, db / 20);
}
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
        this.volume = db2a(40) * sessionProvider.threshold;
        console.log('Volume: ' + this.volume);
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
        for (var i = 0; i < this.n_alternatives; i++) {
            this.players[i].volume = this.volume;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4cGVyaW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFDbEQscURBQXVEO0FBQ3ZELGlEQUFtRDtBQUVuRCx3REFBK0Q7QUFDL0Qsc0RBQStEO0FBRS9ELHlEQUErQztBQUUvQyx3REFBdUQ7QUFFdkQsK0NBQWlHO0FBSWpHLGNBQWMsRUFBUztJQUNyQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFRRDtJQTRCRSx3QkFBb0IsZUFBZ0MsRUFDaEMsZ0JBQWtDLEVBQ2xDLE9BQWU7UUFGbkMsaUJBMEVDO1FBMUVtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBTDNCLHNCQUFpQixHQUFrQixFQUFFLENBQUM7UUFPNUMsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO1FBRXZCLElBQUksY0FBYyxHQUFHLElBQUksZ0JBQVMsQ0FBQztZQUNqQyxJQUFJLEVBQUUsQ0FBQztZQUNQLElBQUksRUFBRSxFQUFFO1lBQ1IsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLEVBQUUsQ0FBQztZQUNQLElBQUksRUFBRSxFQUFFO1lBQ1IsSUFBSSxFQUFFLENBQUM7U0FDUixDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGtCQUFXLENBQUM7WUFDMUIsQ0FBQyxFQUFFLGNBQWM7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VUFBQSxHQUFHLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFuQixDQUFtQixDQUFDLENBQUM7WUFDdkMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXBUVSxjQUFjO1FBTjFCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLGlCQUFpQjtZQUMzQixXQUFXLEVBQUUsbUJBQW1CO1lBQ2hDLFNBQVMsRUFBRSxDQUFDLGtCQUFrQixDQUFDO1NBQ2hDLENBQUM7eUNBNkJxQyx5QkFBZTtZQUNkLHlCQUFnQjtZQUN6QixhQUFNO09BOUJ4QixjQUFjLENBc1QxQjtJQUFELHFCQUFDO0NBQUEsQUF0VEQsSUFzVEM7QUF0VFksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuXG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zaGFyZWQvc2Vzc2lvbi9zZXNzaW9uJztcbmltcG9ydCB7IFJvdXRlckV4dGVuc2lvbnMgfSBmcm9tICduYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXInO1xuXG5pbXBvcnQgeyBUTlNQbGF5ZXIgfSBmcm9tICduYXRpdmVzY3JpcHQtYXVkaW8nO1xuXG5pbXBvcnQgeyBlbnZpcm9ubWVudCB9IGZyb20gJy4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudCc7XG5pbXBvcnQgeyBzb3VuZF9jb25maWcgfSBmcm9tICcuL2V4cGVyaW1lbnQtY29uZmlnJztcbmltcG9ydCB7IFBhcmFtR3JpZCwgR3JpZFRyYWNrZXIsIFRyaWFsQW5zd2VyLCBHcmlkVHJhY2tpbmdTdGF0dXMgfSBmcm9tICcuLi8uLi9zaGFyZWQvZ3JpZC9ncmlkJztcblxuZGVjbGFyZSB2YXIgTlNVUkw7XG5cbmZ1bmN0aW9uIGRiMmEoZGI6bnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLnBvdygxMCwgZGIvMjApO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgc2VsZWN0b3I6ICdwYWdlLWV4cGVyaW1lbnQnLFxuICB0ZW1wbGF0ZVVybDogJy4vZXhwZXJpbWVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vZXhwZXJpbWVudC5jc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBFeHBlcmltZW50UGFnZSB7XG5cbiAgcHJpdmF0ZSB2b2x1bWU6IG51bWJlcjtcbiAgcHJpdmF0ZSB0cmlhbE51bWJlcjogbnVtYmVyO1xuICBwcml2YXRlIHVpZDogc3RyaW5nO1xuICBwcml2YXRlIGF1ZGlvUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIHZvbHVtZUljb246IHN0cmluZztcbiAgcHJpdmF0ZSBuX2FsdGVybmF0aXZlczogbnVtYmVyO1xuICBwcml2YXRlIHBsYXllcnM6IEFycmF5PFROU1BsYXllcj47XG4gIHByaXZhdGUgSVNJX21zOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSBuYW1lOiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBzb3VuZF9pZDogc3RyaW5nO1xuICBwcml2YXRlIGlzQ29ycmVjdDogYm9vbGVhbjtcbiAgcHJpdmF0ZSB0YXJnZXRfaWR4OiBudW1iZXI7XG5cbiAgcHJpdmF0ZSBwbGF5QnV0dG9uVGV4dDogc3RyaW5nO1xuICBwcml2YXRlIGluc3RydWN0aW9uVGV4dDogc3RyaW5nO1xuICBwcml2YXRlIGhpZ2hsaWdodGVkQnV0dG9uOiBudW1iZXI7XG4gIHByaXZhdGUgZW5hYmxlUGxheTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBlbmFibGVBbnN3ZXI6IGJvb2xlYW47XG4gIHByaXZhdGUgYW5zd2VyZWQ6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSBsb2dGaWxlUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIGV4cGVyaW1lbnRMb2dUZXh0OiBBcnJheTxzdHJpbmc+ID0gW107XG4gIHByaXZhdGUgZ3JpZDogR3JpZFRyYWNrZXI7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXNzaW9uUHJvdmlkZXI6IFNlc3Npb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zLFxuICAgICAgICAgICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSkge1xuXG4gICAgLy8gMkFGQyAtLT4gdHdvIHBsYXllcnNcbiAgICB0aGlzLm5fYWx0ZXJuYXRpdmVzID0gMjtcblxuICAgIHRoaXMubmFtZSA9ICdvcmlnaW5hbCc7XG5cbiAgICBsZXQgcGFyYW1ldGVyX2dyaWQgPSBuZXcgUGFyYW1HcmlkKHtcbiAgICAgIHhtaW46IDEsXG4gICAgICB4bWF4OiAxOCxcbiAgICAgIHhyZXM6IDEsXG4gICAgICB5bWluOiAxLFxuICAgICAgeW1heDogMjYsXG4gICAgICB5cmVzOiAxXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZygnR3JpZDonKTtcbiAgICBjb25zb2xlLmxvZyhwYXJhbWV0ZXJfZ3JpZC5wcmludEdyaWQoKSk7XG5cbiAgICB0aGlzLmdyaWQgPSBuZXcgR3JpZFRyYWNrZXIoe1xuICAgICAgZzogcGFyYW1ldGVyX2dyaWQsXG4gICAgICBtX3VwOiAxLFxuICAgICAgbl9kb3duOiAzLFxuICAgICAgbl9yZXZzOiAyLFxuICAgICAgbl9zdGVwOiA1MDBcbiAgICB9KTtcbiAgICB0aGlzLmdyaWQuaW5pdGlhbGl6ZSgwLCAyMyk7XG4gICAgY29uc29sZS5sb2coJ0dyaWQgaW5pdGlhbGl6ZWQnKTtcblxuICAgIHRoaXMucGxheWVycyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICB0aGlzLnBsYXllcnMucHVzaChuZXcgVE5TUGxheWVyKCkpO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnUGxheWVycyBpbml0aWFsaXplZDogJyArIHRoaXMucGxheWVycy5sZW5ndGgpO1xuICAgIHRoaXMuSVNJX21zID0gMjAwO1xuXG4gICAgdGhpcy52b2x1bWUgPSBkYjJhKDQwKSpzZXNzaW9uUHJvdmlkZXIudGhyZXNob2xkO1xuICAgIGNvbnNvbGUubG9nKCdWb2x1bWU6ICcgKyB0aGlzLnZvbHVtZSk7XG5cbiAgICBsZXQgYXBwUGF0aCA9IGZzLmtub3duRm9sZGVycy5jdXJyZW50QXBwKCk7XG4gICAgdGhpcy5hdWRpb1BhdGggPSBmcy5wYXRoLmpvaW4oYXBwUGF0aC5wYXRoLCAnYXVkaW8nKTtcbiAgICBjb25zb2xlLmxvZyh0aGlzLmF1ZGlvUGF0aCk7XG5cbiAgICB0aGlzLnRyaWFsTnVtYmVyID0gMDtcbiAgICB0aGlzLmxvYWRTb3VuZHMoKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdTb3VuZHMgbG9hZGVkJyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXM7IGkrKykge1xuICAgICAgICB0aGlzLnBsYXllcnNbaV0uZ2V0QXVkaW9UcmFja0R1cmF0aW9uKCkudGhlbihkdXIgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdQbGF5ZXIgJyArIGkgKyAnLCB0cmFjayBkdXJhdGlvbiAnICsgZHVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSBcIlBsYXkgbmV4dFwiO1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSBcIlByZXNzIHBsYXkgYnV0dG9uIHRvIGhlYXIgdGhlIHNvdW5kLlwiO1xuICAgICAgdGhpcy5oaWdobGlnaHRlZEJ1dHRvbiA9IC0xO1xuXG4gICAgICB0aGlzLmVuYWJsZVBsYXkgPSB0cnVlO1xuICAgICAgdGhpcy5lbmFibGVBbnN3ZXIgPSBmYWxzZTtcbiAgICAgIHRoaXMuYW5zd2VyZWQgPSBmYWxzZTtcblxuICAgICAgdGhpcy51aWQgPSBzZXNzaW9uUHJvdmlkZXIudXNlcm5hbWU7XG5cbiAgICAgIGxldCBkb2NzUGF0aCA9IGZzLmtub3duRm9sZGVycy5kb2N1bWVudHMoKS5wYXRoO1xuICAgICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBsZXQgbG9nZmlsZSA9IGVudmlyb25tZW50LmV4cGVyaW1lbnRGaWxlUHJlZml4ICsgdGhpcy51aWQgKyAnLScgKyBub3cuZ2V0SG91cnMoKSArICctJyArIG5vdy5nZXRNaW51dGVzKCkgKyAnLScgKyBub3cuZ2V0RGF0ZSgpICsgJy0nICsgbm93LmdldE1vbnRoKCkgKyAnLScgKyBub3cuZ2V0RnVsbFllYXIoKSArICcubG9nJztcbiAgICAgIHRoaXMubG9nRmlsZVBhdGggPSBmcy5wYXRoLmpvaW4oZG9jc1BhdGgsIGxvZ2ZpbGUpO1xuICAgICAgY29uc29sZS5sb2coJ0xvZ2dpbmcgdG8gJyArIGxvZ2ZpbGUpO1xuICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coJ0V4cGVyaW1lbnQgc3RhcnRlZCwgc3ViamVjdCAnICsgdGhpcy51aWQpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coJ3RyaWFsOyBzb3VuZGZpbGU7IGFuc3dlcjsgY29ycmVjdCcpO1xuICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcblxuICB9XG5cbiAgZXZhbHVhdGVBbnN3ZXIoYW5zd2VyKSB7XG4gICAgdGhpcy5lbmFibGVBbnN3ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmFuc3dlcmVkID0gdHJ1ZTtcbiAgICB0aGlzLmVuYWJsZVBsYXkgPSB0cnVlO1xuICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnUGxheSBuZXh0JztcblxuICAgIHRoaXMuaXNDb3JyZWN0ID0gKGFuc3dlciA9PSB0aGlzLnRhcmdldF9pZHgpO1xuICAgIGlmICh0aGlzLmlzQ29ycmVjdCkge1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnQ29ycmVjdCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ1dyb25nJztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy53cml0ZUxvZygnJyArIHRoaXMudHJpYWxOdW1iZXIgKyAnOycgKyB0aGlzLnNvdW5kX2lkICsgJzsnICsgYW5zd2VyICsgJzsnICsgdGhpcy5pc0NvcnJlY3QpLnRoZW4oKCkgPT4ge1xuICAgICAgbGV0IGFucyA9IHRoaXMuaXNDb3JyZWN0ID8gVHJpYWxBbnN3ZXIuQ29ycmVjdCA6IFRyaWFsQW5zd2VyLldyb25nO1xuICAgICAgdGhpcy5ncmlkLnVwZGF0ZVBvc2l0aW9uKGFucyk7IC8vIG1pZ2h0IHRocm93IGVycm9yIGlmIHNvbWV0aGluZyBnb2VzIHdyb25nLCBjYXRjaGVkIGxhdGVyXG4gICAgICBsZXQgW3gsIHldID0gdGhpcy5ncmlkLmdldEN1cnJlbnRHcmlkUGFyYW1ldGVycygpO1xuICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5ncmlkLmdldFN0YXR1cygpKSk7XG4gICAgICAvL2NvbnNvbGUubG9nKCduZXcgcG9zaXRpb24gJyArIHggKyAnLCAnICsgeSk7XG5cbiAgICAgIGlmICh0aGlzLmdyaWQuZ2V0U3RhdHVzKCkuZmluaXNoZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coSlNPTi5zdHJpbmdpZnkodGhpcy5ncmlkLmdldEhpc3RvcnkoKSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoRXhwZXJpbWVudCgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgbGV0IFt4cGFyYW0sIHlwYXJhbV0gPSB0aGlzLmdyaWQuZ2V0Q3VycmVudEdyaWRQYXJhbWV0ZXJzKCk7XG4gICAgICByZXR1cm4gdGhpcy5sb2FkU291bmRzKCk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuICB9XG5cbiAgbG9hZFNvdW5kcygpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdMb2FkaW5nIHNvdW5kcycpO1xuICAgIGxldCBwcm9taXNlcyA9IFtdO1xuICAgIHRoaXMudGFyZ2V0X2lkeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMubl9hbHRlcm5hdGl2ZXMpO1xuICAgIC8vY29uc29sZS5sb2coJ1RhcmdldCBpcyBhdCAnICsgdGhpcy50YXJnZXRfaWR4KTtcbiAgICBsZXQgW21hc2tfaSwgdGFyZ19pXSA9IHRoaXMuZ3JpZC5nZXRDdXJyZW50R3JpZFBhcmFtZXRlcnMoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICBsZXQgc3RpbV9pZCA9ICcnO1xuICAgICAgaWYgKGkgPT0gdGhpcy50YXJnZXRfaWR4KSB7XG4gICAgICAgIHN0aW1faWQgPSAnZjEwMDBfbGV2ZWwnICsgdGFyZ19pICsgJ19nYXAnICsgbWFza19pICsgJy53YXYnO1xuICAgICAgICB0aGlzLnNvdW5kX2lkID0gc3RpbV9pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0aW1faWQgPSAnZjEwMDBfZ2FwJyArIG1hc2tfaSArICcud2F2JztcbiAgICAgIH1cbiAgICAgIGxldCBzb3VuZHBhdGggPSBmcy5wYXRoLmpvaW4odGhpcy5hdWRpb1BhdGgsIHN0aW1faWQpO1xuICAgICAgaWYgKCFmcy5GaWxlLmV4aXN0cyhzb3VuZHBhdGgpKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2gobmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gcmVqZWN0KCdTb3VuZCBmaWxlICcgKyBzdGltX2lkICsgJyBkb2VzIG5vdCBleGlzdCEnKSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLnBsYXllcnNbaV0uaW5pdEZyb21GaWxlKHtcbiAgICAgICAgICBhdWRpb0ZpbGU6IHNvdW5kcGF0aCxcbiAgICAgICAgICBsb29wOiBmYWxzZSxcbiAgICAgICAgICBjb21wbGV0ZUNhbGxiYWNrOiBhcmdzID0+IHtcbiAgICAgICAgICAgIC8vIG5vdGU6IHBhc3NpbmcgdGhlIGN1cnJlbnQgdmFsdWUgb2YgbG9vcCB2YXJpYWJsZSBpIHRvIHRoZSBjYWxsYmFjayBpcyBvbmx5XG4gICAgICAgICAgICAvLyBwb3NzaWJsZSB3aGVuIHVzaW5nICdsZXQnIGluIHRoZSBsb29wIGluaXRpYWxpemF0aW9uLiBrZXl3b3JkczogXCJqYXZhc2NyaXB0IGNsb3N1cmVcIlxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyh0aGlzLm5hbWUgKyAnIFNvdW5kICcgKyBpICsgJyBlbmRlZCwgcGxheWluZyBuZXh0Jyk7XG4gICAgICAgICAgICB0aGlzLnNvdW5kRW5kZWQoaSk7XG4gICAgICAgICAgICBpZiAoaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXMgLSAxKSB7XG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLnN0YXJ0U291bmQoaSsxKSksIHRoaXMuSVNJX21zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gdGhpcy50cmlhbEVuZGVkKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyb3JDYWxsYmFjazogZXJyb3IgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoZXJyb3IpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGluaXRpYWxpemluZyBwbGF5ZXIgJyArIGkgKyAnLCAnICsgZXJyLmV4dHJhKTtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiByZWplY3QoZXJyLmV4dHJhKSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgfVxuXG4gIGlzUGxheWluZygpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXM7IGkrKykge1xuICAgICAgaWYgKHRoaXMucGxheWVyc1tpXS5pc0F1ZGlvUGxheWluZygpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwbGF5VHJpYWwoKSB7XG4gICAgdGhpcy5uYW1lID0gJ3BsYXlhJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXM7IGkrKykge1xuICAgICAgdGhpcy5wbGF5ZXJzW2ldLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zdGFydFNvdW5kKDApLnRoZW4oXG4gICAgICAoKSA9PiB7XG4gICAgICAgIHRoaXMudHJpYWxOdW1iZXIgKz0gMTtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSBcIldoaWNoIHNvdW5kIGhhcyB0aGUgdGFyZ2V0P1wiO1xuICAgICAgICB0aGlzLmVuYWJsZVBsYXkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lbmFibGVBbnN3ZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hbnN3ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gJ0xpc3Rlbic7XG4gICAgICB9LFxuICAgICAgZXJyID0+IHRoaXMuc2hvd0Vycm9yKCdjb3VsZCBub3Qgc3RhcnQgc291bmQ6ICcgKyBlcnIpXG4gICAgKTtcbiAgfVxuXG4gIHN0YXJ0U291bmQocGxheWVyX2lkeCkge1xuICAgIC8vdGhpcy5wbGF5ZXJzW3BsYXllcl9pZHhdLmdldEF1ZGlvVHJhY2tEdXJhdGlvbigpLnRoZW4oZHVyYXRpb24gPT4ge1xuICAgIC8vICBjb25zb2xlLmxvZyh0aGlzLm5hbWUgKyAnIHBsYXlpbmcgc3RpbSAnICsgcGxheWVyX2lkeCArICcsIGR1cmF0aW9uICcgKyBkdXJhdGlvbik7XG4gICAgLy99KTtcbiAgICBpZiAodGhpcy5pc1BsYXlpbmcoKSkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdCgncGxheWluZycpKTtcbiAgICB9XG4gICAgdGhpcy5oaWdobGlnaHRlZEJ1dHRvbiA9IHBsYXllcl9pZHg7XG4gICAgcmV0dXJuIHRoaXMucGxheWVyc1twbGF5ZXJfaWR4XS5wbGF5KCk7XG4gIH1cblxuICBzb3VuZEVuZGVkKHBsYXllcl9pZHgpIHtcbiAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gLTE7XG4gIH1cblxuICB0cmlhbEVuZGVkKCkge1xuICAgIC8vY29uc29sZS5sb2codGhpcy5uYW1lICsgJyBUcmlhbCBlbmRlZCcpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ0NsaWNrIG9uIHRoZSBzb3VuZCB0aGF0IGhhZCB0aGUgdGFyZ2V0JztcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IHRydWU7XG4gICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdXYWl0aW5nIGZvciBhbnN3ZXInO1xuICB9XG5cbiAgd3JpdGVMb2cobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgdGhpcy5leHBlcmltZW50TG9nVGV4dC5wdXNoKG1lc3NhZ2UpO1xuXG4gICAgbGV0IGZpbGVIYW5kbGUgPSBmcy5GaWxlLmZyb21QYXRoKHRoaXMubG9nRmlsZVBhdGgpO1xuICAgIGxldCBsb2dzdHJpbmcgPSAnJztcbiAgICBmb3IgKGxldCByb3cgb2YgdGhpcy5leHBlcmltZW50TG9nVGV4dCkge1xuICAgICAgbG9nc3RyaW5nID0gbG9nc3RyaW5nLmNvbmNhdChyb3cgKyAnXFxuJyk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlSGFuZGxlLndyaXRlVGV4dChsb2dzdHJpbmcpLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLnNob3dFcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gdm9sdW1lRG93bigpIHtcbiAgLy8gICBpZiAodGhpcy52b2x1bWUgPiAwLjEpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lIC09IDAuMTtcbiAgLy8gICB9XG4gIC8vICAgdGhpcy51cGRhdGVWb2x1bWVJY29uKCk7XG4gIC8vICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdGhpcy52b2x1bWU7XG4gIC8vIH1cbiAgLy9cbiAgLy8gdm9sdW1lVXAoKSB7XG4gIC8vICAgaWYgKHRoaXMudm9sdW1lIDw9IDAuOSkge1xuICAvLyAgICAgdGhpcy52b2x1bWUgKz0gMC4xO1xuICAvLyAgIH1cbiAgLy8gICB0aGlzLnVwZGF0ZVZvbHVtZUljb24oKTtcbiAgLy8gICB0aGlzLnBsYXllci52b2x1bWUgPSAgdGhpcy52b2x1bWU7XG4gIC8vIH1cblxuICAvLyB1cGRhdGVWb2x1bWVJY29uKCkge1xuICAvLyAgIGlmICh0aGlzLnZvbHVtZSA8PSAwLjIpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtbXV0ZSc7XG4gIC8vICAgfSBlbHNlIGlmICh0aGlzLnZvbHVtZSA8PSAwLjYpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtZG93bic7XG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtdXAnO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHNob3dJbnN0cnVjdGlvbnMoKSB7XG5cbiAgfVxuXG4gIHNob3dFcnJvcihlcnIpIHtcbiAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBwYXNzXG4gICAgfSk7XG4gIH1cblxuICBmaW5pc2hFeHBlcmltZW50KCkge1xuICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgdGl0bGU6ICdFeHBlcmltZW50IGNvbXBsZXRlZCcsXG4gICAgICBtZXNzYWdlOiAnVGhlIGV4cGVyaW1lbnQgaXMgbm93IGZpbmlzaGVkLCB0aGFuayB5b3UgZm9yIHBhcnRpY2lwYXRpbmchJyxcbiAgICAgIG9rQnV0dG9uVGV4dDogJ09LJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJy9zdGFydCddLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRoaXMuc2hvd0Vycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBhYm9ydEV4cGVyaW1lbnQoKSB7XG4gICAgZGlhbG9ncy5jb25maXJtKHtcbiAgICAgIHRpdGxlOiAnQWJvcnQgZXhwZXJpbWVudD8nLFxuICAgICAgbWVzc2FnZTogJ1RoZSBleHBlcmltZW50IGlzIG5vdCBmaW5pc2hlZCwgYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGFib3J0PyBZb3UgY2Fubm90IGNvbnRpbnVlIHRoZSBleHBlcmltZW50IGFmdGVyIHF1aXR0aW5nLicsXG4gICAgICBva0J1dHRvblRleHQ6ICdRdWl0JyxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6ICdTdGF5J1xuICAgIH0pLnRoZW4oYW5zID0+IHtcbiAgICAgIGlmIChhbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coJ0Fib3J0ZWQgdHJpYWwuXFxuJyArIEpTT04uc3RyaW5naWZ5KHRoaXMuZ3JpZC5nZXRIaXN0b3J5KCkpKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnL3N0YXJ0J10sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbn1cbiJdfQ==