"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
require("rxjs/add/operator/map");
var SessionProvider = (function () {
    function SessionProvider() {
    }
    Object.defineProperty(SessionProvider.prototype, "username", {
        get: function () {
            return this._username;
        },
        set: function (newname) {
            this._username = newname;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SessionProvider.prototype, "testFrequency", {
        get: function () {
            return this._test_frequency;
        },
        set: function (newfreq) {
            this._test_frequency = newfreq;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SessionProvider.prototype, "threshold", {
        get: function () {
            return this._threshold;
        },
        set: function (th) {
            this._threshold = th;
        },
        enumerable: true,
        configurable: true
    });
    SessionProvider = __decorate([
        core_1.Injectable(),
        __metadata("design:paramtypes", [])
    ], SessionProvider);
    return SessionProvider;
}());
exports.SessionProvider = SessionProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMkM7QUFDM0MsaUNBQStCO0FBRy9CO0lBS0U7SUFDQSxDQUFDO0lBRUQsc0JBQUkscUNBQVE7YUFBWjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3hCLENBQUM7YUFFRCxVQUFhLE9BQWM7WUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7UUFDM0IsQ0FBQzs7O09BSkE7SUFNRCxzQkFBSSwwQ0FBYTthQUFqQjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzlCLENBQUM7YUFFRCxVQUFrQixPQUFjO1lBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO1FBQ2pDLENBQUM7OztPQUpBO0lBTUQsc0JBQUksc0NBQVM7YUFBYjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7YUFFRCxVQUFjLEVBQVM7WUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDdkIsQ0FBQzs7O09BSkE7SUExQlUsZUFBZTtRQUQzQixpQkFBVSxFQUFFOztPQUNBLGVBQWUsQ0FnQzNCO0lBQUQsc0JBQUM7Q0FBQSxBQWhDRCxJQWdDQztBQWhDWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCAncnhqcy9hZGQvb3BlcmF0b3IvbWFwJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFNlc3Npb25Qcm92aWRlciB7XG4gIHByaXZhdGUgX3VzZXJuYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgX3Rlc3RfZnJlcXVlbmN5OiBudW1iZXI7XG4gIHByaXZhdGUgX3RocmVzaG9sZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICB9XG5cbiAgZ2V0IHVzZXJuYW1lKCk6c3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdXNlcm5hbWU7XG4gIH1cblxuICBzZXQgdXNlcm5hbWUobmV3bmFtZTpzdHJpbmcpIHtcbiAgICB0aGlzLl91c2VybmFtZSA9IG5ld25hbWU7XG4gIH1cblxuICBnZXQgdGVzdEZyZXF1ZW5jeSgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3Rlc3RfZnJlcXVlbmN5O1xuICB9XG5cbiAgc2V0IHRlc3RGcmVxdWVuY3kobmV3ZnJlcTpudW1iZXIpIHtcbiAgICB0aGlzLl90ZXN0X2ZyZXF1ZW5jeSA9IG5ld2ZyZXE7XG4gIH1cblxuICBnZXQgdGhyZXNob2xkKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdGhyZXNob2xkO1xuICB9XG5cbiAgc2V0IHRocmVzaG9sZCh0aDpudW1iZXIpIHtcbiAgICB0aGlzLl90aHJlc2hvbGQgPSB0aDtcbiAgfVxuXG59XG4iXX0=