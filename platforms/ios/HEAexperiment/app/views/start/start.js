"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var router_1 = require("nativescript-angular/router");
var session_1 = require("../../shared/session/session");
var StartPage = (function () {
    function StartPage(sessionProvider, routerExtensions) {
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.submitted = false;
        this.name_invalid = true;
        this.name = sessionProvider.username;
        this.freqs = [1000, 2000, 4000];
        this.pickedFreq = 1000;
    }
    StartPage.prototype.startEvaluation = function () {
        var _this = this;
        this.submitted = true;
        if (!this.name) {
            this.name_invalid = true;
        }
        else {
            this.name_invalid = false;
        }
        if (this.name_invalid) {
            return;
        }
        this.sessionProvider.username = this.name;
        this.sessionProvider.testFrequency = this.pickedFreq;
        var docsFolder = fs.knownFolders.documents();
        console.log(docsFolder.path);
        var fileHandle = docsFolder.getFile('participants.txt');
        fileHandle.readText().then(function (subjects) {
            var fullList = subjects.concat('subj: ' + _this.name + '\n');
            return fileHandle.writeText(fullList);
        }).then(function () {
            return dialogs.alert({
                title: 'Thank you!',
                message: 'Your participant ID is ' + _this.name,
                okButtonText: 'OK'
            });
        }).then(function () {
            _this.routerExtensions.navigate(["/threshold"], { clearHistory: true });
        }).catch(function (err) {
            console.log(err);
        });
    };
    StartPage.prototype.selectedIndexChanged = function (args) {
        var picker = args.object;
        this.pickedFreq = this.freqs[picker.selectedIndex];
    };
    StartPage.prototype.showActionSheet = function () {
        dialogs.action({
            title: 'Send the results',
            message: 'version 0.1',
            cancelButtonText: 'Cancel',
            actions: ['Send with email']
        }).then(function (result) {
            console.log(result);
        });
    };
    StartPage.prototype.sendResults = function () {
    };
    StartPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-start',
            templateUrl: './start.html',
            styleUrls: ['./start.css']
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions])
    ], StartPage);
    return StartPage;
}());
exports.StartPage = StartPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwQztBQUMxQyxxREFBdUQ7QUFFdkQsaURBQW1EO0FBQ25ELHNEQUErRDtBQUUvRCx3REFBK0Q7QUFRL0Q7SUFRRSxtQkFBb0IsZUFBZ0MsRUFDaEMsZ0JBQWtDO1FBRGxDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBRXBELElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQztRQUVyQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN6QixDQUFDO0lBRUQsbUNBQWUsR0FBZjtRQUFBLGlCQWlDQztRQWhDQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUV0QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDM0IsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQTtRQUNSLENBQUM7UUFFRCxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQzFDLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFFckQsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDeEQsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQWdCO1lBQzFDLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ25CLEtBQUssRUFBRSxZQUFZO2dCQUNuQixPQUFPLEVBQUUseUJBQXlCLEdBQUcsS0FBSSxDQUFDLElBQUk7Z0JBQzlDLFlBQVksRUFBRSxJQUFJO2FBQ25CLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNOLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFDLFlBQVksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFBLEdBQUc7WUFDVixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELHdDQUFvQixHQUFwQixVQUFxQixJQUFJO1FBQ3ZCLElBQUksTUFBTSxHQUFlLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsbUNBQWUsR0FBZjtRQUNFLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDYixLQUFLLEVBQUUsa0JBQWtCO1lBQ3pCLE9BQU8sRUFBRSxhQUFhO1lBQ3RCLGdCQUFnQixFQUFFLFFBQVE7WUFDMUIsT0FBTyxFQUFFLENBQUMsaUJBQWlCLENBQUM7U0FDN0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLE1BQWM7WUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCwrQkFBVyxHQUFYO0lBRUEsQ0FBQztJQXhFVSxTQUFTO1FBTnJCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLFlBQVk7WUFDdEIsV0FBVyxFQUFFLGNBQWM7WUFDM0IsU0FBUyxFQUFFLENBQUMsYUFBYSxDQUFDO1NBQzNCLENBQUM7eUNBU3FDLHlCQUFlO1lBQ2QseUJBQWdCO09BVDNDLFNBQVMsQ0EwRXJCO0lBQUQsZ0JBQUM7Q0FBQSxBQTFFRCxJQTBFQztBQTFFWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgeyBMaXN0UGlja2VyIH0gZnJvbSBcInVpL2xpc3QtcGlja2VyXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXJcIjtcblxuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3Nlc3Npb24vc2Vzc2lvbic7XG5cbkBDb21wb25lbnQoe1xuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICBzZWxlY3RvcjogJ3BhZ2Utc3RhcnQnLFxuICB0ZW1wbGF0ZVVybDogJy4vc3RhcnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL3N0YXJ0LmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIFN0YXJ0UGFnZSB7XG4gIHByaXZhdGUgbmFtZTogc3RyaW5nO1xuICBwcml2YXRlIGZyZXFzOiBudW1iZXJbXTtcbiAgcHJpdmF0ZSBwaWNrZWRGcmVxOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSBzdWJtaXR0ZWQ6IGJvb2xlYW47XG4gIHByaXZhdGUgbmFtZV9pbnZhbGlkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Vzc2lvblByb3ZpZGVyOiBTZXNzaW9uUHJvdmlkZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgcm91dGVyRXh0ZW5zaW9uczogUm91dGVyRXh0ZW5zaW9ucykge1xuXG4gICAgdGhpcy5zdWJtaXR0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLm5hbWVfaW52YWxpZCA9IHRydWU7XG4gICAgdGhpcy5uYW1lID0gc2Vzc2lvblByb3ZpZGVyLnVzZXJuYW1lO1xuXG4gICAgdGhpcy5mcmVxcyA9IFsxMDAwLCAyMDAwLCA0MDAwXTtcbiAgICB0aGlzLnBpY2tlZEZyZXEgPSAxMDAwO1xuICB9XG5cbiAgc3RhcnRFdmFsdWF0aW9uKCkge1xuICAgIHRoaXMuc3VibWl0dGVkID0gdHJ1ZTtcblxuICAgIGlmICghdGhpcy5uYW1lKSB7XG4gICAgICB0aGlzLm5hbWVfaW52YWxpZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubmFtZV9pbnZhbGlkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubmFtZV9pbnZhbGlkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnNlc3Npb25Qcm92aWRlci51c2VybmFtZSA9IHRoaXMubmFtZTtcbiAgICB0aGlzLnNlc3Npb25Qcm92aWRlci50ZXN0RnJlcXVlbmN5ID0gdGhpcy5waWNrZWRGcmVxO1xuXG4gICAgbGV0IGRvY3NGb2xkZXIgPSBmcy5rbm93bkZvbGRlcnMuZG9jdW1lbnRzKCk7XG4gICAgY29uc29sZS5sb2coZG9jc0ZvbGRlci5wYXRoKTtcbiAgICBsZXQgZmlsZUhhbmRsZSA9IGRvY3NGb2xkZXIuZ2V0RmlsZSgncGFydGljaXBhbnRzLnR4dCcpO1xuICAgIGZpbGVIYW5kbGUucmVhZFRleHQoKS50aGVuKChzdWJqZWN0czogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgZnVsbExpc3QgPSBzdWJqZWN0cy5jb25jYXQoJ3N1Ymo6ICcgKyB0aGlzLm5hbWUgKyAnXFxuJyk7XG4gICAgICByZXR1cm4gZmlsZUhhbmRsZS53cml0ZVRleHQoZnVsbExpc3QpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICB0aXRsZTogJ1RoYW5rIHlvdSEnLFxuICAgICAgICBtZXNzYWdlOiAnWW91ciBwYXJ0aWNpcGFudCBJRCBpcyAnICsgdGhpcy5uYW1lLFxuICAgICAgICBva0J1dHRvblRleHQ6ICdPSydcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi90aHJlc2hvbGRcIl0sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbGVjdGVkSW5kZXhDaGFuZ2VkKGFyZ3MpIHtcbiAgICBsZXQgcGlja2VyID0gPExpc3RQaWNrZXI+YXJncy5vYmplY3Q7XG4gICAgdGhpcy5waWNrZWRGcmVxID0gdGhpcy5mcmVxc1twaWNrZXIuc2VsZWN0ZWRJbmRleF07XG4gIH1cblxuICBzaG93QWN0aW9uU2hlZXQoKSB7XG4gICAgZGlhbG9ncy5hY3Rpb24oe1xuICAgICAgdGl0bGU6ICdTZW5kIHRoZSByZXN1bHRzJyxcbiAgICAgIG1lc3NhZ2U6ICd2ZXJzaW9uIDAuMScsXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiAnQ2FuY2VsJyxcbiAgICAgIGFjdGlvbnM6IFsnU2VuZCB3aXRoIGVtYWlsJ11cbiAgICB9KS50aGVuKChyZXN1bHQ6IHN0cmluZykgPT4ge1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbmRSZXN1bHRzKCkge1xuXG4gIH1cblxufVxuIl19