var fs = require('fs');
var flow = require('q');
var request = require('request');

var headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.72 Safari/537.36",
    "Accept-Encoding": "gzip,deflate",
    "Accept-Language": "bg,en-GB;q=0.8,en;q=0.6",
    "Cache-Control": "max-age=0"
}

var Downloader = function (logger, rateDelay, maxAttempt) {
    this.logger = logger;
    this.lastInQueue = flow();
    this.rateDelay = typeof rateDelay == 'undefined' ? [1, 1] : (Array.isArray(rateDelay) ? rateDelay : [rateDelay, rateDelay]);
    this.maxAttempt = typeof maxAttempt == 'undefined' ? [1, 1] : maxAttempt;
}

Downloader.prototype = {

    logger: null,
    lastInQueue: null,
    rateDelay: null,
    maxAttempt: null,

    get: function (url, callback, attempt) {
        var self = this;
        return self.lastInQueue = self.lastInQueue.then(function () {
            var done = flow.defer();
            request({
                "url": url,
                "headers": headers
            }, function (err, res, html) {
                done.resolve(html)
                if (err || res.statusCode != 200) {
                    self.logger.error("Can't retrieve " + url + ", " + res.statusCode + ", err: " + res.statusCode);
                }
                if (typeof(callback) == 'function') callback(html);
            }).on('error', function (err) {
                self.logger.error("Can't retrieve " + url + ", " + err);
                if (typeof attempt != 'undefined' && attempt == self.maxAttempt) return;
                attempt = typeof attempt == 'undefined' ? 0 : attempt;
                self.get(url, callback, attempt++)
            })
            return done.promise;
        }).delay(Math.floor(Math.random() * (self.rateDelay[1] - self.rateDelay[0] + 1) + self.rateDelay[0]));
    },

    pipe: function (url, stream, attempt) {
        var self = this;
        request({
            "url": url,
            "headers": headers
        })
        .on('error', function (err) {
            self.logger.error("Can't retrieve " + url + ", " + err);
            if (typeof attempt != 'undefined' && attempt == self.maxAttempt) return;
            attempt = typeof attempt == 'undefined' ? 0 : attempt;
            self.pipe(url, stream, attempt++)
        })
        .pipe(stream)
    },

    save: function (url, destination, callback, attempt) {
        var self = this;
        request({
            "url": url,
            "headers": headers
        })
        .on('error', function (err) {
            self.logger.error("Can't retrieve " + url + ", " + err);
            if (typeof attempt != 'undefined' && attempt > 0) return;
            self.save(url, destination, callback, 1)
        })
        .pipe(fs.createWriteStream(destination)).on("finish", callback)
    }
}
exports = module.exports = Downloader;
