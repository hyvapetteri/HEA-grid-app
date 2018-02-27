"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("tns-core-modules/utils/types");
var file_system_1 = require("tns-core-modules/file-system");
var utils = require("tns-core-modules/utils/utils");
var TNSPlayer = (function (_super) {
    __extends(TNSPlayer, _super);
    function TNSPlayer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TNSPlayer.prototype, "ios", {
        get: function () {
            return this._player;
        },
        enumerable: true,
        configurable: true
    });
    TNSPlayer.prototype.initFromFile = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            options.autoPlay = false;
            _this.playFromFile(options).then(resolve, reject);
        });
    };
    TNSPlayer.prototype.playFromFile = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (options.autoPlay !== false)
                options.autoPlay = true;
            try {
                var audioPath = void 0;
                var fileName = types_1.isString(options.audioFile)
                    ? options.audioFile.trim()
                    : "";
                if (fileName.indexOf("~/") === 0) {
                    fileName = file_system_1.path.join(file_system_1.knownFolders.currentApp().path, fileName.replace("~/", ""));
                }
                _this._completeCallback = options.completeCallback;
                _this._errorCallback = options.errorCallback;
                _this._infoCallback = options.infoCallback;
                var audioSession = AVAudioSession.sharedInstance();
                var output = audioSession.currentRoute.outputs.lastObject.portType;
                if (output.match(/Receiver/)) {
                    try {
                        audioSession.setCategoryError(AVAudioSessionCategoryPlayAndRecord);
                        audioSession.overrideOutputAudioPortError(AVAudioSessionPortOverrideSpeaker);
                        audioSession.setActiveError(true);
                    }
                    catch (err) {
                    }
                }
                _this._player = AVAudioPlayer.alloc().initWithContentsOfURLError(NSURL.fileURLWithPath(fileName));
                _this._player.delegate = _this;
                if (options.metering) {
                    _this._player.meteringEnabled = true;
                }
                if (options.loop) {
                    _this._player.numberOfLoops = -1;
                }
                if (options.autoPlay)
                    _this._player.play();
                resolve();
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback({ ex: ex });
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.initFromUrl = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            options.autoPlay = false;
            _this.playFromUrl(options).then(resolve, reject);
        });
    };
    TNSPlayer.prototype.playFromUrl = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (options.autoPlay !== false)
                options.autoPlay = true;
            try {
                var sharedSession = utils.ios.getter(NSURLSession, NSURLSession.sharedSession);
                _this._task = sharedSession.dataTaskWithURLCompletionHandler(NSURL.URLWithString(options.audioFile), function (data, response, error) {
                    if (error !== null) {
                        if (_this._errorCallback) {
                            _this._errorCallback({ error: error });
                        }
                        reject();
                    }
                    _this._completeCallback = options.completeCallback;
                    _this._errorCallback = options.errorCallback;
                    _this._infoCallback = options.infoCallback;
                    var audioSession = AVAudioSession.sharedInstance();
                    var output = audioSession.currentRoute.outputs.lastObject.portType;
                    if (output.match(/Receiver/)) {
                        try {
                            audioSession.setCategoryError(AVAudioSessionCategoryPlayAndRecord);
                            audioSession.overrideOutputAudioPortError(AVAudioSessionPortOverrideSpeaker);
                            audioSession.setActiveError(true);
                        }
                        catch (err) {
                        }
                    }
                    _this._player = AVAudioPlayer.alloc().initWithDataError(data, null);
                    _this._player.delegate = _this;
                    _this._player.numberOfLoops = options.loop ? -1 : 0;
                    if (options.metering) {
                        _this._player.meteringEnabled = true;
                    }
                    if (options.autoPlay)
                        _this._player.play();
                    resolve();
                });
                _this._task.resume();
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback({ ex: ex });
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.pause = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._player && _this._player.playing) {
                    _this._player.pause();
                    resolve(true);
                }
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback({ ex: ex });
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.play = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (!_this.isAudioPlaying()) {
                    _this._player.play();
                    resolve(true);
                }
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback({ ex: ex });
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.resume = function () {
        if (this._player)
            this._player.play();
    };
    TNSPlayer.prototype.playAtTime = function (time) {
        if (this._player) {
            this._player.playAtTime(time);
        }
    };
    TNSPlayer.prototype.seekTo = function (time) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._player) {
                    _this._player.currentTime = time;
                    resolve(true);
                }
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    Object.defineProperty(TNSPlayer.prototype, "volume", {
        get: function () {
            return this._player ? this._player.volume : 0;
        },
        set: function (value) {
            if (this._player) {
                this._player.volume = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    TNSPlayer.prototype.dispose = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._player && _this.isAudioPlaying()) {
                    _this._player.stop();
                }
                _this.reset();
                resolve();
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback({ ex: ex });
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.isAudioPlaying = function () {
        return this._player ? this._player.playing : false;
    };
    TNSPlayer.prototype.getAudioTrackDuration = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var duration = _this._player ? _this._player.duration : 0;
                resolve(duration.toString());
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback({ ex: ex });
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.audioPlayerDidFinishPlayingSuccessfully = function (player, flag) {
        if (flag && this._completeCallback) {
            this._completeCallback({ player: player, flag: flag });
        }
        else if (!flag && this._errorCallback) {
            this._errorCallback({ player: player, flag: flag });
        }
    };
    TNSPlayer.prototype.audioPlayerDecodeErrorDidOccurError = function (player, error) {
        if (this._errorCallback) {
            this._errorCallback({ player: player, error: error });
        }
    };
    TNSPlayer.prototype.reset = function () {
        if (this._player) {
            this._player = undefined;
        }
        if (this._task) {
            this._task.cancel();
            this._task = undefined;
        }
    };
    Object.defineProperty(TNSPlayer.prototype, "currentTime", {
        get: function () {
            return this._player ? this._player.currentTime : 0;
        },
        enumerable: true,
        configurable: true
    });
    TNSPlayer.ObjCProtocols = [AVAudioPlayerDelegate];
    return TNSPlayer;
}(NSObject));
exports.TNSPlayer = TNSPlayer;
