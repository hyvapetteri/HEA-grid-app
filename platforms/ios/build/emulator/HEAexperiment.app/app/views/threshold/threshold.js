"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var router_1 = require("nativescript-angular/router");
var nativescript_audio_1 = require("nativescript-audio");
var session_1 = require("../../shared/session/session");
function db2a(db) {
    return Math.pow(10, db / 20);
}
var ThresholdPage = (function () {
    function ThresholdPage(sessionProvider, routerExtensions) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.enablePlay = false;
        this.enableAnswer = false;
        this.max_turns = 10;
        this.player = new nativescript_audio_1.TNSPlayer();
        var appPath = fs.knownFolders.currentApp();
        this.audioPath = fs.path.join(appPath.path, 'audio');
        console.log(this.audioPath);
        this.player.initFromFile({
            audioFile: fs.path.join(this.audioPath, 'f1000_ref.wav'),
            loop: true
        }).then(function () {
            _this.enablePlay = true;
        }).catch(function (err) { return _this.showError(err); });
        this.reset();
        this.instructionText = 'Press play to start';
    }
    ThresholdPage.prototype.onButtonTouch = function (args) {
        var _this = this;
        if (args.action == 'down') {
            this.turns.push(this.volume);
            this.direction = -1;
        }
        else if (args.action == 'up') {
            this.turns.push(this.volume);
            this.direction = 1;
        }
        if (this.turns.length >= this.max_turns) {
            this.player.pause().then(function () {
                clearInterval(_this.volumeUpdateTimerId);
                _this.instructionText = 'Done';
                _this.finish();
            });
        }
    };
    ThresholdPage.prototype.play = function () {
        var _this = this;
        if (this.player.isAudioPlaying()) {
            this.player.pause().then(function () {
                clearInterval(_this.volumeUpdateTimerId);
                _this.reset();
                _this.instructionText = 'Reset. Press play to start again.';
            });
        }
        else {
            this.direction = 1;
            this.player.play().then(function () {
                _this.volumeUpdateTimerId = setInterval(function () { return _this.updateVolume(); }, 100);
                _this.enableAnswer = true;
                _this.playButtonText = 'Reset';
                _this.instructionText = "When you hear a sound, press the button and keep it pressed until you can't hear it anymore. Then release and repeat.";
            });
        }
    };
    ThresholdPage.prototype.updateVolume = function () {
        this.volume = db2a(this.direction * 0.3) * this.volume;
        this.player.volume = this.volume;
    };
    ThresholdPage.prototype.reset = function () {
        this.playButtonText = 'Play';
        this.enableAnswer = false;
        this.volume = db2a(-40);
        this.player.volume = this.volume;
    };
    ThresholdPage.prototype.finish = function () {
        var avg_threshold = 0;
        var n_last_turns = 6;
        for (var i = this.turns.length; i > this.turns.length - n_last_turns; i--) {
            avg_threshold = avg_threshold + this.turns[i];
        }
        avg_threshold = avg_threshold / n_last_turns;
        this.sessionProvider.threshold = avg_threshold;
        this.routerExtensions.navigate(["/experiment"], { clearHistory: true });
    };
    ThresholdPage.prototype.showError = function (err) {
        dialogs.alert({
            title: 'Error',
            message: err,
            okButtonText: 'Close'
        }).then(function () {
            // pass
        });
    };
    ThresholdPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-threshold',
            templateUrl: './threshold.html',
            styleUrls: ['./threshold.css']
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions])
    ], ThresholdPage);
    return ThresholdPage;
}());
exports.ThresholdPage = ThresholdPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZXNob2xkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGhyZXNob2xkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQTBDO0FBQzFDLHFEQUF1RDtBQUN2RCxpREFBbUQ7QUFDbkQsc0RBQStEO0FBRS9ELHlEQUErQztBQUUvQyx3REFBK0Q7QUFJL0QsY0FBYyxFQUFTO0lBQ3JCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0IsQ0FBQztBQVFEO0lBa0JFLHVCQUFvQixlQUFnQyxFQUNoQyxnQkFBa0M7UUFEdEQsaUJBdUJDO1FBdkJtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUVwRCxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUUxQixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUVwQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksOEJBQVMsRUFBRSxDQUFDO1FBRTlCLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTVCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQ3ZCLFNBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQztZQUN4RCxJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUMsQ0FBQyxJQUFJLENBQUM7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QWlCLENBQUM7U0FDL0IsQ0FBQzt5Q0FtQnFDLHlCQUFlO1lBQ2QseUJBQWdCO09BbkIzQyxhQUFhLENBOEd6QjtJQUFELG9CQUFDO0NBQUEsQUE5R0QsSUE4R0M7QUE5R1ksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCAqIGFzIGRpYWxvZ3MgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdWkvZGlhbG9nc1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZmlsZS1zeXN0ZW1cIjtcbmltcG9ydCB7IFJvdXRlckV4dGVuc2lvbnMgfSBmcm9tIFwibmF0aXZlc2NyaXB0LWFuZ3VsYXIvcm91dGVyXCI7XG5pbXBvcnQgeyBUb3VjaEdlc3R1cmVFdmVudERhdGEgfSBmcm9tIFwidWkvZ2VzdHVyZXNcIjtcbmltcG9ydCB7IFROU1BsYXllciB9IGZyb20gJ25hdGl2ZXNjcmlwdC1hdWRpbyc7XG5cbmltcG9ydCB7IFNlc3Npb25Qcm92aWRlciB9IGZyb20gJy4uLy4uL3NoYXJlZC9zZXNzaW9uL3Nlc3Npb24nO1xuXG5kZWNsYXJlIHZhciBOU1VSTDtcblxuZnVuY3Rpb24gZGIyYShkYjpudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGgucG93KDEwLCBkYi8yMCk7XG59XG5cbkBDb21wb25lbnQoe1xuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICBzZWxlY3RvcjogJ3BhZ2UtdGhyZXNob2xkJyxcbiAgdGVtcGxhdGVVcmw6ICcuL3RocmVzaG9sZC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vdGhyZXNob2xkLmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIFRocmVzaG9sZFBhZ2Uge1xuICBwcml2YXRlIGluc3RydWN0aW9uVGV4dDogc3RyaW5nO1xuICBwcml2YXRlIGFuc3dlckJ1dHRvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBwbGF5QnV0dG9uVGV4dDogc3RyaW5nO1xuXG4gIHByaXZhdGUgZW5hYmxlUGxheTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBlbmFibGVBbnN3ZXI6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSBwbGF5ZXI6IFROU1BsYXllcjtcbiAgcHJpdmF0ZSBhdWRpb1BhdGg6IHN0cmluZztcblxuICBwcml2YXRlIHZvbHVtZTogbnVtYmVyO1xuICBwcml2YXRlIHR1cm5zOiBudW1iZXJbXTtcbiAgcHJpdmF0ZSBkaXJlY3Rpb246IG51bWJlcjtcbiAgcHJpdmF0ZSBtYXhfdHVybnM6IG51bWJlcjtcblxuICBwcml2YXRlIHZvbHVtZVVwZGF0ZVRpbWVySWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNlc3Npb25Qcm92aWRlcjogU2Vzc2lvblByb3ZpZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMpIHtcblxuICAgIHRoaXMuZW5hYmxlUGxheSA9IGZhbHNlO1xuICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG5cbiAgICB0aGlzLm1heF90dXJucyA9IDEwO1xuXG4gICAgdGhpcy5wbGF5ZXIgPSBuZXcgVE5TUGxheWVyKCk7XG5cbiAgICBsZXQgYXBwUGF0aCA9IGZzLmtub3duRm9sZGVycy5jdXJyZW50QXBwKCk7XG4gICAgdGhpcy5hdWRpb1BhdGggPSBmcy5wYXRoLmpvaW4oYXBwUGF0aC5wYXRoLCAnYXVkaW8nKTtcbiAgICBjb25zb2xlLmxvZyh0aGlzLmF1ZGlvUGF0aCk7XG5cbiAgICB0aGlzLnBsYXllci5pbml0RnJvbUZpbGUoe1xuICAgICAgYXVkaW9GaWxlOiBmcy5wYXRoLmpvaW4odGhpcy5hdWRpb1BhdGgsICdmMTAwMF9yZWYud2F2JyksXG4gICAgICBsb29wOiB0cnVlXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmVuYWJsZVBsYXkgPSB0cnVlO1xuICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcblxuICAgIHRoaXMucmVzZXQoKTtcbiAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdQcmVzcyBwbGF5IHRvIHN0YXJ0JztcbiAgfVxuXG4gIG9uQnV0dG9uVG91Y2goYXJnczogVG91Y2hHZXN0dXJlRXZlbnREYXRhKSB7XG4gICAgaWYgKGFyZ3MuYWN0aW9uID09ICdkb3duJykge1xuICAgICAgdGhpcy50dXJucy5wdXNoKHRoaXMudm9sdW1lKTtcbiAgICAgIHRoaXMuZGlyZWN0aW9uID0gLTE7XG4gICAgfSBlbHNlIGlmIChhcmdzLmFjdGlvbiA9PSAndXAnKSB7XG4gICAgICB0aGlzLnR1cm5zLnB1c2godGhpcy52b2x1bWUpO1xuICAgICAgdGhpcy5kaXJlY3Rpb24gPSAxO1xuICAgIH1cbiAgICBpZiAodGhpcy50dXJucy5sZW5ndGggPj0gdGhpcy5tYXhfdHVybnMpIHtcbiAgICAgIHRoaXMucGxheWVyLnBhdXNlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy52b2x1bWVVcGRhdGVUaW1lcklkKTtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnRG9uZSc7XG4gICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwbGF5KCkge1xuICAgIGlmICh0aGlzLnBsYXllci5pc0F1ZGlvUGxheWluZygpKSB7XG4gICAgICB0aGlzLnBsYXllci5wYXVzZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMudm9sdW1lVXBkYXRlVGltZXJJZCk7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnUmVzZXQuIFByZXNzIHBsYXkgdG8gc3RhcnQgYWdhaW4uJztcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpcmVjdGlvbiA9IDE7XG4gICAgICB0aGlzLnBsYXllci5wbGF5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMudm9sdW1lVXBkYXRlVGltZXJJZCA9IHNldEludGVydmFsKCgpID0+IHRoaXMudXBkYXRlVm9sdW1lKCksIDEwMCk7XG4gICAgICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdSZXNldCc7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gXCJXaGVuIHlvdSBoZWFyIGEgc291bmQsIHByZXNzIHRoZSBidXR0b24gYW5kIGtlZXAgaXQgcHJlc3NlZCB1bnRpbCB5b3UgY2FuJ3QgaGVhciBpdCBhbnltb3JlLiBUaGVuIHJlbGVhc2UgYW5kIHJlcGVhdC5cIjtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVZvbHVtZSgpIHtcbiAgICB0aGlzLnZvbHVtZSA9IGRiMmEodGhpcy5kaXJlY3Rpb24gKiAwLjMpICogdGhpcy52b2x1bWU7XG4gICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdGhpcy52b2x1bWU7XG4gIH1cblxuICByZXNldCgpIHtcbiAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gJ1BsYXknO1xuICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG4gICAgdGhpcy52b2x1bWUgPSBkYjJhKC00MCk7XG4gICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdGhpcy52b2x1bWU7XG4gIH1cblxuICBmaW5pc2goKSB7XG4gICAgbGV0IGF2Z190aHJlc2hvbGQgPSAwO1xuICAgIGxldCBuX2xhc3RfdHVybnMgPSA2O1xuICAgIGZvciAobGV0IGkgPSB0aGlzLnR1cm5zLmxlbmd0aDsgaSA+IHRoaXMudHVybnMubGVuZ3RoIC0gbl9sYXN0X3R1cm5zOyBpLS0pIHtcbiAgICAgIGF2Z190aHJlc2hvbGQgPSBhdmdfdGhyZXNob2xkICsgdGhpcy50dXJuc1tpXTtcbiAgICB9XG4gICAgYXZnX3RocmVzaG9sZCA9IGF2Z190aHJlc2hvbGQgLyBuX2xhc3RfdHVybnM7XG4gICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIudGhyZXNob2xkID0gYXZnX3RocmVzaG9sZDtcbiAgICB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoW1wiL2V4cGVyaW1lbnRcIl0sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgfVxuXG4gIHNob3dFcnJvcihlcnIpIHtcbiAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBwYXNzXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==