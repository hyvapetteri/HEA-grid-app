"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var router_1 = require("nativescript-angular/router");
var nativescript_audio_1 = require("nativescript-audio");
var user_1 = require("../../shared/user/user");
function db2a(db) {
    return Math.pow(10, db / 20);
}
var ThresholdPage = (function () {
    function ThresholdPage(userProvider, routerExtensions) {
        var _this = this;
        this.userProvider = userProvider;
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
        for (var i = 0; i < this.turns.length; i++) {
            avg_threshold = avg_threshold + this.turns[i];
        }
        avg_threshold = avg_threshold / this.turns.length;
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
        __metadata("design:paramtypes", [user_1.UserProvider,
            router_1.RouterExtensions])
    ], ThresholdPage);
    return ThresholdPage;
}());
exports.ThresholdPage = ThresholdPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZXNob2xkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGhyZXNob2xkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQTBDO0FBQzFDLHFEQUF1RDtBQUN2RCxpREFBbUQ7QUFDbkQsc0RBQStEO0FBRS9ELHlEQUErQztBQUUvQywrQ0FBc0Q7QUFJdEQsY0FBYyxFQUFTO0lBQ3JCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0IsQ0FBQztBQVFEO0lBa0JFLHVCQUFvQixZQUEwQixFQUMxQixnQkFBa0M7UUFEdEQsaUJBdUJDO1FBdkJtQixpQkFBWSxHQUFaLFlBQVksQ0FBYztRQUMxQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBRXBELElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBRTFCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBRXBCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSw4QkFBUyxFQUFFLENBQUM7UUFFOUIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7WUFDdkIsU0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsZUFBZSxDQUFDO1lBQ3hELElBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQyxDQUFDLElBQUksQ0FBQztZ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O1FBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNuQyxDQUFDO0lBRUQsOEJBQU0sR0FBTjtRQUNFLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN0QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDM0MsYUFBYSxHQUFHLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFDRCxhQUFhLEdBQUcsYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ3BELENBQUM7SUFFRCxpQ0FBUyxHQUFULFVBQVUsR0FBRztRQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDWixLQUFLLEVBQUUsT0FBTztZQUNkLE9BQU8sRUFBRSxHQUFHO1lBQ1osWUFBWSxFQUFFLE9BQU87U0FDdEIsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNOLE9BQU87UUFDVCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUExR1UsYUFBYTtRQU56QixnQkFBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25CLFFBQVEsRUFBRSxnQkFBZ0I7WUFDMUIsV0FBVyxFQUFFLGtCQUFrQjtZQUMvQixTQUFTLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztTQUMvQixDQUFDO3lDQW1Ca0MsbUJBQVk7WUFDUix5QkFBZ0I7T0FuQjNDLGFBQWEsQ0EyR3pCO0lBQUQsb0JBQUM7Q0FBQSxBQTNHRCxJQTJHQztBQTNHWSxzQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXJcIjtcbmltcG9ydCB7IFRvdWNoR2VzdHVyZUV2ZW50RGF0YSB9IGZyb20gXCJ1aS9nZXN0dXJlc1wiO1xuaW1wb3J0IHsgVE5TUGxheWVyIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWF1ZGlvJztcblxuaW1wb3J0IHsgVXNlclByb3ZpZGVyIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3VzZXIvdXNlcic7XG5cbmRlY2xhcmUgdmFyIE5TVVJMO1xuXG5mdW5jdGlvbiBkYjJhKGRiOm51bWJlcikge1xuICByZXR1cm4gTWF0aC5wb3coMTAsIGRiLzIwKTtcbn1cblxuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAncGFnZS10aHJlc2hvbGQnLFxuICB0ZW1wbGF0ZVVybDogJy4vdGhyZXNob2xkLmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi90aHJlc2hvbGQuY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgVGhyZXNob2xkUGFnZSB7XG4gIHByaXZhdGUgaW5zdHJ1Y3Rpb25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgYW5zd2VyQnV0dG9uVGV4dDogc3RyaW5nO1xuICBwcml2YXRlIHBsYXlCdXR0b25UZXh0OiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBlbmFibGVQbGF5OiBib29sZWFuO1xuICBwcml2YXRlIGVuYWJsZUFuc3dlcjogYm9vbGVhbjtcblxuICBwcml2YXRlIHBsYXllcjogVE5TUGxheWVyO1xuICBwcml2YXRlIGF1ZGlvUGF0aDogc3RyaW5nO1xuXG4gIHByaXZhdGUgdm9sdW1lOiBudW1iZXI7XG4gIHByaXZhdGUgdHVybnM6IG51bWJlcltdO1xuICBwcml2YXRlIGRpcmVjdGlvbjogbnVtYmVyO1xuICBwcml2YXRlIG1heF90dXJuczogbnVtYmVyO1xuXG4gIHByaXZhdGUgdm9sdW1lVXBkYXRlVGltZXJJZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdXNlclByb3ZpZGVyOiBVc2VyUHJvdmlkZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgcm91dGVyRXh0ZW5zaW9uczogUm91dGVyRXh0ZW5zaW9ucykge1xuXG4gICAgdGhpcy5lbmFibGVQbGF5ID0gZmFsc2U7XG4gICAgdGhpcy5lbmFibGVBbnN3ZXIgPSBmYWxzZTtcblxuICAgIHRoaXMubWF4X3R1cm5zID0gMTA7XG5cbiAgICB0aGlzLnBsYXllciA9IG5ldyBUTlNQbGF5ZXIoKTtcblxuICAgIGxldCBhcHBQYXRoID0gZnMua25vd25Gb2xkZXJzLmN1cnJlbnRBcHAoKTtcbiAgICB0aGlzLmF1ZGlvUGF0aCA9IGZzLnBhdGguam9pbihhcHBQYXRoLnBhdGgsICdhdWRpbycpO1xuICAgIGNvbnNvbGUubG9nKHRoaXMuYXVkaW9QYXRoKTtcblxuICAgIHRoaXMucGxheWVyLmluaXRGcm9tRmlsZSh7XG4gICAgICBhdWRpb0ZpbGU6IGZzLnBhdGguam9pbih0aGlzLmF1ZGlvUGF0aCwgJ2YxMDAwX3JlZi53YXYnKSxcbiAgICAgIGxvb3A6IHRydWVcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG4gICAgfSkuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuXG4gICAgdGhpcy5yZXNldCgpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ1ByZXNzIHBsYXkgdG8gc3RhcnQnO1xuICB9XG5cbiAgb25CdXR0b25Ub3VjaChhcmdzOiBUb3VjaEdlc3R1cmVFdmVudERhdGEpIHtcbiAgICBpZiAoYXJncy5hY3Rpb24gPT0gJ2Rvd24nKSB7XG4gICAgICB0aGlzLnR1cm5zLnB1c2godGhpcy52b2x1bWUpO1xuICAgICAgdGhpcy5kaXJlY3Rpb24gPSAtMTtcbiAgICB9IGVsc2UgaWYgKGFyZ3MuYWN0aW9uID09ICd1cCcpIHtcbiAgICAgIHRoaXMudHVybnMucHVzaCh0aGlzLnZvbHVtZSk7XG4gICAgICB0aGlzLmRpcmVjdGlvbiA9IDE7XG4gICAgfVxuICAgIGlmICh0aGlzLnR1cm5zLmxlbmd0aCA+PSB0aGlzLm1heF90dXJucykge1xuICAgICAgdGhpcy5wbGF5ZXIucGF1c2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnZvbHVtZVVwZGF0ZVRpbWVySWQpO1xuICAgICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdEb25lJztcbiAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHBsYXkoKSB7XG4gICAgaWYgKHRoaXMucGxheWVyLmlzQXVkaW9QbGF5aW5nKCkpIHtcbiAgICAgIHRoaXMucGxheWVyLnBhdXNlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy52b2x1bWVVcGRhdGVUaW1lcklkKTtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdSZXNldC4gUHJlc3MgcGxheSB0byBzdGFydCBhZ2Fpbi4nO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlyZWN0aW9uID0gMTtcbiAgICAgIHRoaXMucGxheWVyLnBsYXkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy52b2x1bWVVcGRhdGVUaW1lcklkID0gc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy51cGRhdGVWb2x1bWUoKSwgMTAwKTtcbiAgICAgICAgdGhpcy5lbmFibGVBbnN3ZXIgPSB0cnVlO1xuICAgICAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gJ1Jlc2V0JztcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSBcIldoZW4geW91IGhlYXIgYSBzb3VuZCwgcHJlc3MgdGhlIGJ1dHRvbiBhbmQga2VlcCBpdCBwcmVzc2VkIHVudGlsIHlvdSBjYW4ndCBoZWFyIGl0IGFueW1vcmUuIFRoZW4gcmVsZWFzZSBhbmQgcmVwZWF0LlwiO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlVm9sdW1lKCkge1xuICAgIHRoaXMudm9sdW1lID0gZGIyYSh0aGlzLmRpcmVjdGlvbiAqIDAuMykgKiB0aGlzLnZvbHVtZTtcbiAgICB0aGlzLnBsYXllci52b2x1bWUgPSB0aGlzLnZvbHVtZTtcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnUGxheSc7XG4gICAgdGhpcy5lbmFibGVBbnN3ZXIgPSBmYWxzZTtcbiAgICB0aGlzLnZvbHVtZSA9IGRiMmEoLTQwKTtcbiAgICB0aGlzLnBsYXllci52b2x1bWUgPSB0aGlzLnZvbHVtZTtcbiAgfVxuXG4gIGZpbmlzaCgpIHtcbiAgICBsZXQgYXZnX3RocmVzaG9sZCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnR1cm5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhdmdfdGhyZXNob2xkID0gYXZnX3RocmVzaG9sZCArIHRoaXMudHVybnNbaV07XG4gICAgfVxuICAgIGF2Z190aHJlc2hvbGQgPSBhdmdfdGhyZXNob2xkIC8gdGhpcy50dXJucy5sZW5ndGg7XG4gIH1cblxuICBzaG93RXJyb3IoZXJyKSB7XG4gICAgZGlhbG9ncy5hbGVydCh7XG4gICAgICB0aXRsZTogJ0Vycm9yJyxcbiAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgIG9rQnV0dG9uVGV4dDogJ0Nsb3NlJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgLy8gcGFzc1xuICAgIH0pO1xuICB9XG59XG4iXX0=