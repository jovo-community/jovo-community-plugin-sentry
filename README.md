# jovo-plugin-sentry

## Overview
This plugin for the [Jovo Framework](https://github.com/jovotech/jovo-framework) allows you to easily add error monitoring with [Sentry](https://sentry.io) to your voice projects.

## Platforms
The following platforms are supported:
* Amazon Alexa
* Google Assistant
* Samsung Bixby

## Install
Install the plugin into your Jovo project:

`npm install jovo-plugin-sentry --save`

Use the plugin in:

app.js:
```javascript
const { Sentry } = require('jovo-plugin-sentry');


app.use(
    // ... base imports
    new Sentry()
);
```


app.ts:
```typescript
import { Sentry } from 'jovo-plugin-sentry';

app.use(
    // ... base imports
    new Sentry()
);
```

## Configuration

Refer to the Sentry documentation on [Configuration](https://docs.sentry.io/error-reporting/configuration/?platform=node).

config.js or config.ts:
```javascript
    SentryPlugin: {
        dsn: 'https://sample@sentry.io/0000000', // or set SENTRY_DSN
        environment: process.env.STAGE, //or set SENTRY_ENVIRONMENT
        debug: false,
        release: 'voice-app@1.0.0', //or set SENTRY_RELEASE
    },
```

# License

MIT