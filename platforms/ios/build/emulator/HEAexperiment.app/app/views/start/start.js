"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var router_1 = require("nativescript-angular/router");
var user_1 = require("../../shared/user/user");
var StartPage = (function () {
    function StartPage(userProvider, routerExtensions) {
        this.userProvider = userProvider;
        this.routerExtensions = routerExtensions;
        this.submitted = false;
        this.age_invalid = true;
        this.name_invalid = true;
    }
    StartPage.prototype.startEvaluation = function () {
        var _this = this;
        this.submitted = true;
        var age_number = Number.parseInt(this.age);
        console.log('Age: ' + this.age + ' is integer: ' + Number.isInteger(age_number) + ' type of: ' + typeof (age_number));
        if (!this.age || !Number.isInteger(age_number)) {
            this.age_invalid = true;
        }
        else {
            this.age_invalid = false;
        }
        if (!this.name) {
            this.name_invalid = true;
        }
        else {
            this.name_invalid = false;
        }
        if (this.age_invalid || this.name_invalid) {
            return;
        }
        this.userProvider.age = age_number;
        this.userProvider.username = this.name;
        var docsFolder = fs.knownFolders.documents();
        var fileHandle = docsFolder.getFile('participants.txt');
        fileHandle.readText().then(function (subjects) {
            var fullList = subjects.concat('subj: ' + _this.name + ', age: ' + _this.age + '\n');
            return fileHandle.writeText(fullList);
        }).then(function () {
            return dialogs.alert({
                title: 'Thank you!',
                message: 'Your participant ID is ' + _this.name + '.',
                okButtonText: 'OK'
            });
        }).then(function () {
            _this.routerExtensions.navigate(["/experiment"], { clearHistory: true });
        }).catch(function (err) {
            console.log(err);
        });
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
        __metadata("design:paramtypes", [user_1.UserProvider,
            router_1.RouterExtensions])
    ], StartPage);
    return StartPage;
}());
exports.StartPage = StartPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwQztBQUMxQyxxREFBdUQ7QUFDdkQsaURBQW1EO0FBQ25ELHNEQUErRDtBQUUvRCwrQ0FBc0Q7QUFRdEQ7SUFRRSxtQkFBb0IsWUFBMEIsRUFDMUIsZ0JBQWtDO1FBRGxDLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBQzFCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFFcEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUVELG1DQUFlLEdBQWY7UUFBQSxpQkFzQ0M7UUFyQ0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxlQUFlLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxZQUFZLEdBQUcsT0FBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDckgsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDMUIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDM0IsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUM1QixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUE7UUFDUixDQUFDO1FBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDO1FBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFdkMsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUM3QyxJQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDeEQsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQWdCO1lBQzFDLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxHQUFHLEtBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ25CLEtBQUssRUFBRSxZQUFZO2dCQUNuQixPQUFPLEVBQUUseUJBQXlCLEdBQUcsS0FBSSxDQUFDLElBQUksR0FBRyxHQUFHO2dCQUNwRCxZQUFZLEVBQUUsSUFBSTthQUNuQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixLQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBQyxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHO1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxtQ0FBZSxHQUFmO1FBQ0UsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNiLEtBQUssRUFBRSxrQkFBa0I7WUFDekIsT0FBTyxFQUFFLGFBQWE7WUFDdEIsZ0JBQWdCLEVBQUUsUUFBUTtZQUMxQixPQUFPLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztTQUM3QixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsTUFBYztZQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELCtCQUFXLEdBQVg7SUFFQSxDQUFDO0lBckVVLFNBQVM7UUFOckIsZ0JBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixRQUFRLEVBQUUsWUFBWTtZQUN0QixXQUFXLEVBQUUsY0FBYztZQUMzQixTQUFTLEVBQUUsQ0FBQyxhQUFhLENBQUM7U0FDM0IsQ0FBQzt5Q0FTa0MsbUJBQVk7WUFDUix5QkFBZ0I7T0FUM0MsU0FBUyxDQXVFckI7SUFBRCxnQkFBQztDQUFBLEFBdkVELElBdUVDO0FBdkVZLDhCQUFTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XG5pbXBvcnQgeyBSb3V0ZXJFeHRlbnNpb25zIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL3JvdXRlclwiO1xuXG5pbXBvcnQgeyBVc2VyUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zaGFyZWQvdXNlci91c2VyJztcblxuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAncGFnZS1zdGFydCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9zdGFydC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vc3RhcnQuY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgU3RhcnRQYWdlIHtcbiAgcHJpdmF0ZSBhZ2U6IHN0cmluZztcbiAgcHJpdmF0ZSBuYW1lOiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBzdWJtaXR0ZWQ6IGJvb2xlYW47XG4gIHByaXZhdGUgYWdlX2ludmFsaWQ6IGJvb2xlYW47XG4gIHByaXZhdGUgbmFtZV9pbnZhbGlkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdXNlclByb3ZpZGVyOiBVc2VyUHJvdmlkZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgcm91dGVyRXh0ZW5zaW9uczogUm91dGVyRXh0ZW5zaW9ucykge1xuXG4gICAgdGhpcy5zdWJtaXR0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFnZV9pbnZhbGlkID0gdHJ1ZTtcbiAgICB0aGlzLm5hbWVfaW52YWxpZCA9IHRydWU7XG4gIH1cblxuICBzdGFydEV2YWx1YXRpb24oKSB7XG4gICAgdGhpcy5zdWJtaXR0ZWQgPSB0cnVlO1xuICAgIGxldCBhZ2VfbnVtYmVyID0gTnVtYmVyLnBhcnNlSW50KHRoaXMuYWdlKTtcbiAgICBjb25zb2xlLmxvZygnQWdlOiAnICsgdGhpcy5hZ2UgKyAnIGlzIGludGVnZXI6ICcgKyBOdW1iZXIuaXNJbnRlZ2VyKGFnZV9udW1iZXIpICsgJyB0eXBlIG9mOiAnICsgdHlwZW9mKGFnZV9udW1iZXIpKTtcbiAgICBpZiAoIXRoaXMuYWdlIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKGFnZV9udW1iZXIpKSB7XG4gICAgICB0aGlzLmFnZV9pbnZhbGlkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZ2VfaW52YWxpZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubmFtZSkge1xuICAgICAgdGhpcy5uYW1lX2ludmFsaWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm5hbWVfaW52YWxpZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmFnZV9pbnZhbGlkIHx8IHRoaXMubmFtZV9pbnZhbGlkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnVzZXJQcm92aWRlci5hZ2UgPSBhZ2VfbnVtYmVyO1xuICAgIHRoaXMudXNlclByb3ZpZGVyLnVzZXJuYW1lID0gdGhpcy5uYW1lO1xuXG4gICAgbGV0IGRvY3NGb2xkZXIgPSBmcy5rbm93bkZvbGRlcnMuZG9jdW1lbnRzKCk7XG4gICAgbGV0IGZpbGVIYW5kbGUgPSBkb2NzRm9sZGVyLmdldEZpbGUoJ3BhcnRpY2lwYW50cy50eHQnKTtcbiAgICBmaWxlSGFuZGxlLnJlYWRUZXh0KCkudGhlbigoc3ViamVjdHM6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IGZ1bGxMaXN0ID0gc3ViamVjdHMuY29uY2F0KCdzdWJqOiAnICsgdGhpcy5uYW1lICsgJywgYWdlOiAnICsgdGhpcy5hZ2UgKyAnXFxuJyk7XG4gICAgICByZXR1cm4gZmlsZUhhbmRsZS53cml0ZVRleHQoZnVsbExpc3QpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICB0aXRsZTogJ1RoYW5rIHlvdSEnLFxuICAgICAgICBtZXNzYWdlOiAnWW91ciBwYXJ0aWNpcGFudCBJRCBpcyAnICsgdGhpcy5uYW1lICsgJy4nLFxuICAgICAgICBva0J1dHRvblRleHQ6ICdPSydcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi9leHBlcmltZW50XCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBzaG93QWN0aW9uU2hlZXQoKSB7XG4gICAgZGlhbG9ncy5hY3Rpb24oe1xuICAgICAgdGl0bGU6ICdTZW5kIHRoZSByZXN1bHRzJyxcbiAgICAgIG1lc3NhZ2U6ICd2ZXJzaW9uIDAuMScsXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiAnQ2FuY2VsJyxcbiAgICAgIGFjdGlvbnM6IFsnU2VuZCB3aXRoIGVtYWlsJ11cbiAgICB9KS50aGVuKChyZXN1bHQ6IHN0cmluZykgPT4ge1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbmRSZXN1bHRzKCkge1xuXG4gIH1cblxufVxuIl19