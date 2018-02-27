"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app = require("tns-core-modules/application");
var MediaRecorder = android.media.MediaRecorder;
var TNSRecorder = (function () {
    function TNSRecorder() {
    }
    Object.defineProperty(TNSRecorder.prototype, "android", {
        get: function () {
            return this.recorder;
        },
        enumerable: true,
        configurable: true
    });
    TNSRecorder.CAN_RECORD = function () {
        var pManager = app.android.context.getPackageManager();
        var canRecord = pManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_MICROPHONE);
        if (canRecord) {
            return true;
        }
        else {
            return false;
        }
    };
    TNSRecorder.prototype.start = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this.recorder) {
                    _this.recorder.reset();
                }
                else {
                    _this.recorder = new MediaRecorder();
                }
                if (options.source) {
                    _this.recorder.setAudioSource(options.source);
                }
                else {
                    _this.recorder.setAudioSource(0);
                }
                if (options.format) {
                    _this.recorder.setOutputFormat(options.format);
                }
                else {
                    _this.recorder.setOutputFormat(0);
                }
                if (options.encoder) {
                    _this.recorder.setAudioEncoder(options.encoder);
                }
                else {
                    _this.recorder.setAudioEncoder(0);
                }
                if (options.channels) {
                    _this.recorder.setAudioChannels(options.channels);
                }
                if (options.sampleRate) {
                    _this.recorder.setAudioSamplingRate(options.sampleRate);
                }
                if (options.bitRate) {
                    _this.recorder.setAudioEncodingBitRate(options.bitRate);
                }
                _this.recorder.setOutputFile(options.filename);
                _this.recorder.setOnErrorListener(new android.media.MediaRecorder.OnErrorListener({
                    onError: function (recorder, error, extra) {
                        options.errorCallback({ recorder: recorder, error: error, extra: extra });
                    }
                }));
                _this.recorder.setOnInfoListener(new android.media.MediaRecorder.OnInfoListener({
                    onInfo: function (recorder, info, extra) {
                        options.infoCallback({ recorder: recorder, info: info, extra: extra });
                    }
                }));
                _this.recorder.prepare();
                _this.recorder.start();
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSRecorder.prototype.getMeters = function () {
        if (this.recorder != null)
            return this.recorder.getMaxAmplitude();
        else
            return 0;
    };
    TNSRecorder.prototype.pause = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this.recorder) {
                    _this.recorder.pause();
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
                if (_this.recorder) {
                    _this.recorder.resume();
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
                if (_this.recorder) {
                    _this.recorder.stop();
                }
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
                if (_this.recorder) {
                    _this.recorder.release();
                }
                _this.recorder = undefined;
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    return TNSRecorder;
}());
exports.TNSRecorder = TNSRecorder;
