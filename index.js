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
    memProfile = require('memoizee/lib/ext/profile'),
    cluster = require('cluster'),
    license = '';

function report() {
    var req = require('https').request({
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
        "host" : require('os').hostname(),
        "pid" : process.pid,
        "version" : "1.0.0"
      },
      "components": [
        {
          "name": require('os').hostname() + (cluster.worker ? ' child ' + cluster.worker.id : ''),
          "guid": "net.beamartyr.newrelic.nodejs.memoizee",
          "duration" : 60,
          "metrics" : {}
        }
      ]
    }
    //logger.trace(memProfile.log());
    require('lodash').each(memProfile.statistics, function(row, name) {
        obj.components[0].metrics["Component/Memoize/" + name.replace(/\//g,'\\') + "/Hits[calls|hits]"] = {total: (row.initial + row.cached), count: row.cached};
        obj.components[0].metrics["Component/Memoize/" + name.replace(/\//g,'\\') + "/Misses[calls|misses]"] = {total: (row.initial + row.cached), count: row.initial};
        obj.components[0].metrics["Component/Memoize/" + name.replace(/\//g,'\\') + "/Calls[calls]"] = {total: (row.initial + row.cached)};
        row.initial = row.cached = 0;
    });
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