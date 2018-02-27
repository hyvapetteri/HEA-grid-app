"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TNSRecorder = (function (_super) {
    __extends(TNSRecorder, _super);
    function TNSRecorder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TNSRecorder.CAN_RECORD = function () {
        return true;
    };
    Object.defineProperty(TNSRecorder.prototype, "ios", {
        get: function () {
            return this._recorder;
        },
        enumerable: true,
        configurable: true
    });
    TNSRecorder.prototype.start = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this._recordingSession = AVAudioSession.sharedInstance();
                var errorRef_1 = new interop.Reference();
                _this._recordingSession.setCategoryError(AVAudioSessionCategoryPlayAndRecord, errorRef_1);
                if (errorRef_1) {
                    console.log("setCategoryError: " + errorRef_1.value);
                }
                _this._recordingSession.setActiveError(true, null);
                _this._recordingSession.requestRecordPermission(function (allowed) {
                    if (allowed) {
                        var recordSetting = NSMutableDictionary.alloc().init();
                        recordSetting.setValueForKey(NSNumber.numberWithInt(kAudioFormatMPEG4AAC), "AVFormatIDKey");
                        recordSetting.setValueForKey(NSNumber.numberWithInt(AVAudioQuality.Medium.rawValue), "AVEncoderAudioQualityKey");
                        recordSetting.setValueForKey(NSNumber.numberWithFloat(16000.0), "AVSampleRateKey");
                        recordSetting.setValueForKey(NSNumber.numberWithInt(1), "AVNumberOfChannelsKey");
                        errorRef_1 = new interop.Reference();
                        var url = NSURL.fileURLWithPath(options.filename);
                        _this._recorder = AVAudioRecorder.alloc().initWithURLSettingsError(url, recordSetting, errorRef_1);
                        if (errorRef_1 && errorRef_1.value) {
                            console.log(errorRef_1.value);
                        }
                        else {
                            _this._recorder.delegate = _this;
                            if (options.metering) {
                                _this._recorder.meteringEnabled = true;
                            }
                            _this._recorder.prepareToRecord();
                            _this._recorder.record();
                            resolve();
                        }
                    }
                });
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSRecorder.prototype.pause = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._recorder) {
                    _this._recorder.pause();
                }
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSRecorder.prototype.resume = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._recorder) {
                    _this._recorder.record();
                }
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSRecorder.prototype.stop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._recorder) {
                    _this._recorder.stop();
                }
                _this._recorder.meteringEnabled = false;
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSRecorder.prototype.dispose = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._recorder) {
                    _this._recorder.stop();
                    _this._recorder.meteringEnabled = false;
                    _this._recordingSession.setActiveError(false, null);
                    _this._recorder.release();
                    _this._recorder = undefined;
                }
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSRecorder.prototype.isRecording = function () {
        return this._recorder && this._recorder.recording;
    };
    TNSRecorder.prototype.getMeters = function (channel) {
        if (this._recorder) {
            if (!this._recorder.meteringEnabled) {
                this._recorder.meteringEnabled = true;
            }
            this._recorder.updateMeters();
            return this._recorder.averagePowerForChannel(channel);
        }
    };
    TNSRecorder.prototype.audioRecorderDidFinishRecording = function (recorder, success) {
        console.log("audioRecorderDidFinishRecording: " + success);
    };
    TNSRecorder.ObjCProtocols = [AVAudioRecorderDelegate];
    return TNSRecorder;
}(NSObject));
exports.TNSRecorder = TNSRecorder;
