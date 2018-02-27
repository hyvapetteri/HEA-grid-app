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
            _this.routerExtensions.navigate(["/experiment"], { clearHistory: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwQztBQUMxQyxxREFBdUQ7QUFFdkQsaURBQW1EO0FBQ25ELHNEQUErRDtBQUUvRCx3REFBK0Q7QUFRL0Q7SUFRRSxtQkFBb0IsZUFBZ0MsRUFDaEMsZ0JBQWtDO1FBRGxDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBRXBELElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBRXpCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxtQ0FBZSxHQUFmO1FBQUEsaUJBaUNDO1FBaENDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBRXRCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUM1QixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFBO1FBQ1IsQ0FBQztRQUVELElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDMUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUVyRCxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdCLElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN4RCxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsUUFBZ0I7WUFDMUMsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztnQkFDbkIsS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLE9BQU8sRUFBRSx5QkFBeUIsR0FBRyxLQUFJLENBQUMsSUFBSTtnQkFDOUMsWUFBWSxFQUFFLElBQUk7YUFDbkIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sS0FBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUMsWUFBWSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUEsR0FBRztZQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsd0NBQW9CLEdBQXBCLFVBQXFCLElBQUk7UUFDdkIsSUFBSSxNQUFNLEdBQWUsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCxtQ0FBZSxHQUFmO1FBQ0UsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNiLEtBQUssRUFBRSxrQkFBa0I7WUFDekIsT0FBTyxFQUFFLGFBQWE7WUFDdEIsZ0JBQWdCLEVBQUUsUUFBUTtZQUMxQixPQUFPLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztTQUM3QixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsTUFBYztZQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELCtCQUFXLEdBQVg7SUFFQSxDQUFDO0lBdkVVLFNBQVM7UUFOckIsZ0JBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixRQUFRLEVBQUUsWUFBWTtZQUN0QixXQUFXLEVBQUUsY0FBYztZQUMzQixTQUFTLEVBQUUsQ0FBQyxhQUFhLENBQUM7U0FDM0IsQ0FBQzt5Q0FTcUMseUJBQWU7WUFDZCx5QkFBZ0I7T0FUM0MsU0FBUyxDQXlFckI7SUFBRCxnQkFBQztDQUFBLEFBekVELElBeUVDO0FBekVZLDhCQUFTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcbmltcG9ydCB7IExpc3RQaWNrZXIgfSBmcm9tIFwidWkvbGlzdC1waWNrZXJcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XG5pbXBvcnQgeyBSb3V0ZXJFeHRlbnNpb25zIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL3JvdXRlclwiO1xuXG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zaGFyZWQvc2Vzc2lvbi9zZXNzaW9uJztcblxuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAncGFnZS1zdGFydCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9zdGFydC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vc3RhcnQuY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgU3RhcnRQYWdlIHtcbiAgcHJpdmF0ZSBuYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgZnJlcXM6IG51bWJlcltdO1xuICBwcml2YXRlIHBpY2tlZEZyZXE6IG51bWJlcjtcblxuICBwcml2YXRlIHN1Ym1pdHRlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBuYW1lX2ludmFsaWQ6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXNzaW9uUHJvdmlkZXI6IFNlc3Npb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zKSB7XG5cbiAgICB0aGlzLnN1Ym1pdHRlZCA9IGZhbHNlO1xuICAgIHRoaXMubmFtZV9pbnZhbGlkID0gdHJ1ZTtcblxuICAgIHRoaXMuZnJlcXMgPSBbMTAwMCwgMjAwMCwgNDAwMF07XG4gICAgdGhpcy5waWNrZWRGcmVxID0gMTAwMDtcbiAgfVxuXG4gIHN0YXJ0RXZhbHVhdGlvbigpIHtcbiAgICB0aGlzLnN1Ym1pdHRlZCA9IHRydWU7XG5cbiAgICBpZiAoIXRoaXMubmFtZSkge1xuICAgICAgdGhpcy5uYW1lX2ludmFsaWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm5hbWVfaW52YWxpZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm5hbWVfaW52YWxpZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIudXNlcm5hbWUgPSB0aGlzLm5hbWU7XG4gICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIudGVzdEZyZXF1ZW5jeSA9IHRoaXMucGlja2VkRnJlcTtcblxuICAgIGxldCBkb2NzRm9sZGVyID0gZnMua25vd25Gb2xkZXJzLmRvY3VtZW50cygpO1xuICAgIGNvbnNvbGUubG9nKGRvY3NGb2xkZXIucGF0aCk7XG4gICAgbGV0IGZpbGVIYW5kbGUgPSBkb2NzRm9sZGVyLmdldEZpbGUoJ3BhcnRpY2lwYW50cy50eHQnKTtcbiAgICBmaWxlSGFuZGxlLnJlYWRUZXh0KCkudGhlbigoc3ViamVjdHM6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IGZ1bGxMaXN0ID0gc3ViamVjdHMuY29uY2F0KCdzdWJqOiAnICsgdGhpcy5uYW1lICsgJ1xcbicpO1xuICAgICAgcmV0dXJuIGZpbGVIYW5kbGUud3JpdGVUZXh0KGZ1bGxMaXN0KTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgICAgdGl0bGU6ICdUaGFuayB5b3UhJyxcbiAgICAgICAgbWVzc2FnZTogJ1lvdXIgcGFydGljaXBhbnQgSUQgaXMgJyArIHRoaXMubmFtZSxcbiAgICAgICAgb2tCdXR0b25UZXh0OiAnT0snXG4gICAgICB9KTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbXCIvZXhwZXJpbWVudFwiXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgc2VsZWN0ZWRJbmRleENoYW5nZWQoYXJncykge1xuICAgIGxldCBwaWNrZXIgPSA8TGlzdFBpY2tlcj5hcmdzLm9iamVjdDtcbiAgICB0aGlzLnBpY2tlZEZyZXEgPSB0aGlzLmZyZXFzW3BpY2tlci5zZWxlY3RlZEluZGV4XTtcbiAgfVxuXG4gIHNob3dBY3Rpb25TaGVldCgpIHtcbiAgICBkaWFsb2dzLmFjdGlvbih7XG4gICAgICB0aXRsZTogJ1NlbmQgdGhlIHJlc3VsdHMnLFxuICAgICAgbWVzc2FnZTogJ3ZlcnNpb24gMC4xJyxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6ICdDYW5jZWwnLFxuICAgICAgYWN0aW9uczogWydTZW5kIHdpdGggZW1haWwnXVxuICAgIH0pLnRoZW4oKHJlc3VsdDogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgIH0pO1xuICB9XG5cbiAgc2VuZFJlc3VsdHMoKSB7XG5cbiAgfVxuXG59XG4iXX0=