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
        console.log(docsFolder.path);
        var fileHandle = docsFolder.getFile('participants.txt');
        fileHandle.readText().then(function (subjects) {
            var fullList = subjects.concat('subj: ' + _this.name + ', age: ' + _this.age + '\n');
            return fileHandle.writeText(fullList);
        }).then(function () {
            return dialogs.alert({
                title: 'Thank you!',
                message: 'Your participant ID is ' + _this.name + ' and your age is ' + _this.age,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwQztBQUMxQyxxREFBdUQ7QUFDdkQsaURBQW1EO0FBQ25ELHNEQUErRDtBQUUvRCwrQ0FBc0Q7QUFRdEQ7SUFRRSxtQkFBb0IsWUFBMEIsRUFDMUIsZ0JBQWtDO1FBRGxDLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBQzFCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFFcEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUVELG1DQUFlLEdBQWY7UUFBQSxpQkF1Q0M7UUF0Q0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxlQUFlLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxZQUFZLEdBQUcsT0FBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDckgsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDMUIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDM0IsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUM1QixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUE7UUFDUixDQUFDO1FBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDO1FBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFdkMsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDeEQsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQWdCO1lBQzFDLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxHQUFHLEtBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ25CLEtBQUssRUFBRSxZQUFZO2dCQUNuQixPQUFPLEVBQUUseUJBQXlCLEdBQUcsS0FBSSxDQUFDLElBQUksR0FBRyxtQkFBbUIsR0FBRyxLQUFJLENBQUMsR0FBRztnQkFDL0UsWUFBWSxFQUFFLElBQUk7YUFDbkIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sS0FBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUMsWUFBWSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUEsR0FBRztZQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsbUNBQWUsR0FBZjtRQUNFLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDYixLQUFLLEVBQUUsa0JBQWtCO1lBQ3pCLE9BQU8sRUFBRSxhQUFhO1lBQ3RCLGdCQUFnQixFQUFFLFFBQVE7WUFDMUIsT0FBTyxFQUFFLENBQUMsaUJBQWlCLENBQUM7U0FDN0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLE1BQWM7WUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCwrQkFBVyxHQUFYO0lBRUEsQ0FBQztJQXRFVSxTQUFTO1FBTnJCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLFlBQVk7WUFDdEIsV0FBVyxFQUFFLGNBQWM7WUFDM0IsU0FBUyxFQUFFLENBQUMsYUFBYSxDQUFDO1NBQzNCLENBQUM7eUNBU2tDLG1CQUFZO1lBQ1IseUJBQWdCO09BVDNDLFNBQVMsQ0F3RXJCO0lBQUQsZ0JBQUM7Q0FBQSxBQXhFRCxJQXdFQztBQXhFWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXJcIjtcblxuaW1wb3J0IHsgVXNlclByb3ZpZGVyIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3VzZXIvdXNlcic7XG5cbkBDb21wb25lbnQoe1xuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICBzZWxlY3RvcjogJ3BhZ2Utc3RhcnQnLFxuICB0ZW1wbGF0ZVVybDogJy4vc3RhcnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL3N0YXJ0LmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIFN0YXJ0UGFnZSB7XG4gIHByaXZhdGUgYWdlOiBzdHJpbmc7XG4gIHByaXZhdGUgbmFtZTogc3RyaW5nO1xuXG4gIHByaXZhdGUgc3VibWl0dGVkOiBib29sZWFuO1xuICBwcml2YXRlIGFnZV9pbnZhbGlkOiBib29sZWFuO1xuICBwcml2YXRlIG5hbWVfaW52YWxpZDogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHVzZXJQcm92aWRlcjogVXNlclByb3ZpZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMpIHtcblxuICAgIHRoaXMuc3VibWl0dGVkID0gZmFsc2U7XG4gICAgdGhpcy5hZ2VfaW52YWxpZCA9IHRydWU7XG4gICAgdGhpcy5uYW1lX2ludmFsaWQgPSB0cnVlO1xuICB9XG5cbiAgc3RhcnRFdmFsdWF0aW9uKCkge1xuICAgIHRoaXMuc3VibWl0dGVkID0gdHJ1ZTtcbiAgICBsZXQgYWdlX251bWJlciA9IE51bWJlci5wYXJzZUludCh0aGlzLmFnZSk7XG4gICAgY29uc29sZS5sb2coJ0FnZTogJyArIHRoaXMuYWdlICsgJyBpcyBpbnRlZ2VyOiAnICsgTnVtYmVyLmlzSW50ZWdlcihhZ2VfbnVtYmVyKSArICcgdHlwZSBvZjogJyArIHR5cGVvZihhZ2VfbnVtYmVyKSk7XG4gICAgaWYgKCF0aGlzLmFnZSB8fCAhTnVtYmVyLmlzSW50ZWdlcihhZ2VfbnVtYmVyKSkge1xuICAgICAgdGhpcy5hZ2VfaW52YWxpZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWdlX2ludmFsaWQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm5hbWUpIHtcbiAgICAgIHRoaXMubmFtZV9pbnZhbGlkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5uYW1lX2ludmFsaWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hZ2VfaW52YWxpZCB8fCB0aGlzLm5hbWVfaW52YWxpZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy51c2VyUHJvdmlkZXIuYWdlID0gYWdlX251bWJlcjtcbiAgICB0aGlzLnVzZXJQcm92aWRlci51c2VybmFtZSA9IHRoaXMubmFtZTtcblxuICAgIGxldCBkb2NzRm9sZGVyID0gZnMua25vd25Gb2xkZXJzLmRvY3VtZW50cygpO1xuICAgIGNvbnNvbGUubG9nKGRvY3NGb2xkZXIucGF0aCk7XG4gICAgbGV0IGZpbGVIYW5kbGUgPSBkb2NzRm9sZGVyLmdldEZpbGUoJ3BhcnRpY2lwYW50cy50eHQnKTtcbiAgICBmaWxlSGFuZGxlLnJlYWRUZXh0KCkudGhlbigoc3ViamVjdHM6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IGZ1bGxMaXN0ID0gc3ViamVjdHMuY29uY2F0KCdzdWJqOiAnICsgdGhpcy5uYW1lICsgJywgYWdlOiAnICsgdGhpcy5hZ2UgKyAnXFxuJyk7XG4gICAgICByZXR1cm4gZmlsZUhhbmRsZS53cml0ZVRleHQoZnVsbExpc3QpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICB0aXRsZTogJ1RoYW5rIHlvdSEnLFxuICAgICAgICBtZXNzYWdlOiAnWW91ciBwYXJ0aWNpcGFudCBJRCBpcyAnICsgdGhpcy5uYW1lICsgJyBhbmQgeW91ciBhZ2UgaXMgJyArIHRoaXMuYWdlLFxuICAgICAgICBva0J1dHRvblRleHQ6ICdPSydcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi9leHBlcmltZW50XCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBzaG93QWN0aW9uU2hlZXQoKSB7XG4gICAgZGlhbG9ncy5hY3Rpb24oe1xuICAgICAgdGl0bGU6ICdTZW5kIHRoZSByZXN1bHRzJyxcbiAgICAgIG1lc3NhZ2U6ICd2ZXJzaW9uIDAuMScsXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiAnQ2FuY2VsJyxcbiAgICAgIGFjdGlvbnM6IFsnU2VuZCB3aXRoIGVtYWlsJ11cbiAgICB9KS50aGVuKChyZXN1bHQ6IHN0cmluZykgPT4ge1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbmRSZXN1bHRzKCkge1xuXG4gIH1cblxufVxuIl19