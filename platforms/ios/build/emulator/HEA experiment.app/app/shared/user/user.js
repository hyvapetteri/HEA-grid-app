"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
require("rxjs/add/operator/map");
/*
  Generated class for the UserProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
var UserProvider = (function () {
    function UserProvider() {
    }
    Object.defineProperty(UserProvider.prototype, "username", {
        get: function () {
            return this._username;
        },
        set: function (newname) {
            this._username = newname;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserProvider.prototype, "age", {
        get: function () {
            return this._age;
        },
        set: function (newage) {
            this._age = newage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserProvider.prototype, "gender", {
        get: function () {
            return this._gender;
        },
        set: function (gen) {
            this._gender = gen;
        },
        enumerable: true,
        configurable: true
    });
    UserProvider = __decorate([
        core_1.Injectable(),
        __metadata("design:paramtypes", [])
    ], UserProvider);
    return UserProvider;
}());
exports.UserProvider = UserProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMkM7QUFDM0MsaUNBQStCO0FBRS9COzs7OztFQUtFO0FBRUY7SUFLRTtJQUNBLENBQUM7SUFFRCxzQkFBSSxrQ0FBUTthQUFaO1lBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDeEIsQ0FBQzthQUVELFVBQWEsT0FBYztZQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztRQUMzQixDQUFDOzs7T0FKQTtJQU1ELHNCQUFJLDZCQUFHO2FBQVA7WUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNuQixDQUFDO2FBRUQsVUFBUSxNQUFhO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLENBQUM7OztPQUpBO0lBTUQsc0JBQUksZ0NBQU07YUFBVjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3RCLENBQUM7YUFFRCxVQUFXLEdBQVU7WUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7UUFDckIsQ0FBQzs7O09BSkE7SUExQlUsWUFBWTtRQUR4QixpQkFBVSxFQUFFOztPQUNBLFlBQVksQ0FnQ3hCO0lBQUQsbUJBQUM7Q0FBQSxBQWhDRCxJQWdDQztBQWhDWSxvQ0FBWSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCAncnhqcy9hZGQvb3BlcmF0b3IvbWFwJztcblxuLypcbiAgR2VuZXJhdGVkIGNsYXNzIGZvciB0aGUgVXNlclByb3ZpZGVyIHByb3ZpZGVyLlxuXG4gIFNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24gZm9yIG1vcmUgaW5mbyBvbiBwcm92aWRlcnNcbiAgYW5kIEFuZ3VsYXIgREkuXG4qL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFVzZXJQcm92aWRlciB7XG4gIHByaXZhdGUgX3VzZXJuYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgX2FnZTogbnVtYmVyO1xuICBwcml2YXRlIF9nZW5kZXI6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgfVxuXG4gIGdldCB1c2VybmFtZSgpOnN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3VzZXJuYW1lO1xuICB9XG5cbiAgc2V0IHVzZXJuYW1lKG5ld25hbWU6c3RyaW5nKSB7XG4gICAgdGhpcy5fdXNlcm5hbWUgPSBuZXduYW1lO1xuICB9XG5cbiAgZ2V0IGFnZSgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2FnZTtcbiAgfVxuXG4gIHNldCBhZ2UobmV3YWdlOm51bWJlcikge1xuICAgIHRoaXMuX2FnZSA9IG5ld2FnZTtcbiAgfVxuXG4gIGdldCBnZW5kZXIoKTpzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9nZW5kZXI7XG4gIH1cblxuICBzZXQgZ2VuZGVyKGdlbjpzdHJpbmcpIHtcbiAgICB0aGlzLl9nZW5kZXIgPSBnZW47XG4gIH1cblxufVxuIl19