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
        this.answerButtonPressed = false;
        this.turns = [];
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
        this.answerButtonText = 'Push';
    }
    ThresholdPage.prototype.onButtonTouch = function (args) {
        var _this = this;
        if (args.action == 'down') {
            this.answerButtonPressed = true;
            this.turns.push(this.volume);
            this.direction = -1;
            this.answerButtonText = 'Hold';
        }
        else if (args.action == 'up') {
            this.answerButtonPressed = false;
            this.turns.push(this.volume);
            this.direction = 1;
            this.answerButtonText = 'Push';
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
        this.turns = [];
    };
    ThresholdPage.prototype.finish = function () {
        var avg_threshold = 0;
        var n_last_turns = 6;
        for (var i = this.turns.length - 1; i >= this.turns.length - n_last_turns; i--) {
            avg_threshold = avg_threshold + this.turns[i];
        }
        console.log('sum: ' + avg_threshold + ', n: ' + n_last_turns);
        avg_threshold = avg_threshold / n_last_turns;
        this.sessionProvider.threshold = avg_threshold;
        console.log('Turns: ' + JSON.stringify(this.turns));
        console.log('Threshold: ' + avg_threshold);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZXNob2xkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGhyZXNob2xkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQTBDO0FBQzFDLHFEQUF1RDtBQUN2RCxpREFBbUQ7QUFDbkQsc0RBQStEO0FBRS9ELHlEQUErQztBQUUvQyx3REFBK0Q7QUFJL0QsY0FBYyxFQUFTO0lBQ3JCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0IsQ0FBQztBQVFEO0lBbUJFLHVCQUFvQixlQUFnQyxFQUNoQyxnQkFBa0M7UUFEdEQsaUJBMEJDO1FBMUJtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUVwRCxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUMxQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1FBRWpDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBRXBCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSw4QkFBUyxFQUFFLENBQUM7UUFFOUIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7WUFDdkIsU0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElB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U0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUMsWUFBWSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELGlDQUFTLEdBQVQsVUFBVSxHQUFHO1FBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUNaLEtBQUssRUFBRSxPQUFPO1lBQ2QsT0FBTyxFQUFFLEdBQUc7WUFDWixZQUFZLEVBQUUsT0FBTztTQUN0QixDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sT0FBTztRQUNULENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXpIVSxhQUFhO1FBTnpCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLGdCQUFnQjtZQUMxQixXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLFNBQVMsRUFBRSxDQUFDLGlCQUFpQixDQUFDO1NBQy9CLENBQUM7eUNBb0JxQyx5QkFBZTtZQUNkLHlCQUFnQjtPQXBCM0MsYUFBYSxDQTBIekI7SUFBRCxvQkFBQztDQUFBLEFBMUhELElBMEhDO0FBMUhZLHNDQUFhIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XG5pbXBvcnQgeyBSb3V0ZXJFeHRlbnNpb25zIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL3JvdXRlclwiO1xuaW1wb3J0IHsgVG91Y2hHZXN0dXJlRXZlbnREYXRhIH0gZnJvbSBcInVpL2dlc3R1cmVzXCI7XG5pbXBvcnQgeyBUTlNQbGF5ZXIgfSBmcm9tICduYXRpdmVzY3JpcHQtYXVkaW8nO1xuXG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zaGFyZWQvc2Vzc2lvbi9zZXNzaW9uJztcblxuZGVjbGFyZSB2YXIgTlNVUkw7XG5cbmZ1bmN0aW9uIGRiMmEoZGI6bnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLnBvdygxMCwgZGIvMjApO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgc2VsZWN0b3I6ICdwYWdlLXRocmVzaG9sZCcsXG4gIHRlbXBsYXRlVXJsOiAnLi90aHJlc2hvbGQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL3RocmVzaG9sZC5jc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBUaHJlc2hvbGRQYWdlIHtcbiAgcHJpdmF0ZSBpbnN0cnVjdGlvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBhbnN3ZXJCdXR0b25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgcGxheUJ1dHRvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBhbnN3ZXJCdXR0b25QcmVzc2VkOiBib29sZWFuO1xuXG4gIHByaXZhdGUgZW5hYmxlUGxheTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBlbmFibGVBbnN3ZXI6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSBwbGF5ZXI6IFROU1BsYXllcjtcbiAgcHJpdmF0ZSBhdWRpb1BhdGg6IHN0cmluZztcblxuICBwcml2YXRlIHZvbHVtZTogbnVtYmVyO1xuICBwcml2YXRlIHR1cm5zOiBudW1iZXJbXTtcbiAgcHJpdmF0ZSBkaXJlY3Rpb246IG51bWJlcjtcbiAgcHJpdmF0ZSBtYXhfdHVybnM6IG51bWJlcjtcblxuICBwcml2YXRlIHZvbHVtZVVwZGF0ZVRpbWVySWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNlc3Npb25Qcm92aWRlcjogU2Vzc2lvblByb3ZpZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMpIHtcblxuICAgIHRoaXMuZW5hYmxlUGxheSA9IGZhbHNlO1xuICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG4gICAgdGhpcy5hbnN3ZXJCdXR0b25QcmVzc2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLnR1cm5zID0gW107XG4gICAgdGhpcy5tYXhfdHVybnMgPSAxMDtcblxuICAgIHRoaXMucGxheWVyID0gbmV3IFROU1BsYXllcigpO1xuXG4gICAgbGV0IGFwcFBhdGggPSBmcy5rbm93bkZvbGRlcnMuY3VycmVudEFwcCgpO1xuICAgIHRoaXMuYXVkaW9QYXRoID0gZnMucGF0aC5qb2luKGFwcFBhdGgucGF0aCwgJ2F1ZGlvJyk7XG4gICAgY29uc29sZS5sb2codGhpcy5hdWRpb1BhdGgpO1xuXG4gICAgdGhpcy5wbGF5ZXIuaW5pdEZyb21GaWxlKHtcbiAgICAgIGF1ZGlvRmlsZTogZnMucGF0aC5qb2luKHRoaXMuYXVkaW9QYXRoLCAnZjEwMDBfcmVmLndhdicpLFxuICAgICAgbG9vcDogdHJ1ZVxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5lbmFibGVQbGF5ID0gdHJ1ZTtcbiAgICB9KS5jYXRjaChlcnIgPT4gdGhpcy5zaG93RXJyb3IoZXJyKSk7XG5cbiAgICB0aGlzLnJlc2V0KCk7XG4gICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnUHJlc3MgcGxheSB0byBzdGFydCc7XG4gICAgdGhpcy5hbnN3ZXJCdXR0b25UZXh0ID0gJ1B1c2gnXG4gIH1cblxuICBvbkJ1dHRvblRvdWNoKGFyZ3M6IFRvdWNoR2VzdHVyZUV2ZW50RGF0YSkge1xuICAgIGlmIChhcmdzLmFjdGlvbiA9PSAnZG93bicpIHtcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uUHJlc3NlZCA9IHRydWU7XG4gICAgICB0aGlzLnR1cm5zLnB1c2godGhpcy52b2x1bWUpO1xuICAgICAgdGhpcy5kaXJlY3Rpb24gPSAtMTtcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uVGV4dCA9ICdIb2xkJztcbiAgICB9IGVsc2UgaWYgKGFyZ3MuYWN0aW9uID09ICd1cCcpIHtcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgdGhpcy50dXJucy5wdXNoKHRoaXMudm9sdW1lKTtcbiAgICAgIHRoaXMuZGlyZWN0aW9uID0gMTtcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uVGV4dCA9ICdQdXNoJztcbiAgICB9XG4gICAgaWYgKHRoaXMudHVybnMubGVuZ3RoID49IHRoaXMubWF4X3R1cm5zKSB7XG4gICAgICB0aGlzLnBsYXllci5wYXVzZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMudm9sdW1lVXBkYXRlVGltZXJJZCk7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ0RvbmUnO1xuICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcGxheSgpIHtcbiAgICBpZiAodGhpcy5wbGF5ZXIuaXNBdWRpb1BsYXlpbmcoKSkge1xuICAgICAgdGhpcy5wbGF5ZXIucGF1c2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnZvbHVtZVVwZGF0ZVRpbWVySWQpO1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ1Jlc2V0LiBQcmVzcyBwbGF5IHRvIHN0YXJ0IGFnYWluLic7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kaXJlY3Rpb24gPSAxO1xuICAgICAgdGhpcy5wbGF5ZXIucGxheSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnZvbHVtZVVwZGF0ZVRpbWVySWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnVwZGF0ZVZvbHVtZSgpLCAxMDApO1xuICAgICAgICB0aGlzLmVuYWJsZUFuc3dlciA9IHRydWU7XG4gICAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnUmVzZXQnO1xuICAgICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiV2hlbiB5b3UgaGVhciBhIHNvdW5kLCBwcmVzcyB0aGUgYnV0dG9uIGFuZCBrZWVwIGl0IHByZXNzZWQgdW50aWwgeW91IGNhbid0IGhlYXIgaXQgYW55bW9yZS4gVGhlbiByZWxlYXNlIGFuZCByZXBlYXQuXCI7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVWb2x1bWUoKSB7XG4gICAgdGhpcy52b2x1bWUgPSBkYjJhKHRoaXMuZGlyZWN0aW9uICogMC4zKSAqIHRoaXMudm9sdW1lO1xuICAgIHRoaXMucGxheWVyLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICB9XG5cbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdQbGF5JztcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgIHRoaXMudm9sdW1lID0gZGIyYSgtNDApO1xuICAgIHRoaXMucGxheWVyLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICAgIHRoaXMudHVybnMgPSBbXTtcbiAgfVxuXG4gIGZpbmlzaCgpIHtcbiAgICBsZXQgYXZnX3RocmVzaG9sZCA9IDA7XG4gICAgbGV0IG5fbGFzdF90dXJucyA9IDY7XG4gICAgZm9yIChsZXQgaSA9IHRoaXMudHVybnMubGVuZ3RoIC0gMTsgaSA+PSB0aGlzLnR1cm5zLmxlbmd0aCAtIG5fbGFzdF90dXJuczsgaS0tKSB7XG4gICAgICBhdmdfdGhyZXNob2xkID0gYXZnX3RocmVzaG9sZCArIHRoaXMudHVybnNbaV07XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdzdW06ICcgKyBhdmdfdGhyZXNob2xkICsgJywgbjogJyArIG5fbGFzdF90dXJucyk7XG4gICAgYXZnX3RocmVzaG9sZCA9IGF2Z190aHJlc2hvbGQgLyBuX2xhc3RfdHVybnM7XG4gICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIudGhyZXNob2xkID0gYXZnX3RocmVzaG9sZDtcbiAgICBjb25zb2xlLmxvZygnVHVybnM6ICcgKyBKU09OLnN0cmluZ2lmeSh0aGlzLnR1cm5zKSk7XG4gICAgY29uc29sZS5sb2coJ1RocmVzaG9sZDogJyArIGF2Z190aHJlc2hvbGQpO1xuICAgIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbXCIvZXhwZXJpbWVudFwiXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICB9XG5cbiAgc2hvd0Vycm9yKGVycikge1xuICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgdGl0bGU6ICdFcnJvcicsXG4gICAgICBtZXNzYWdlOiBlcnIsXG4gICAgICBva0J1dHRvblRleHQ6ICdDbG9zZSdcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIC8vIHBhc3NcbiAgICB9KTtcbiAgfVxufVxuIl19