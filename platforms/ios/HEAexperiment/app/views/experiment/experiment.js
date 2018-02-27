"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var user_1 = require("../../shared/user/user");
var router_1 = require("nativescript-angular/router");
var nativescript_audio_1 = require("nativescript-audio");
var environment_1 = require("../../config/environment");
var grid_1 = require("../../shared/grid/grid");
var ExperimentPage = (function () {
    function ExperimentPage(userProvider, routerExtensions, _ngZone) {
        var _this = this;
        this.userProvider = userProvider;
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
            _this.uid = userProvider.username;
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
            _this.userProvider.username = '';
            _this.userProvider.age = null;
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
                _this.userProvider.username = '';
                _this.userProvider.age = null;
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
        __metadata("design:paramtypes", [user_1.UserProvider,
            router_1.RouterExtensions,
            core_1.NgZone])
    ], ExperimentPage);
    return ExperimentPage;
}());
exports.ExperimentPage = ExperimentPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4cGVyaW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFDbEQscURBQXVEO0FBQ3ZELGlEQUFtRDtBQUVuRCwrQ0FBc0Q7QUFDdEQsc0RBQStEO0FBRS9ELHlEQUErQztBQUUvQyx3REFBdUQ7QUFFdkQsK0NBQWlHO0FBVWpHO0lBNEJFLHdCQUFvQixZQUEwQixFQUMxQixnQkFBa0MsRUFDbEMsT0FBZTtRQUZuQyxpQkF5RUM7UUF6RW1CLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBQzFCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUwzQixzQkFBaUIsR0FBa0IsRUFBRSxDQUFDO1FBTzVDLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztRQUV4QixJQUFJLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztRQUV2QixJQUFJLGNBQWMsR0FBRyxJQUFJLGdCQUFTLENBQUM7WUFDakMsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxDQUFDO1lBQ1AsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxDQUFDO1NBQ1IsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBRXhDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxrQkFBVyxDQUFDO1lBQzFCLENBQUMsRUFBRSxjQUFjO1lBQ2pCLElBQUksRUFBRSxDQUFDO1lBQ1AsTUFBTSxFQUFFLENBQUM7WUFDVCxNQUFNLEVBQUUsQ0FBQztZQUNULE1BQU0sRUFBRSxHQUFHO1NBQ1osQ0FBQyxDQUFDO1FB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QXZUVSxjQUFjO1FBTjFCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLGlCQUFpQjtZQUMzQixXQUFXLEVBQUUsbUJBQW1CO1lBQ2hDLFNBQVMsRUFBRSxDQUFDLGtCQUFrQixDQUFDO1NBQ2hDLENBQUM7eUNBNkJrQyxtQkFBWTtZQUNSLHlCQUFnQjtZQUN6QixhQUFNO09BOUJ4QixjQUFjLENBeVQxQjtJQUFELHFCQUFDO0NBQUEsQUF6VEQsSUF5VEM7QUF6VFksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuXG5pbXBvcnQgeyBVc2VyUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zaGFyZWQvdXNlci91c2VyJztcbmltcG9ydCB7IFJvdXRlckV4dGVuc2lvbnMgfSBmcm9tICduYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXInO1xuXG5pbXBvcnQgeyBUTlNQbGF5ZXIgfSBmcm9tICduYXRpdmVzY3JpcHQtYXVkaW8nO1xuXG5pbXBvcnQgeyBlbnZpcm9ubWVudCB9IGZyb20gJy4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudCc7XG5pbXBvcnQgeyBzb3VuZF9jb25maWcgfSBmcm9tICcuL2V4cGVyaW1lbnQtY29uZmlnJztcbmltcG9ydCB7IFBhcmFtR3JpZCwgR3JpZFRyYWNrZXIsIFRyaWFsQW5zd2VyLCBHcmlkVHJhY2tpbmdTdGF0dXMgfSBmcm9tICcuLi8uLi9zaGFyZWQvZ3JpZC9ncmlkJztcblxuZGVjbGFyZSB2YXIgTlNVUkw7XG5cbkBDb21wb25lbnQoe1xuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICBzZWxlY3RvcjogJ3BhZ2UtZXhwZXJpbWVudCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9leHBlcmltZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9leHBlcmltZW50LmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIEV4cGVyaW1lbnRQYWdlIHtcblxuICBwcml2YXRlIHZvbHVtZTogbnVtYmVyO1xuICBwcml2YXRlIHRyaWFsTnVtYmVyOiBudW1iZXI7XG4gIHByaXZhdGUgdWlkOiBzdHJpbmc7XG4gIHByaXZhdGUgYXVkaW9QYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgdm9sdW1lSWNvbjogc3RyaW5nO1xuICBwcml2YXRlIG5fYWx0ZXJuYXRpdmVzOiBudW1iZXI7XG4gIHByaXZhdGUgcGxheWVyczogQXJyYXk8VE5TUGxheWVyPjtcbiAgcHJpdmF0ZSBJU0lfbXM6IG51bWJlcjtcblxuICBwcml2YXRlIG5hbWU6IHN0cmluZztcblxuICBwcml2YXRlIHNvdW5kX2lkOiBzdHJpbmc7XG4gIHByaXZhdGUgaXNDb3JyZWN0OiBib29sZWFuO1xuICBwcml2YXRlIHRhcmdldF9pZHg6IG51bWJlcjtcblxuICBwcml2YXRlIHBsYXlCdXR0b25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgaW5zdHJ1Y3Rpb25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgaGlnaGxpZ2h0ZWRCdXR0b246IG51bWJlcjtcbiAgcHJpdmF0ZSBlbmFibGVQbGF5OiBib29sZWFuO1xuICBwcml2YXRlIGVuYWJsZUFuc3dlcjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBhbnN3ZXJlZDogYm9vbGVhbjtcblxuICBwcml2YXRlIGxvZ0ZpbGVQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgZXhwZXJpbWVudExvZ1RleHQ6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgcHJpdmF0ZSBncmlkOiBHcmlkVHJhY2tlcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHVzZXJQcm92aWRlcjogVXNlclByb3ZpZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lKSB7XG5cbiAgICAvLyAyQUZDIC0tPiB0d28gcGxheWVyc1xuICAgIHRoaXMubl9hbHRlcm5hdGl2ZXMgPSAyO1xuXG4gICAgdGhpcy5uYW1lID0gJ29yaWdpbmFsJztcblxuICAgIGxldCBwYXJhbWV0ZXJfZ3JpZCA9IG5ldyBQYXJhbUdyaWQoe1xuICAgICAgeG1pbjogMSxcbiAgICAgIHhtYXg6IDE4LFxuICAgICAgeHJlczogMSxcbiAgICAgIHltaW46IDEsXG4gICAgICB5bWF4OiAyNixcbiAgICAgIHlyZXM6IDFcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKCdHcmlkOicpO1xuICAgIGNvbnNvbGUubG9nKHBhcmFtZXRlcl9ncmlkLnByaW50R3JpZCgpKTtcblxuICAgIHRoaXMuZ3JpZCA9IG5ldyBHcmlkVHJhY2tlcih7XG4gICAgICBnOiBwYXJhbWV0ZXJfZ3JpZCxcbiAgICAgIG1fdXA6IDEsXG4gICAgICBuX2Rvd246IDMsXG4gICAgICBuX3JldnM6IDIsXG4gICAgICBuX3N0ZXA6IDUwMFxuICAgIH0pO1xuICAgIHRoaXMuZ3JpZC5pbml0aWFsaXplKDAsIDIzKTtcbiAgICBjb25zb2xlLmxvZygnR3JpZCBpbml0aWFsaXplZCcpO1xuXG4gICAgdGhpcy5wbGF5ZXJzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcbiAgICAgIHRoaXMucGxheWVycy5wdXNoKG5ldyBUTlNQbGF5ZXIoKSk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdQbGF5ZXJzIGluaXRpYWxpemVkOiAnICsgdGhpcy5wbGF5ZXJzLmxlbmd0aCk7XG4gICAgdGhpcy5JU0lfbXMgPSAyMDA7XG5cbiAgICB0aGlzLnZvbHVtZSA9IDAuNztcblxuICAgIGxldCBhcHBQYXRoID0gZnMua25vd25Gb2xkZXJzLmN1cnJlbnRBcHAoKTtcbiAgICB0aGlzLmF1ZGlvUGF0aCA9IGZzLnBhdGguam9pbihhcHBQYXRoLnBhdGgsICdhdWRpbycpO1xuICAgIGNvbnNvbGUubG9nKHRoaXMuYXVkaW9QYXRoKTtcblxuICAgIHRoaXMudHJpYWxOdW1iZXIgPSAwO1xuICAgIHRoaXMubG9hZFNvdW5kcygpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1NvdW5kcyBsb2FkZWQnKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICAgIHRoaXMucGxheWVyc1tpXS5nZXRBdWRpb1RyYWNrRHVyYXRpb24oKS50aGVuKGR1ciA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1BsYXllciAnICsgaSArICcsIHRyYWNrIGR1cmF0aW9uICcgKyBkdXIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9IFwiUGxheSBuZXh0XCI7XG4gICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiUHJlc3MgcGxheSBidXR0b24gdG8gaGVhciB0aGUgc291bmQuXCI7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gLTE7XG5cbiAgICAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG4gICAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbnN3ZXJlZCA9IGZhbHNlO1xuXG4gICAgICB0aGlzLnVpZCA9IHVzZXJQcm92aWRlci51c2VybmFtZTtcblxuICAgICAgbGV0IGRvY3NQYXRoID0gZnMua25vd25Gb2xkZXJzLmRvY3VtZW50cygpLnBhdGg7XG4gICAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBsb2dmaWxlID0gZW52aXJvbm1lbnQuZXhwZXJpbWVudEZpbGVQcmVmaXggKyB0aGlzLnVpZCArICctJyArIG5vdy5nZXRIb3VycygpICsgJy0nICsgbm93LmdldE1pbnV0ZXMoKSArICctJyArIG5vdy5nZXREYXRlKCkgKyAnLScgKyBub3cuZ2V0TW9udGgoKSArICctJyArIG5vdy5nZXRGdWxsWWVhcigpICsgJy5sb2cnO1xuICAgICAgdGhpcy5sb2dGaWxlUGF0aCA9IGZzLnBhdGguam9pbihkb2NzUGF0aCwgbG9nZmlsZSk7XG4gICAgICBjb25zb2xlLmxvZygnTG9nZ2luZyB0byAnICsgbG9nZmlsZSk7XG4gICAgICByZXR1cm4gdGhpcy53cml0ZUxvZygnRXhwZXJpbWVudCBzdGFydGVkLCBzdWJqZWN0ICcgKyB0aGlzLnVpZCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy53cml0ZUxvZygndHJpYWw7IHNvdW5kZmlsZTsgYW5zd2VyOyBjb3JyZWN0Jyk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuXG4gIH1cblxuICBldmFsdWF0ZUFuc3dlcihhbnN3ZXIpIHtcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgIHRoaXMuYW5zd2VyZWQgPSB0cnVlO1xuICAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG4gICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdQbGF5IG5leHQnO1xuXG4gICAgdGhpcy5pc0NvcnJlY3QgPSAoYW5zd2VyID09IHRoaXMudGFyZ2V0X2lkeCk7XG4gICAgaWYgKHRoaXMuaXNDb3JyZWN0KSB7XG4gICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdDb3JyZWN0JztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnV3JvbmcnO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLndyaXRlTG9nKCcnICsgdGhpcy50cmlhbE51bWJlciArICc7JyArIHRoaXMuc291bmRfaWQgKyAnOycgKyBhbnN3ZXIgKyAnOycgKyB0aGlzLmlzQ29ycmVjdCkudGhlbigoKSA9PiB7XG4gICAgICBsZXQgYW5zID0gdGhpcy5pc0NvcnJlY3QgPyBUcmlhbEFuc3dlci5Db3JyZWN0IDogVHJpYWxBbnN3ZXIuV3Jvbmc7XG4gICAgICB0aGlzLmdyaWQudXBkYXRlUG9zaXRpb24oYW5zKTsgLy8gbWlnaHQgdGhyb3cgZXJyb3IgaWYgc29tZXRoaW5nIGdvZXMgd3JvbmcsIGNhdGNoZWQgbGF0ZXJcbiAgICAgIGxldCBbeCwgeV0gPSB0aGlzLmdyaWQuZ2V0Q3VycmVudEdyaWRQYXJhbWV0ZXJzKCk7XG4gICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmdyaWQuZ2V0U3RhdHVzKCkpKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ25ldyBwb3NpdGlvbiAnICsgeCArICcsICcgKyB5KTtcblxuICAgICAgaWYgKHRoaXMuZ3JpZC5nZXRTdGF0dXMoKS5maW5pc2hlZCkge1xuICAgICAgICByZXR1cm4gdGhpcy53cml0ZUxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmdyaWQuZ2V0SGlzdG9yeSgpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2hFeHBlcmltZW50KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBsZXQgW3hwYXJhbSwgeXBhcmFtXSA9IHRoaXMuZ3JpZC5nZXRDdXJyZW50R3JpZFBhcmFtZXRlcnMoKTtcbiAgICAgIHJldHVybiB0aGlzLmxvYWRTb3VuZHMoKTtcbiAgICB9KS5jYXRjaChlcnIgPT4gdGhpcy5zaG93RXJyb3IoZXJyKSk7XG4gIH1cblxuICBsb2FkU291bmRzKCkge1xuICAgIC8vY29uc29sZS5sb2coJ0xvYWRpbmcgc291bmRzJyk7XG4gICAgbGV0IHByb21pc2VzID0gW107XG4gICAgdGhpcy50YXJnZXRfaWR4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5uX2FsdGVybmF0aXZlcyk7XG4gICAgLy9jb25zb2xlLmxvZygnVGFyZ2V0IGlzIGF0ICcgKyB0aGlzLnRhcmdldF9pZHgpO1xuICAgIGxldCBbbWFza19pLCB0YXJnX2ldID0gdGhpcy5ncmlkLmdldEN1cnJlbnRHcmlkUGFyYW1ldGVycygpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcbiAgICAgIGxldCBzdGltX2lkID0gJyc7XG4gICAgICBpZiAoaSA9PSB0aGlzLnRhcmdldF9pZHgpIHtcbiAgICAgICAgc3RpbV9pZCA9ICdmMTAwMF9sZXZlbCcgKyB0YXJnX2kgKyAnX2dhcCcgKyBtYXNrX2kgKyAnLndhdic7XG4gICAgICAgIHRoaXMuc291bmRfaWQgPSBzdGltX2lkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RpbV9pZCA9ICdmMTAwMF9nYXAnICsgbWFza19pICsgJy53YXYnO1xuICAgICAgfVxuICAgICAgbGV0IHNvdW5kcGF0aCA9IGZzLnBhdGguam9pbih0aGlzLmF1ZGlvUGF0aCwgc3RpbV9pZCk7XG4gICAgICBpZiAoIWZzLkZpbGUuZXhpc3RzKHNvdW5kcGF0aCkpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QoJ1NvdW5kIGZpbGUgJyArIHN0aW1faWQgKyAnIGRvZXMgbm90IGV4aXN0IScpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMucGxheWVyc1tpXS5pbml0RnJvbUZpbGUoe1xuICAgICAgICAgIGF1ZGlvRmlsZTogc291bmRwYXRoLFxuICAgICAgICAgIGxvb3A6IGZhbHNlLFxuICAgICAgICAgIGNvbXBsZXRlQ2FsbGJhY2s6IGFyZ3MgPT4ge1xuICAgICAgICAgICAgLy8gbm90ZTogcGFzc2luZyB0aGUgY3VycmVudCB2YWx1ZSBvZiBsb29wIHZhcmlhYmxlIGkgdG8gdGhlIGNhbGxiYWNrIGlzIG9ubHlcbiAgICAgICAgICAgIC8vIHBvc3NpYmxlIHdoZW4gdXNpbmcgJ2xldCcgaW4gdGhlIGxvb3AgaW5pdGlhbGl6YXRpb24uIGtleXdvcmRzOiBcImphdmFzY3JpcHQgY2xvc3VyZVwiXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMubmFtZSArICcgU291bmQgJyArIGkgKyAnIGVuZGVkLCBwbGF5aW5nIG5leHQnKTtcbiAgICAgICAgICAgIHRoaXMuc291bmRFbmRlZChpKTtcbiAgICAgICAgICAgIGlmIChpIDwgdGhpcy5uX2FsdGVybmF0aXZlcyAtIDEpIHtcbiAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHRoaXMuc3RhcnRTb3VuZChpKzEpKSwgdGhpcy5JU0lfbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLnRyaWFsRW5kZWQoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBlcnJvckNhbGxiYWNrOiBlcnJvciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShlcnJvcikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3IgaW5pdGlhbGl6aW5nIHBsYXllciAnICsgaSArICcsICcgKyBlcnIuZXh0cmEpO1xuICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHJlamVjdChlcnIuZXh0cmEpKTtcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuICB9XG5cbiAgaXNQbGF5aW5nKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5wbGF5ZXJzW2ldLmlzQXVkaW9QbGF5aW5nKCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBsYXlUcmlhbCgpIHtcbiAgICB0aGlzLm5hbWUgPSAncGxheWEnO1xuICAgIHJldHVybiB0aGlzLnN0YXJ0U291bmQoMCkudGhlbihcbiAgICAgICgpID0+IHtcbiAgICAgICAgdGhpcy50cmlhbE51bWJlciArPSAxO1xuICAgICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiV2hpY2ggc291bmQgaGFzIHRoZSB0YXJnZXQ/XCI7XG4gICAgICAgIHRoaXMuZW5hYmxlUGxheSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmFuc3dlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnTGlzdGVuJztcbiAgICAgIH0sXG4gICAgICBlcnIgPT4gdGhpcy5zaG93RXJyb3IoJ2NvdWxkIG5vdCBzdGFydCBzb3VuZDogJyArIGVycilcbiAgICApO1xuICB9XG5cbiAgc3RhcnRTb3VuZChwbGF5ZXJfaWR4KSB7XG4gICAgLy90aGlzLnBsYXllcnNbcGxheWVyX2lkeF0uZ2V0QXVkaW9UcmFja0R1cmF0aW9uKCkudGhlbihkdXJhdGlvbiA9PiB7XG4gICAgLy8gIGNvbnNvbGUubG9nKHRoaXMubmFtZSArICcgcGxheWluZyBzdGltICcgKyBwbGF5ZXJfaWR4ICsgJywgZHVyYXRpb24gJyArIGR1cmF0aW9uKTtcbiAgICAvL30pO1xuICAgIGlmICh0aGlzLmlzUGxheWluZygpKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gcmVqZWN0KCdwbGF5aW5nJykpO1xuICAgIH1cbiAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gcGxheWVyX2lkeDtcbiAgICB0aGlzLnBsYXllcnNbcGxheWVyX2lkeF0udm9sdW1lID0gdGhpcy52b2x1bWU7XG4gICAgcmV0dXJuIHRoaXMucGxheWVyc1twbGF5ZXJfaWR4XS5wbGF5KCk7XG4gIH1cblxuICBzb3VuZEVuZGVkKHBsYXllcl9pZHgpIHtcbiAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gLTE7XG4gIH1cblxuICB0cmlhbEVuZGVkKCkge1xuICAgIC8vY29uc29sZS5sb2codGhpcy5uYW1lICsgJyBUcmlhbCBlbmRlZCcpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ0NsaWNrIG9uIHRoZSBzb3VuZCB0aGF0IGhhZCB0aGUgdGFyZ2V0JztcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IHRydWU7XG4gICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdXYWl0aW5nIGZvciBhbnN3ZXInO1xuICB9XG5cbiAgd3JpdGVMb2cobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgdGhpcy5leHBlcmltZW50TG9nVGV4dC5wdXNoKG1lc3NhZ2UpO1xuXG4gICAgbGV0IGZpbGVIYW5kbGUgPSBmcy5GaWxlLmZyb21QYXRoKHRoaXMubG9nRmlsZVBhdGgpO1xuICAgIGxldCBsb2dzdHJpbmcgPSAnJztcbiAgICBmb3IgKGxldCByb3cgb2YgdGhpcy5leHBlcmltZW50TG9nVGV4dCkge1xuICAgICAgbG9nc3RyaW5nID0gbG9nc3RyaW5nLmNvbmNhdChyb3cgKyAnXFxuJyk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlSGFuZGxlLndyaXRlVGV4dChsb2dzdHJpbmcpLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLnNob3dFcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gdm9sdW1lRG93bigpIHtcbiAgLy8gICBpZiAodGhpcy52b2x1bWUgPiAwLjEpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lIC09IDAuMTtcbiAgLy8gICB9XG4gIC8vICAgdGhpcy51cGRhdGVWb2x1bWVJY29uKCk7XG4gIC8vICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdGhpcy52b2x1bWU7XG4gIC8vIH1cbiAgLy9cbiAgLy8gdm9sdW1lVXAoKSB7XG4gIC8vICAgaWYgKHRoaXMudm9sdW1lIDw9IDAuOSkge1xuICAvLyAgICAgdGhpcy52b2x1bWUgKz0gMC4xO1xuICAvLyAgIH1cbiAgLy8gICB0aGlzLnVwZGF0ZVZvbHVtZUljb24oKTtcbiAgLy8gICB0aGlzLnBsYXllci52b2x1bWUgPSAgdGhpcy52b2x1bWU7XG4gIC8vIH1cblxuICAvLyB1cGRhdGVWb2x1bWVJY29uKCkge1xuICAvLyAgIGlmICh0aGlzLnZvbHVtZSA8PSAwLjIpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtbXV0ZSc7XG4gIC8vICAgfSBlbHNlIGlmICh0aGlzLnZvbHVtZSA8PSAwLjYpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtZG93bic7XG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtdXAnO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHNob3dJbnN0cnVjdGlvbnMoKSB7XG5cbiAgfVxuXG4gIHNob3dFcnJvcihlcnIpIHtcbiAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBwYXNzXG4gICAgfSk7XG4gIH1cblxuICBmaW5pc2hFeHBlcmltZW50KCkge1xuICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgdGl0bGU6ICdFeHBlcmltZW50IGNvbXBsZXRlZCcsXG4gICAgICBtZXNzYWdlOiAnVGhlIGV4cGVyaW1lbnQgaXMgbm93IGZpbmlzaGVkLCB0aGFuayB5b3UgZm9yIHBhcnRpY2lwYXRpbmchJyxcbiAgICAgIG9rQnV0dG9uVGV4dDogJ09LJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy51c2VyUHJvdmlkZXIudXNlcm5hbWUgPSAnJztcbiAgICAgIHRoaXMudXNlclByb3ZpZGVyLmFnZSA9IG51bGw7XG5cbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoWycvc3RhcnQnXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLnNob3dFcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgYWJvcnRFeHBlcmltZW50KCkge1xuICAgIGRpYWxvZ3MuY29uZmlybSh7XG4gICAgICB0aXRsZTogJ0Fib3J0IGV4cGVyaW1lbnQ/JyxcbiAgICAgIG1lc3NhZ2U6ICdUaGUgZXhwZXJpbWVudCBpcyBub3QgZmluaXNoZWQsIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBhYm9ydD8gWW91IGNhbm5vdCBjb250aW51ZSB0aGUgZXhwZXJpbWVudCBhZnRlciBxdWl0dGluZy4nLFxuICAgICAgb2tCdXR0b25UZXh0OiAnUXVpdCcsXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiAnU3RheSdcbiAgICB9KS50aGVuKGFucyA9PiB7XG4gICAgICBpZiAoYW5zKSB7XG4gICAgICAgIHRoaXMudXNlclByb3ZpZGVyLnVzZXJuYW1lID0gJyc7XG4gICAgICAgIHRoaXMudXNlclByb3ZpZGVyLmFnZSA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coJ0Fib3J0ZWQgdHJpYWwuXFxuJyArIEpTT04uc3RyaW5naWZ5KHRoaXMuZ3JpZC5nZXRIaXN0b3J5KCkpKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnL3N0YXJ0J10sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbn1cbiJdfQ==