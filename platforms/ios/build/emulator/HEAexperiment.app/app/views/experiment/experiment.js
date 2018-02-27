"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var user_1 = require("../../shared/user/user");
var router_1 = require("nativescript-angular/router");
var nativescript_audio_1 = require("nativescript-audio");
var environment_1 = require("../../config/environment");
var experiment_config_1 = require("./experiment-config");
var ExperimentPage = (function () {
    function ExperimentPage(userProvider, routerExtensions) {
        this.userProvider = userProvider;
        this.routerExtensions = routerExtensions;
        this.experimentLogText = [];
        this.player = new nativescript_audio_1.TNSPlayer();
        var appPath = fs.knownFolders.currentApp();
        this.audioPath = fs.path.join(appPath.path, 'audio');
        console.log(this.audioPath);
        this.sounds = experiment_config_1.sound_config;
        for (var i = this.sounds.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [this.sounds[j], this.sounds[i]], this.sounds[i] = _a[0], this.sounds[j] = _a[1];
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
        var docsPath = fs.knownFolders.documents().path;
        var now = new Date();
        var logfile = environment_1.environment.experimentFilePrefix + this.uid + '-' + now.getHours() + '-' + now.getMinutes() + '-' + now.getDate() + '-' + now.getMonth() + '-' + now.getFullYear() + '.log';
        this.logFilePath = fs.path.join(docsPath, logfile);
        console.log('Logging to ' + logfile);
        this.writeLog('Experiment started, subject ' + this.uid);
        this.writeLog('trial; soundfile; answer; correct');
        var _a;
    }
    ExperimentPage.prototype.evaluateAnswer = function (answer) {
        var _this = this;
        this.enableAnswer = false;
        this.answered = true;
        this.enablePlay = true;
        return this.pauseSound().then(function () {
            _this.isCorrect = (answer == _this.soundCategory);
            if (_this.isCorrect) {
                _this.instructionText = 'Correct';
            }
            else {
                _this.instructionText = 'Wrong';
            }
            return _this.writeLog('' + _this.soundIndex + ';' + _this.soundId + ';' + answer + ';' + _this.isCorrect);
        }).then(function () {
            _this.soundIndex += 1;
            return _this.loadSound();
        }).catch(function (err) { return _this.showError(err); });
    };
    ExperimentPage.prototype.loadSound = function () {
        var _this = this;
        if (this.soundIndex >= this.sounds.length) {
            return this.finishExperiment();
        }
        var soundInfo = this.sounds[this.soundIndex];
        this.soundId = soundInfo.id;
        this.soundCategory = soundInfo.cat;
        var soundpath = fs.path.join(this.audioPath, this.soundId);
        if (!fs.File.exists(soundpath)) {
            this.showError('Sound file ' + this.soundId + ' does not exist!');
            return new Promise(function (resolve, reject) { return reject('File not found'); });
        }
        return this.player.initFromFile({
            audioFile: soundpath,
            loop: false,
            errorCallback: function (error) {
                console.log(JSON.stringify(error));
            }
        }).catch(function (err) {
            _this.showError(err.extra);
        });
    };
    ExperimentPage.prototype.startSound = function () {
        var _this = this;
        if (this.player.isAudioPlaying()) {
            return new Promise(function (resolve, reject) { return resolve('playing'); });
        }
        return this.player.play().then(function () {
            _this.trialNumber += 1;
            _this.instructionText = "Is this sound A or B?";
            _this.enablePlay = false;
            _this.enableAnswer = true;
            _this.answered = false;
        }, function (err) { return _this.showError('could not start sound: ' + err); });
    };
    ExperimentPage.prototype.pauseSound = function () {
        var _this = this;
        if (!this.player.isAudioPlaying()) {
            return new Promise(function (resolve, reject) { return resolve('paused'); });
        }
        return this.player.pause().then(function () {
            return _this.player.dispose();
        });
    };
    ExperimentPage.prototype.writeLog = function (message) {
        this.experimentLogText.push(message);
        var fileHandle = fs.File.fromPath(this.logFilePath);
        var logstring = '';
        for (var _i = 0, _a = this.experimentLogText; _i < _a.length; _i++) {
            var row = _a[_i];
            logstring.concat(row + '\n');
        }
        return fileHandle.writeText(logstring);
    };
    ExperimentPage.prototype.volumeDown = function () {
        if (this.volume > 0.1) {
            this.volume -= 0.1;
        }
        this.updateVolumeIcon();
        this.player.volume = this.volume;
    };
    ExperimentPage.prototype.volumeUp = function () {
        if (this.volume <= 0.9) {
            this.volume += 0.1;
        }
        this.updateVolumeIcon();
        this.player.volume = this.volume;
    };
    ExperimentPage.prototype.updateVolumeIcon = function () {
        if (this.volume <= 0.2) {
            this.volumeIcon = 'volume-mute';
        }
        else if (this.volume <= 0.6) {
            this.volumeIcon = 'volume-down';
        }
        else {
            this.volumeIcon = 'volume-up';
        }
    };
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
            cancelButtonText: 'Continue'
        }).then(function (ans) {
            if (ans) {
                _this.userProvider.username = '';
                _this.userProvider.age = null;
                return _this.routerExtensions.navigate(['/start'], { clearHistory: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4cGVyaW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMEM7QUFDMUMscURBQXVEO0FBQ3ZELGlEQUFtRDtBQUVuRCwrQ0FBc0Q7QUFDdEQsc0RBQStEO0FBRS9ELHlEQUErQztBQUUvQyx3REFBdUQ7QUFDdkQseURBQW1EO0FBVW5EO0lBd0JFLHdCQUFvQixZQUEwQixFQUMxQixnQkFBa0M7UUFEbEMsaUJBQVksR0FBWixZQUFZLENBQWM7UUFDMUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUg5QyxzQkFBaUIsR0FBa0IsRUFBRSxDQUFDO1FBSzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSw4QkFBUyxFQUFFLENBQUM7UUFDOUIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQ0FBWSxDQUFDO1FBRTNCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDaEQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxxQ0FBbUUsRUFBbEUsc0JBQWMsRUFBRSxzQkFBYyxDQUFxQztRQUN0RSxDQUFDO1FBRUQsSUFBSSxDQUFD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QUMsR0FBRyxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsd0NBQWUsR0FBZjtRQUFBLGlCQWNDO1FBYkMsT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNkLEtBQUssRUFBRSxtQkFBbUI7WUFDMUIsT0FBTyxFQUFFLG9IQUFvSDtZQUM3SCxZQUFZLEVBQUUsTUFBTTtZQUNwQixnQkFBZ0IsRUFBRSxVQUFVO1NBQzdCLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHO1lBQ1QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDUixLQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ2hDLEtBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztnQkFFN0IsTUFBTSxDQUFDLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFDLFlBQVksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFuTlUsY0FBYztRQU4xQixnQkFBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25CLFFBQVEsRUFBRSxpQkFBaUI7WUFDM0IsV0FBVyxFQUFFLG1CQUFtQjtZQUNoQyxTQUFTLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQztTQUNoQyxDQUFDO3lDQXlCa0MsbUJBQVk7WUFDUix5QkFBZ0I7T0F6QjNDLGNBQWMsQ0FxTjFCO0lBQUQscUJBQUM7Q0FBQSxBQXJORCxJQXFOQztBQXJOWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuXG5pbXBvcnQgeyBVc2VyUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zaGFyZWQvdXNlci91c2VyJztcbmltcG9ydCB7IFJvdXRlckV4dGVuc2lvbnMgfSBmcm9tICduYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXInO1xuXG5pbXBvcnQgeyBUTlNQbGF5ZXIgfSBmcm9tICduYXRpdmVzY3JpcHQtYXVkaW8nO1xuXG5pbXBvcnQgeyBlbnZpcm9ubWVudCB9IGZyb20gJy4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudCc7XG5pbXBvcnQgeyBzb3VuZF9jb25maWcgfSBmcm9tICcuL2V4cGVyaW1lbnQtY29uZmlnJztcblxuZGVjbGFyZSB2YXIgTlNVUkw7XG5cbkBDb21wb25lbnQoe1xuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICBzZWxlY3RvcjogJ3BhZ2UtZXhwZXJpbWVudCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9leHBlcmltZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9leHBlcmltZW50LmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIEV4cGVyaW1lbnRQYWdlIHtcblxuICBwcml2YXRlIHZvbHVtZTogbnVtYmVyO1xuICBwcml2YXRlIHNvdW5kSW5kZXg6IG51bWJlcjtcbiAgcHJpdmF0ZSB0cmlhbE51bWJlcjogbnVtYmVyO1xuICBwcml2YXRlIHNvdW5kSWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBzb3VuZENhdGVnb3J5OiBzdHJpbmc7XG4gIHByaXZhdGUgdWlkOiBzdHJpbmc7XG4gIHByaXZhdGUgYXVkaW9QYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgdm9sdW1lSWNvbjogc3RyaW5nO1xuICBwcml2YXRlIHBsYXllcjogVE5TUGxheWVyO1xuICBwcml2YXRlIHNvdW5kczogQXJyYXk8YW55PjtcblxuICBwcml2YXRlIGlzQ29ycmVjdDogYm9vbGVhbjtcblxuICBwcml2YXRlIHBsYXlCdXR0b25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgaW5zdHJ1Y3Rpb25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgZW5hYmxlUGxheTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBlbmFibGVBbnN3ZXI6IGJvb2xlYW47XG4gIHByaXZhdGUgYW5zd2VyZWQ6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSBsb2dGaWxlUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIGV4cGVyaW1lbnRMb2dUZXh0OiBBcnJheTxzdHJpbmc+ID0gW107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB1c2VyUHJvdmlkZXI6IFVzZXJQcm92aWRlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zKSB7XG5cbiAgICB0aGlzLnBsYXllciA9IG5ldyBUTlNQbGF5ZXIoKTtcbiAgICBsZXQgYXBwUGF0aCA9IGZzLmtub3duRm9sZGVycy5jdXJyZW50QXBwKCk7XG4gICAgdGhpcy5hdWRpb1BhdGggPSBmcy5wYXRoLmpvaW4oYXBwUGF0aC5wYXRoLCAnYXVkaW8nKTtcbiAgICBjb25zb2xlLmxvZyh0aGlzLmF1ZGlvUGF0aCk7XG5cbiAgICB0aGlzLnNvdW5kcyA9IHNvdW5kX2NvbmZpZztcblxuICAgIGZvciAobGV0IGkgPSB0aGlzLnNvdW5kcy5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICBsZXQgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgW3RoaXMuc291bmRzW2ldLCB0aGlzLnNvdW5kc1tqXV0gPSBbdGhpcy5zb3VuZHNbal0sIHRoaXMuc291bmRzW2ldXTtcbiAgICB9XG5cbiAgICB0aGlzLnNvdW5kSW5kZXggPSAwO1xuICAgIHRoaXMudHJpYWxOdW1iZXIgPSAwO1xuICAgIHRoaXMubG9hZFNvdW5kKCk7XG5cbiAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gXCJQbGF5IG5leHRcIjtcbiAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiUHJlc3MgcGxheSBidXR0b24gdG8gaGVhciB0aGUgc291bmQuXCI7XG5cbiAgICB0aGlzLmVuYWJsZVBsYXkgPSB0cnVlO1xuICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG4gICAgdGhpcy5hbnN3ZXJlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy51aWQgPSB1c2VyUHJvdmlkZXIudXNlcm5hbWU7XG5cbiAgICBsZXQgZG9jc1BhdGggPSBmcy5rbm93bkZvbGRlcnMuZG9jdW1lbnRzKCkucGF0aDtcbiAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICBsZXQgbG9nZmlsZSA9IGVudmlyb25tZW50LmV4cGVyaW1lbnRGaWxlUHJlZml4ICsgdGhpcy51aWQgKyAnLScgKyBub3cuZ2V0SG91cnMoKSArICctJyArIG5vdy5nZXRNaW51dGVzKCkgKyAnLScgKyBub3cuZ2V0RGF0ZSgpICsgJy0nICsgbm93LmdldE1vbnRoKCkgKyAnLScgKyBub3cuZ2V0RnVsbFllYXIoKSArICcubG9nJztcbiAgICB0aGlzLmxvZ0ZpbGVQYXRoID0gZnMucGF0aC5qb2luKGRvY3NQYXRoLCBsb2dmaWxlKTtcbiAgICBjb25zb2xlLmxvZygnTG9nZ2luZyB0byAnICsgbG9nZmlsZSk7XG4gICAgdGhpcy53cml0ZUxvZygnRXhwZXJpbWVudCBzdGFydGVkLCBzdWJqZWN0ICcgKyB0aGlzLnVpZCk7XG4gICAgdGhpcy53cml0ZUxvZygndHJpYWw7IHNvdW5kZmlsZTsgYW5zd2VyOyBjb3JyZWN0Jyk7XG4gIH1cblxuICBldmFsdWF0ZUFuc3dlcihhbnN3ZXIpIHtcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgIHRoaXMuYW5zd2VyZWQgPSB0cnVlO1xuICAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG5cbiAgICByZXR1cm4gdGhpcy5wYXVzZVNvdW5kKCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmlzQ29ycmVjdCA9IChhbnN3ZXIgPT0gdGhpcy5zb3VuZENhdGVnb3J5KTtcbiAgICAgIGlmICh0aGlzLmlzQ29ycmVjdCkge1xuICAgICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdDb3JyZWN0JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ1dyb25nJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coJycgKyB0aGlzLnNvdW5kSW5kZXggKyAnOycgKyB0aGlzLnNvdW5kSWQgKyAnOycgKyBhbnN3ZXIgKyAnOycgKyB0aGlzLmlzQ29ycmVjdCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLnNvdW5kSW5kZXggKz0gMTtcbiAgICAgIHJldHVybiB0aGlzLmxvYWRTb3VuZCgpO1xuICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgfVxuXG4gIGxvYWRTb3VuZCgpIHtcbiAgICBpZiAodGhpcy5zb3VuZEluZGV4ID49IHRoaXMuc291bmRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuZmluaXNoRXhwZXJpbWVudCgpO1xuICAgIH1cbiAgICBsZXQgc291bmRJbmZvID0gdGhpcy5zb3VuZHNbdGhpcy5zb3VuZEluZGV4XTtcbiAgICB0aGlzLnNvdW5kSWQgPSBzb3VuZEluZm8uaWQ7XG4gICAgdGhpcy5zb3VuZENhdGVnb3J5ID0gc291bmRJbmZvLmNhdDtcblxuICAgIGxldCBzb3VuZHBhdGggPSBmcy5wYXRoLmpvaW4odGhpcy5hdWRpb1BhdGgsIHRoaXMuc291bmRJZCk7XG4gICAgaWYgKCFmcy5GaWxlLmV4aXN0cyhzb3VuZHBhdGgpKSB7XG4gICAgICB0aGlzLnNob3dFcnJvcignU291bmQgZmlsZSAnICsgdGhpcy5zb3VuZElkICsgJyBkb2VzIG5vdCBleGlzdCEnKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QoJ0ZpbGUgbm90IGZvdW5kJykpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5wbGF5ZXIuaW5pdEZyb21GaWxlKHtcbiAgICAgIGF1ZGlvRmlsZTogc291bmRwYXRoLFxuICAgICAgbG9vcDogZmFsc2UsXG4gICAgICBlcnJvckNhbGxiYWNrOiBlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG4gICAgICB9XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRoaXMuc2hvd0Vycm9yKGVyci5leHRyYSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGFydFNvdW5kKCkge1xuICAgIGlmICh0aGlzLnBsYXllci5pc0F1ZGlvUGxheWluZygpKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gcmVzb2x2ZSgncGxheWluZycpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucGxheWVyLnBsYXkoKS50aGVuKFxuICAgICAgKCkgPT4ge1xuICAgICAgICB0aGlzLnRyaWFsTnVtYmVyICs9IDE7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gXCJJcyB0aGlzIHNvdW5kIEEgb3IgQj9cIjtcbiAgICAgICAgdGhpcy5lbmFibGVQbGF5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5hbnN3ZXJlZCA9IGZhbHNlO1xuICAgICAgfSxcbiAgICAgIGVyciA9PiB0aGlzLnNob3dFcnJvcignY291bGQgbm90IHN0YXJ0IHNvdW5kOiAnICsgZXJyKVxuICAgICk7XG4gIH1cblxuICBwYXVzZVNvdW5kKCkge1xuICAgIGlmICghdGhpcy5wbGF5ZXIuaXNBdWRpb1BsYXlpbmcoKSkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHJlc29sdmUoJ3BhdXNlZCcpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucGxheWVyLnBhdXNlKCkudGhlbihcbiAgICAgICgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxheWVyLmRpc3Bvc2UoKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgd3JpdGVMb2cobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgdGhpcy5leHBlcmltZW50TG9nVGV4dC5wdXNoKG1lc3NhZ2UpO1xuICAgIGxldCBmaWxlSGFuZGxlID0gZnMuRmlsZS5mcm9tUGF0aCh0aGlzLmxvZ0ZpbGVQYXRoKTtcbiAgICBsZXQgbG9nc3RyaW5nID0gJyc7XG4gICAgZm9yIChsZXQgcm93IG9mIHRoaXMuZXhwZXJpbWVudExvZ1RleHQpIHtcbiAgICAgIGxvZ3N0cmluZy5jb25jYXQocm93ICsgJ1xcbicpO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZUhhbmRsZS53cml0ZVRleHQobG9nc3RyaW5nKTtcbiAgfVxuXG4gIHZvbHVtZURvd24oKSB7XG4gICAgaWYgKHRoaXMudm9sdW1lID4gMC4xKSB7XG4gICAgICB0aGlzLnZvbHVtZSAtPSAwLjE7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlVm9sdW1lSWNvbigpO1xuICAgIHRoaXMucGxheWVyLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICB9XG5cbiAgdm9sdW1lVXAoKSB7XG4gICAgaWYgKHRoaXMudm9sdW1lIDw9IDAuOSkge1xuICAgICAgdGhpcy52b2x1bWUgKz0gMC4xO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZVZvbHVtZUljb24oKTtcbiAgICB0aGlzLnBsYXllci52b2x1bWUgPSAgdGhpcy52b2x1bWU7XG4gIH1cblxuICB1cGRhdGVWb2x1bWVJY29uKCkge1xuICAgIGlmICh0aGlzLnZvbHVtZSA8PSAwLjIpIHtcbiAgICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtbXV0ZSc7XG4gICAgfSBlbHNlIGlmICh0aGlzLnZvbHVtZSA8PSAwLjYpIHtcbiAgICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtZG93bic7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtdXAnO1xuICAgIH1cbiAgfVxuXG4gIHNob3dJbnN0cnVjdGlvbnMoKSB7XG5cbiAgfVxuXG4gIHNob3dFcnJvcihlcnIpIHtcbiAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBwYXNzXG4gICAgfSk7XG4gIH1cblxuICBmaW5pc2hFeHBlcmltZW50KCkge1xuICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgdGl0bGU6ICdFeHBlcmltZW50IGNvbXBsZXRlZCcsXG4gICAgICBtZXNzYWdlOiAnVGhlIGV4cGVyaW1lbnQgaXMgbm93IGZpbmlzaGVkLCB0aGFuayB5b3UgZm9yIHBhcnRpY2lwYXRpbmchJyxcbiAgICAgIG9rQnV0dG9uVGV4dDogJ09LJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy51c2VyUHJvdmlkZXIudXNlcm5hbWUgPSAnJztcbiAgICAgIHRoaXMudXNlclByb3ZpZGVyLmFnZSA9IG51bGw7XG5cbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoWycvc3RhcnQnXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLnNob3dFcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgYWJvcnRFeHBlcmltZW50KCkge1xuICAgIGRpYWxvZ3MuY29uZmlybSh7XG4gICAgICB0aXRsZTogJ0Fib3J0IGV4cGVyaW1lbnQ/JyxcbiAgICAgIG1lc3NhZ2U6ICdUaGUgZXhwZXJpbWVudCBpcyBub3QgZmluaXNoZWQsIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBhYm9ydD8gWW91IGNhbm5vdCBjb250aW51ZSB0aGUgZXhwZXJpbWVudCBhZnRlciBxdWl0dGluZy4nLFxuICAgICAgb2tCdXR0b25UZXh0OiAnUXVpdCcsXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiAnQ29udGludWUnXG4gICAgfSkudGhlbihhbnMgPT4ge1xuICAgICAgaWYgKGFucykge1xuICAgICAgICB0aGlzLnVzZXJQcm92aWRlci51c2VybmFtZSA9ICcnO1xuICAgICAgICB0aGlzLnVzZXJQcm92aWRlci5hZ2UgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoWycvc3RhcnQnXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgICAgfVxuICAgIH0pXG4gIH1cblxufVxuIl19