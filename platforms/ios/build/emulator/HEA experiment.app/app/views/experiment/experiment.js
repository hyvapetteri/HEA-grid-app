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
    function ExperimentPage(userProvider, routerExtensions) {
        this.userProvider = userProvider;
        this.routerExtensions = routerExtensions;
        this.experimentLogText = [];
        // 2AFC --> two players
        this.n_alternatives = 2;
        var parameter_grid = new grid_1.ParamGrid({
            xmin: 1,
            xmax: 18,
            xres: 1,
            ymin: 1,
            ymax: 26,
            yres: 1
        });
        this.grid = new grid_1.GridTracker({
            g: parameter_grid,
            m_up: 1,
            n_down: 3,
            n_revs: 2,
            n_step: 500
        });
        this.grid.initialize(1, 23);
        this.players = [];
        for (var i = 0; i < this.n_alternatives; i++) {
            this.players.push(new nativescript_audio_1.TNSPlayer());
        }
        this.ISI_ms = 200;
        this.volume = 0.7;
        var appPath = fs.knownFolders.currentApp();
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
        var docsPath = fs.knownFolders.documents().path;
        var now = new Date();
        var logfile = environment_1.environment.experimentFilePrefix + this.uid + '-' + now.getHours() + '-' + now.getMinutes() + '-' + now.getDate() + '-' + now.getMonth() + '-' + now.getFullYear() + '.log';
        this.logFilePath = fs.path.join(docsPath, logfile);
        console.log('Logging to ' + logfile);
        this.writeLog('Experiment started, subject ' + this.uid);
        this.writeLog('trial; soundfile; answer; correct');
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
            if (_this.grid.getStatus().finished) {
                return _this.writeLog(JSON.stringify(_this.grid.getHistory())).then(function () {
                    _this.finishExperiment();
                });
            }
            var _a = _this.grid.getCurrentGridParameters(), xparam = _a[0], yparam = _a[1];
            return _this.loadSounds();
        }).catch(function (err) { return _this.showError(err); });
    };
    ExperimentPage.prototype.loadSounds = function () {
        var _this = this;
        var promises = [];
        this.target_idx = Math.floor(Math.random() * this.n_alternatives);
        var _a = this.grid.getCurrentGridParameters(), mask_i = _a[0], targ_i = _a[1];
        var _loop_1 = function (i) {
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
                        _this.soundEnded(i);
                        if (i < _this.n_alternatives - 1) {
                            setTimeout(function () { return _this.startSound(i + 1); }, _this.ISI_ms);
                        }
                        else {
                            _this.trialEnded();
                        }
                    },
                    errorCallback: function (error) {
                        console.log(JSON.stringify(error));
                    }
                }).catch(function (err) {
                    return new Promise(function (resolve, reject) { return reject(err.extra); });
                }));
            }
        };
        var this_1 = this;
        for (var i = 0; i < this.n_alternatives - 1; i++) {
            _loop_1(i);
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
            router_1.RouterExtensions])
    ], ExperimentPage);
    return ExperimentPage;
}());
exports.ExperimentPage = ExperimentPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4cGVyaW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMEM7QUFDMUMscURBQXVEO0FBQ3ZELGlEQUFtRDtBQUVuRCwrQ0FBc0Q7QUFDdEQsc0RBQStEO0FBRS9ELHlEQUErQztBQUUvQyx3REFBdUQ7QUFFdkQsK0NBQWlHO0FBVWpHO0lBMEJFLHdCQUFvQixZQUEwQixFQUMxQixnQkFBa0M7UUFEbEMsaUJBQVksR0FBWixZQUFZLENBQWM7UUFDMUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUo5QyxzQkFBaUIsR0FBa0IsRUFBRSxDQUFDO1FBTTVDLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztRQUV4QixJQUFJLGNBQWMsR0FBRyxJQUFJLGdCQUFTLENBQUM7WUFDakMsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxDQUFDO1lBQ1AsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxDQUFDO1NBQ1IsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGtCQUFXLENBQUM7WUFDMUIsQ0FBQyxFQUFFLGNBQWM7WUFDakIsSUFBSSxFQUFFLENBQUM7WUFDUCxNQUFNLEVBQUUsQ0FBQztZQUNULE1BQU0sRUFBRSxDQUFDO1lBQ1QsTUFBTSxFQUFFLEdBQUc7U0FDWixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxFQUFF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Q0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLEdBQUc7WUFDVCxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNSLEtBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztnQkFDaEMsS0FBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO2dCQUU3QixNQUFNLENBQUMsS0FBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDckYsTUFBTSxDQUFDLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFDLFlBQVksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFuQixDQUFtQixDQUFDLENBQUM7WUFDdkMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXhSVSxjQUFjO1FBTjFCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLGlCQUFpQjtZQUMzQixXQUFXLEVBQUUsbUJBQW1CO1lBQ2hDLFNBQVMsRUFBRSxDQUFDLGtCQUFrQixDQUFDO1NBQ2hDLENBQUM7eUNBMkJrQyxtQkFBWTtZQUNSLHlCQUFnQjtPQTNCM0MsY0FBYyxDQTBSMUI7SUFBRCxxQkFBQztDQUFBLEFBMVJELElBMFJDO0FBMVJZLHdDQUFjIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XG5cbmltcG9ydCB7IFVzZXJQcm92aWRlciB9IGZyb20gJy4uLy4uL3NoYXJlZC91c2VyL3VzZXInO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gJ25hdGl2ZXNjcmlwdC1hbmd1bGFyL3JvdXRlcic7XG5cbmltcG9ydCB7IFROU1BsYXllciB9IGZyb20gJ25hdGl2ZXNjcmlwdC1hdWRpbyc7XG5cbmltcG9ydCB7IGVudmlyb25tZW50IH0gZnJvbSAnLi4vLi4vY29uZmlnL2Vudmlyb25tZW50JztcbmltcG9ydCB7IHNvdW5kX2NvbmZpZyB9IGZyb20gJy4vZXhwZXJpbWVudC1jb25maWcnO1xuaW1wb3J0IHsgUGFyYW1HcmlkLCBHcmlkVHJhY2tlciwgVHJpYWxBbnN3ZXIsIEdyaWRUcmFja2luZ1N0YXR1cyB9IGZyb20gJy4uLy4uL3NoYXJlZC9ncmlkL2dyaWQnO1xuXG5kZWNsYXJlIHZhciBOU1VSTDtcblxuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAncGFnZS1leHBlcmltZW50JyxcbiAgdGVtcGxhdGVVcmw6ICcuL2V4cGVyaW1lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL2V4cGVyaW1lbnQuY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgRXhwZXJpbWVudFBhZ2Uge1xuXG4gIHByaXZhdGUgdm9sdW1lOiBudW1iZXI7XG4gIHByaXZhdGUgdHJpYWxOdW1iZXI6IG51bWJlcjtcbiAgcHJpdmF0ZSB1aWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBhdWRpb1BhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSB2b2x1bWVJY29uOiBzdHJpbmc7XG4gIHByaXZhdGUgbl9hbHRlcm5hdGl2ZXM6IG51bWJlcjtcbiAgcHJpdmF0ZSBwbGF5ZXJzOiBBcnJheTxUTlNQbGF5ZXI+O1xuICBwcml2YXRlIElTSV9tczogbnVtYmVyO1xuXG4gIHByaXZhdGUgc291bmRfaWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBpc0NvcnJlY3Q6IGJvb2xlYW47XG4gIHByaXZhdGUgdGFyZ2V0X2lkeDogbnVtYmVyO1xuXG4gIHByaXZhdGUgcGxheUJ1dHRvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBpbnN0cnVjdGlvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBoaWdobGlnaHRlZEJ1dHRvbjogbnVtYmVyO1xuICBwcml2YXRlIGVuYWJsZVBsYXk6IGJvb2xlYW47XG4gIHByaXZhdGUgZW5hYmxlQW5zd2VyOiBib29sZWFuO1xuICBwcml2YXRlIGFuc3dlcmVkOiBib29sZWFuO1xuXG4gIHByaXZhdGUgbG9nRmlsZVBhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSBleHBlcmltZW50TG9nVGV4dDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBwcml2YXRlIGdyaWQ6IEdyaWRUcmFja2VyO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdXNlclByb3ZpZGVyOiBVc2VyUHJvdmlkZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgcm91dGVyRXh0ZW5zaW9uczogUm91dGVyRXh0ZW5zaW9ucykge1xuXG4gICAgLy8gMkFGQyAtLT4gdHdvIHBsYXllcnNcbiAgICB0aGlzLm5fYWx0ZXJuYXRpdmVzID0gMjtcblxuICAgIGxldCBwYXJhbWV0ZXJfZ3JpZCA9IG5ldyBQYXJhbUdyaWQoe1xuICAgICAgeG1pbjogMSxcbiAgICAgIHhtYXg6IDE4LFxuICAgICAgeHJlczogMSxcbiAgICAgIHltaW46IDEsXG4gICAgICB5bWF4OiAyNixcbiAgICAgIHlyZXM6IDFcbiAgICB9KTtcblxuICAgIHRoaXMuZ3JpZCA9IG5ldyBHcmlkVHJhY2tlcih7XG4gICAgICBnOiBwYXJhbWV0ZXJfZ3JpZCxcbiAgICAgIG1fdXA6IDEsXG4gICAgICBuX2Rvd246IDMsXG4gICAgICBuX3JldnM6IDIsXG4gICAgICBuX3N0ZXA6IDUwMFxuICAgIH0pO1xuICAgIHRoaXMuZ3JpZC5pbml0aWFsaXplKDEsIDIzKTtcblxuICAgIHRoaXMucGxheWVycyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICB0aGlzLnBsYXllcnMucHVzaChuZXcgVE5TUGxheWVyKCkpO1xuICAgIH1cbiAgICB0aGlzLklTSV9tcyA9IDIwMDtcblxuICAgIHRoaXMudm9sdW1lID0gMC43O1xuXG4gICAgbGV0IGFwcFBhdGggPSBmcy5rbm93bkZvbGRlcnMuY3VycmVudEFwcCgpO1xuICAgIHRoaXMuYXVkaW9QYXRoID0gZnMucGF0aC5qb2luKGFwcFBhdGgucGF0aCwgJ2F1ZGlvJyk7XG4gICAgY29uc29sZS5sb2codGhpcy5hdWRpb1BhdGgpO1xuXG4gICAgdGhpcy50cmlhbE51bWJlciA9IDA7XG4gICAgdGhpcy5sb2FkU291bmRzKCk7XG5cbiAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gXCJQbGF5IG5leHRcIjtcbiAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiUHJlc3MgcGxheSBidXR0b24gdG8gaGVhciB0aGUgc291bmQuXCI7XG4gICAgdGhpcy5oaWdobGlnaHRlZEJ1dHRvbiA9IC0xO1xuXG4gICAgdGhpcy5lbmFibGVQbGF5ID0gdHJ1ZTtcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgIHRoaXMuYW5zd2VyZWQgPSBmYWxzZTtcblxuICAgIHRoaXMudWlkID0gdXNlclByb3ZpZGVyLnVzZXJuYW1lO1xuXG4gICAgbGV0IGRvY3NQYXRoID0gZnMua25vd25Gb2xkZXJzLmRvY3VtZW50cygpLnBhdGg7XG4gICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgbGV0IGxvZ2ZpbGUgPSBlbnZpcm9ubWVudC5leHBlcmltZW50RmlsZVByZWZpeCArIHRoaXMudWlkICsgJy0nICsgbm93LmdldEhvdXJzKCkgKyAnLScgKyBub3cuZ2V0TWludXRlcygpICsgJy0nICsgbm93LmdldERhdGUoKSArICctJyArIG5vdy5nZXRNb250aCgpICsgJy0nICsgbm93LmdldEZ1bGxZZWFyKCkgKyAnLmxvZyc7XG4gICAgdGhpcy5sb2dGaWxlUGF0aCA9IGZzLnBhdGguam9pbihkb2NzUGF0aCwgbG9nZmlsZSk7XG4gICAgY29uc29sZS5sb2coJ0xvZ2dpbmcgdG8gJyArIGxvZ2ZpbGUpO1xuICAgIHRoaXMud3JpdGVMb2coJ0V4cGVyaW1lbnQgc3RhcnRlZCwgc3ViamVjdCAnICsgdGhpcy51aWQpO1xuICAgIHRoaXMud3JpdGVMb2coJ3RyaWFsOyBzb3VuZGZpbGU7IGFuc3dlcjsgY29ycmVjdCcpO1xuICB9XG5cbiAgZXZhbHVhdGVBbnN3ZXIoYW5zd2VyKSB7XG4gICAgdGhpcy5lbmFibGVBbnN3ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmFuc3dlcmVkID0gdHJ1ZTtcbiAgICB0aGlzLmVuYWJsZVBsYXkgPSB0cnVlO1xuICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnUGxheSBuZXh0JztcblxuICAgIHRoaXMuaXNDb3JyZWN0ID0gKGFuc3dlciA9PSB0aGlzLnRhcmdldF9pZHgpO1xuICAgIGlmICh0aGlzLmlzQ29ycmVjdCkge1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnQ29ycmVjdCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ1dyb25nJztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy53cml0ZUxvZygnJyArIHRoaXMudHJpYWxOdW1iZXIgKyAnOycgKyB0aGlzLnNvdW5kX2lkICsgJzsnICsgYW5zd2VyICsgJzsnICsgdGhpcy5pc0NvcnJlY3QpLnRoZW4oKCkgPT4ge1xuICAgICAgbGV0IGFucyA9IHRoaXMuaXNDb3JyZWN0ID8gVHJpYWxBbnN3ZXIuQ29ycmVjdCA6IFRyaWFsQW5zd2VyLldyb25nO1xuICAgICAgdGhpcy5ncmlkLnVwZGF0ZVBvc2l0aW9uKGFucyk7IC8vIG1pZ2h0IHRocm93IGVycm9yIGlmIHNvbWV0aGluZyBnb2VzIHdyb25nLCBjYXRjaGVkIGxhdGVyXG5cbiAgICAgIGlmICh0aGlzLmdyaWQuZ2V0U3RhdHVzKCkuZmluaXNoZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coSlNPTi5zdHJpbmdpZnkodGhpcy5ncmlkLmdldEhpc3RvcnkoKSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoRXhwZXJpbWVudCgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgbGV0IFt4cGFyYW0sIHlwYXJhbV0gPSB0aGlzLmdyaWQuZ2V0Q3VycmVudEdyaWRQYXJhbWV0ZXJzKCk7XG4gICAgICByZXR1cm4gdGhpcy5sb2FkU291bmRzKCk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuICB9XG5cbiAgbG9hZFNvdW5kcygpIHtcbiAgICBsZXQgcHJvbWlzZXMgPSBbXTtcbiAgICB0aGlzLnRhcmdldF9pZHggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLm5fYWx0ZXJuYXRpdmVzKTtcbiAgICBsZXQgW21hc2tfaSwgdGFyZ19pXSA9IHRoaXMuZ3JpZC5nZXRDdXJyZW50R3JpZFBhcmFtZXRlcnMoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlcyAtIDE7IGkrKykge1xuICAgICAgbGV0IHN0aW1faWQgPSAnJztcbiAgICAgIGlmIChpID09IHRoaXMudGFyZ2V0X2lkeCkge1xuICAgICAgICBzdGltX2lkID0gJ2YxMDAwX2xldmVsJyArIHRhcmdfaSArICdfZ2FwJyArIG1hc2tfaSArICcud2F2JztcbiAgICAgICAgdGhpcy5zb3VuZF9pZCA9IHN0aW1faWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGltX2lkID0gJ2YxMDAwX2dhcCcgKyBtYXNrX2kgKyAnLndhdic7XG4gICAgICB9XG4gICAgICBsZXQgc291bmRwYXRoID0gZnMucGF0aC5qb2luKHRoaXMuYXVkaW9QYXRoLCBzdGltX2lkKTtcbiAgICAgIGlmICghZnMuRmlsZS5leGlzdHMoc291bmRwYXRoKSkge1xuICAgICAgICBwcm9taXNlcy5wdXNoKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdCgnU291bmQgZmlsZSAnICsgc3RpbV9pZCArICcgZG9lcyBub3QgZXhpc3QhJykpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy5wbGF5ZXJzW2ldLmluaXRGcm9tRmlsZSh7XG4gICAgICAgICAgYXVkaW9GaWxlOiBzb3VuZHBhdGgsXG4gICAgICAgICAgbG9vcDogZmFsc2UsXG4gICAgICAgICAgY29tcGxldGVDYWxsYmFjazogYXJncyA9PiB7XG4gICAgICAgICAgICAvLyBub3RlOiBwYXNzaW5nIHRoZSBjdXJyZW50IHZhbHVlIG9mIGxvb3AgdmFyaWFibGUgaSB0byB0aGUgY2FsbGJhY2sgaXMgb25seVxuICAgICAgICAgICAgLy8gcG9zc2libGUgd2hlbiB1c2luZyAnbGV0JyBpbiB0aGUgbG9vcCBpbml0aWFsaXphdGlvbi4ga2V5d29yZHM6IFwiamF2YXNjcmlwdCBjbG9zdXJlXCJcbiAgICAgICAgICAgIHRoaXMuc291bmRFbmRlZChpKTtcbiAgICAgICAgICAgIGlmIChpIDwgdGhpcy5uX2FsdGVybmF0aXZlcyAtIDEpIHtcbiAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnN0YXJ0U291bmQoaSsxKSwgdGhpcy5JU0lfbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy50cmlhbEVuZGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBlcnJvckNhbGxiYWNrOiBlcnJvciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShlcnJvcikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiByZWplY3QoZXJyLmV4dHJhKSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgfVxuXG4gIGlzUGxheWluZygpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXM7IGkrKykge1xuICAgICAgaWYgKHRoaXMucGxheWVyc1tpXS5pc0F1ZGlvUGxheWluZygpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwbGF5VHJpYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhcnRTb3VuZCgwKS50aGVuKFxuICAgICAgKCkgPT4ge1xuICAgICAgICB0aGlzLnRyaWFsTnVtYmVyICs9IDE7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gXCJXaGljaCBzb3VuZCBoYXMgdGhlIHRhcmdldD9cIjtcbiAgICAgICAgdGhpcy5lbmFibGVQbGF5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYW5zd2VyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdMaXN0ZW4nO1xuICAgICAgfSxcbiAgICAgIGVyciA9PiB0aGlzLnNob3dFcnJvcignY291bGQgbm90IHN0YXJ0IHNvdW5kOiAnICsgZXJyKVxuICAgICk7XG4gIH1cblxuICBzdGFydFNvdW5kKHBsYXllcl9pZHgpIHtcbiAgICBpZiAodGhpcy5pc1BsYXlpbmcoKSkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdCgncGxheWluZycpKTtcbiAgICB9XG4gICAgdGhpcy5oaWdobGlnaHRlZEJ1dHRvbiA9IHBsYXllcl9pZHg7XG4gICAgdGhpcy5wbGF5ZXJzW3BsYXllcl9pZHhdLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICAgIHJldHVybiB0aGlzLnBsYXllcnNbcGxheWVyX2lkeF0ucGxheSgpO1xuICB9XG5cbiAgc291bmRFbmRlZChwbGF5ZXJfaWR4KSB7XG4gICAgdGhpcy5oaWdobGlnaHRlZEJ1dHRvbiA9IC0xO1xuICB9XG5cbiAgdHJpYWxFbmRlZCgpIHtcbiAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdDbGljayBvbiB0aGUgc291bmQgdGhhdCBoYWQgdGhlIHRhcmdldCc7XG4gICAgdGhpcy5lbmFibGVBbnN3ZXIgPSB0cnVlO1xuICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnV2FpdGluZyBmb3IgYW5zd2VyJztcbiAgfVxuXG4gIHdyaXRlTG9nKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHRoaXMuZXhwZXJpbWVudExvZ1RleHQucHVzaChtZXNzYWdlKTtcblxuICAgIGxldCBmaWxlSGFuZGxlID0gZnMuRmlsZS5mcm9tUGF0aCh0aGlzLmxvZ0ZpbGVQYXRoKTtcbiAgICBsZXQgbG9nc3RyaW5nID0gJyc7XG4gICAgZm9yIChsZXQgcm93IG9mIHRoaXMuZXhwZXJpbWVudExvZ1RleHQpIHtcbiAgICAgIGxvZ3N0cmluZyA9IGxvZ3N0cmluZy5jb25jYXQocm93ICsgJ1xcbicpO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZUhhbmRsZS53cml0ZVRleHQobG9nc3RyaW5nKS5jYXRjaChlcnIgPT4ge1xuICAgICAgdGhpcy5zaG93RXJyb3IoZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHZvbHVtZURvd24oKSB7XG4gIC8vICAgaWYgKHRoaXMudm9sdW1lID4gMC4xKSB7XG4gIC8vICAgICB0aGlzLnZvbHVtZSAtPSAwLjE7XG4gIC8vICAgfVxuICAvLyAgIHRoaXMudXBkYXRlVm9sdW1lSWNvbigpO1xuICAvLyAgIHRoaXMucGxheWVyLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICAvLyB9XG4gIC8vXG4gIC8vIHZvbHVtZVVwKCkge1xuICAvLyAgIGlmICh0aGlzLnZvbHVtZSA8PSAwLjkpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lICs9IDAuMTtcbiAgLy8gICB9XG4gIC8vICAgdGhpcy51cGRhdGVWb2x1bWVJY29uKCk7XG4gIC8vICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gIHRoaXMudm9sdW1lO1xuICAvLyB9XG5cbiAgLy8gdXBkYXRlVm9sdW1lSWNvbigpIHtcbiAgLy8gICBpZiAodGhpcy52b2x1bWUgPD0gMC4yKSB7XG4gIC8vICAgICB0aGlzLnZvbHVtZUljb24gPSAndm9sdW1lLW11dGUnO1xuICAvLyAgIH0gZWxzZSBpZiAodGhpcy52b2x1bWUgPD0gMC42KSB7XG4gIC8vICAgICB0aGlzLnZvbHVtZUljb24gPSAndm9sdW1lLWRvd24nO1xuICAvLyAgIH0gZWxzZSB7XG4gIC8vICAgICB0aGlzLnZvbHVtZUljb24gPSAndm9sdW1lLXVwJztcbiAgLy8gICB9XG4gIC8vIH1cblxuICBzaG93SW5zdHJ1Y3Rpb25zKCkge1xuXG4gIH1cblxuICBzaG93RXJyb3IoZXJyKSB7XG4gICAgZGlhbG9ncy5hbGVydCh7XG4gICAgICB0aXRsZTogJ0Vycm9yJyxcbiAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgIG9rQnV0dG9uVGV4dDogJ0Nsb3NlJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgLy8gcGFzc1xuICAgIH0pO1xuICB9XG5cbiAgZmluaXNoRXhwZXJpbWVudCgpIHtcbiAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXhwZXJpbWVudCBjb21wbGV0ZWQnLFxuICAgICAgbWVzc2FnZTogJ1RoZSBleHBlcmltZW50IGlzIG5vdyBmaW5pc2hlZCwgdGhhbmsgeW91IGZvciBwYXJ0aWNpcGF0aW5nIScsXG4gICAgICBva0J1dHRvblRleHQ6ICdPSydcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMudXNlclByb3ZpZGVyLnVzZXJuYW1lID0gJyc7XG4gICAgICB0aGlzLnVzZXJQcm92aWRlci5hZ2UgPSBudWxsO1xuXG4gICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnL3N0YXJ0J10sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgdGhpcy5zaG93RXJyb3IoZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFib3J0RXhwZXJpbWVudCgpIHtcbiAgICBkaWFsb2dzLmNvbmZpcm0oe1xuICAgICAgdGl0bGU6ICdBYm9ydCBleHBlcmltZW50PycsXG4gICAgICBtZXNzYWdlOiAnVGhlIGV4cGVyaW1lbnQgaXMgbm90IGZpbmlzaGVkLCBhcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gYWJvcnQ/IFlvdSBjYW5ub3QgY29udGludWUgdGhlIGV4cGVyaW1lbnQgYWZ0ZXIgcXVpdHRpbmcuJyxcbiAgICAgIG9rQnV0dG9uVGV4dDogJ1F1aXQnLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dDogJ1N0YXknXG4gICAgfSkudGhlbihhbnMgPT4ge1xuICAgICAgaWYgKGFucykge1xuICAgICAgICB0aGlzLnVzZXJQcm92aWRlci51c2VybmFtZSA9ICcnO1xuICAgICAgICB0aGlzLnVzZXJQcm92aWRlci5hZ2UgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLndyaXRlTG9nKCdBYm9ydGVkIHRyaWFsLlxcbicgKyBKU09OLnN0cmluZ2lmeSh0aGlzLmdyaWQuZ2V0SGlzdG9yeSgpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJy9zdGFydCddLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59XG4iXX0=