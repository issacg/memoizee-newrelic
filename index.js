// Copyright 2014 - Issac Goldstand
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var logger = require('log4js').getLogger('memoizee-newrelic'),
    _ = require('lodash'),
    memProfile = require('memoizee/profile'),
    pkg = require('./package.json'),
    os = require('os'),
    https = require('https'),
    license = '';

function report() {
    var req = https.request({
        hostname: 'platform-api.newrelic.com',
        port: 443,
        method: 'POST',
        path: '/platform/v1/metrics',
        headers: {'Content-Type': 'application/json','Accept': 'application/json', 'X-License-Key': license}
    }, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          logger.trace('NR BODY: ' + chunk);
        });
    });
    var obj = {
      "agent": {
        "host" : os.hostname(),
        "pid" : process.pid,
        "version" : pkg.version
      },
      "components": [
        {
          "name": os.hostname(),
          "guid": "net.beamartyr.newrelic.nodejs.memoizee",
          "duration" : 60,
          "metrics" : {}
        }
      ]
    }
    //logger.trace(memProfile.log());
    var totalHits = 0,
        totalMisses = 0,
        totalCalls = 0,
        totalFuncs = 0;
    require('lodash').each(memProfile.statistics, function(row, name) {
        // Summarize
        var report_name = name.replace(/\//g,'\\');
        var hits = parseInt(row.cached);
        var misses = parseInt(row.initial);
        var calls = hits + misses;
        // Report
        obj.components[0].metrics["Component/Memoize/Functions/" + report_name + "/Hits[hits|calls]"] = {total: hits, count: calls};
        obj.components[0].metrics["Component/Memoize/Functions/" + report_name + "/Misses[misses|calls]"] = {total: misses, count: calls};
        // Aggregates
        totalHits += hits;
        totalMisses += misses;
        totalCalls += calls;
        totalFuncs += 1;
        // Reset
        row.initial = row.cached = 0;
    });
    obj.components[0].metrics["Component/Memoize/Total/Functions[functions]"] = {total: totalFuncs};
    obj.components[0].metrics["Component/Memoize/Total/Hits[hits|calls]"] = {total: totalHits, count: totalCalls};
    obj.components[0].metrics["Component/Memoize/Total/Misses[misses|calls]"] = {total: totalMisses, count: totalCalls};
    req.write(JSON.stringify(obj));
    logger.trace(JSON.stringify(obj));
    req.end();
}

function init(License) {
    license = License;
    report();
    setInterval(report, 60000);
}

module.exports = init;