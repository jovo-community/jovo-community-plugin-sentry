import { addBreadcrumb, captureException, configureScope, init, Scope } from '@sentry/node';
import { BaseApp, HandleRequest, Jovo, Plugin, PluginConfig } from 'jovo-core';

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
        app.middleware('fail')!.use(this.errorHandler.bind(this));
        app.middleware('platform.nlu')!.use(this.endReasonHandler.bind(this));

        init(this.config);
    }

    errorHandler(handleRequest: HandleRequest) {
        const { jovo } = handleRequest;

        if (!jovo) {
            return;
        }

        const extras = this.getExtras(jovo);

        configureScope((scope: Scope) => {
            scope.setUser({ id: jovo.getUserId() });
            scope.setTag('platform', jovo.getPlatformType());
            scope.setTag('locale', jovo.getLocale() || '');
            scope.setExtras(extras);
        });

        if (jovo.isIntentRequest()) {
            addBreadcrumb({
                category: jovo.$type.type,
                data: jovo.$inputs,
                message: jovo.getIntentName(),
            });
        }

        captureException(handleRequest.error);
    }

    endReasonHandler(handleRequest: HandleRequest) {
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

    getExtras(jovo: Jovo): object {
        let extras = {};

        if (jovo.constructor.name === 'AlexaSkill') {
            const request = jovo.$request?.toJSON();

            if (request) {
                extras = {
                    context: request.context,
                    hasAudioInterface: jovo.hasAudioInterface(),
                    hasScreenInterface: jovo.hasScreenInterface(),
                    request: request.request || '',
                    sessionData: jovo.$session.$data,
                    sessionId: (request.session || {}).sessionId,
                };
            }
        }

        return extras;
    }
}
