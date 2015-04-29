var ssi = require("ssi");
exports = module.exports = function frontend() {
	"use strict";

	var send = require("send");
	var pause = require("pause");
	var url = require("url");
	var path = require("path");

	var RE_STRIP = /:\d+$/;
	var RE_HOST = /\./;

	var roots = Array.prototype.slice.call(arguments);

	return function (request, response, next) {


		var pathname = url.parse(request.url).pathname;

		//ssi involve
		if (/\/crc-ui\//.test(pathname)) {
				var m = pathname.match(/\/_shared\/\w*?[-_]\w*\/snapshot\//);
				if (m[0]) {
					var ssi_path = '/Users/miukki/Sites/Server/root/localnet.englishtown.com' + m[0];
					console.log('ssi_path', ssi_path);
					var inputDirectory = ssi_path;
					var outputDirectory = ssi_path;
					var matcher = "/**/*.html";
					var includes = new ssi(inputDirectory, outputDirectory, matcher);
					includes.compile();
				}
		}

		var method = request.method;
		if (method !== "GET" && method !== "HEAD") {
			return next();
		}

		var paused = pause(request);
		var hostname_parts = request.headers.host.replace(RE_STRIP, "").split(RE_HOST);

		hostname_parts.forEach(function (candidate, index) {
			hostname_parts[index] = hostname_parts.slice(index).join(".");
		});

		hostname_parts.push("");

		var candidates = roots.map(function (root) {
			return hostname_parts.map(function (hostname) {
				return path.join(root, hostname);
			});
		}).reduce(function (a, b) {
			return a.concat(b);
		});

		function serve() {
			var candidate = candidates.shift();

			if (candidate) {
				send(request, pathname)
					.root(candidate)
					.on("error", serve)
					.pipe(response);
			}
			else {
				next();
				paused.resume();
			}
		}

		serve();
	};
};
