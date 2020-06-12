import { BaseApp, HandleRequest, Plugin, PluginConfig } from 'jovo-core';
import { Sentry } from './Sentry';

export interface Config extends PluginConfig {
    dsn?: string,
    debug?: boolean,
    release?: string,
    environment?: string,
    maxBreadcrumbs?: number,
    sampleRate?: number,
    attachStacktrace?: boolean,
    serverName?: string,
}

declare module 'jovo-core/dist/src/core/Jovo' {
    export interface Jovo {
        $sentry: Sentry;
    }
}

export class SentryPlugin implements Plugin {
    config: Config = {
    };

    constructor(config?: Config) {
        if (config) {
            this.config = {
                ...this.config,
                ...config,
            };
        }
    }

    install(app: BaseApp) {
        app.middleware('after.platform.init')!.use(this.initHandler.bind(this));
        app.middleware('fail')!.use(this.errorHandler.bind(this));
        app.middleware('platform.nlu')!.use(this.endReasonHandler.bind(this));
    }

    private initHandler(handleRequest: HandleRequest) {
        const { jovo } = handleRequest;
        if (!jovo) {
          return;
        }
        jovo.$sentry = new Sentry(jovo);
    }

    private errorHandler(handleRequest: HandleRequest) {
        const { jovo } = handleRequest;

        if (!jovo) {
            return;
        }

        if (!jovo.$sentry) {
            return;
        }

        jovo.$sentry.handleError(handleRequest.error);
    }

    private endReasonHandler(handleRequest: HandleRequest) {
        const { jovo } = handleRequest;

        if (!jovo) {
            return;
        }

        const request = jovo?.$request?.toJSON();

        if (handleRequest.jovo?.constructor.name === 'AlexaSkill') {
            if (request?.request.reason === 'ERROR') {
                this.errorHandler(handleRequest);
            }
        }
    }
}
