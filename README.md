# memoizee-newrelic
## NewRelic Plug-In for the memoizee library

See https://github.com/medikoo/memoize

### Summary

```javascript
require('memoizee-newrelic')('NEWRELIC-LICENSE-KEY');
var memoize = require('memoizee');

var fn = function (one, two, three) { /* ... */ };

memoized = memoize(fn);

memoized('foo', 3, 'bar');
```

Every 60 seconds, this will report the cache information to your NewRelic dashboard