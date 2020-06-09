import * as Sentry from '@sentry/node';
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

    captureEvent(event: Sentry.Event): string {
        return Sentry.captureEvent(event);
    }

    captureException(exception: any): string {
        return Sentry.captureException(exception);
    }

    captureMessage(message: string, level?: Sentry.Severity | undefined): string {
        return Sentry.captureMessage(message, level);
    }


    install(app: BaseApp) {
        (Jovo.prototype as any).$sentry = this;

        app.middleware('fail')!.use(this.errorHandler.bind(this));
        app.middleware('platform.nlu')!.use(this.endReasonHandler.bind(this));

        Sentry.init(this.config);
    }

    private errorHandler(handleRequest: HandleRequest) {
        const { jovo } = handleRequest;

        if (!jovo) {
            return;
        }

        const extras = this.getExtras(jovo);

        Sentry.configureScope((scope: Sentry.Scope) => {
            scope.setUser({ id: jovo.$user.getId() });
            scope.setTag('platform', jovo.getPlatformType());
            scope.setTag('locale', jovo.getLocale() || '');
            scope.setExtras(extras);
        });

        if (jovo.isIntentRequest()) {
            Sentry.addBreadcrumb({
                category: jovo.$type.type,
                data: jovo.$inputs,
                message: jovo.getIntentName(),
            });
        }

        Sentry.captureException(handleRequest.error);
    }

    private endReasonHandler(handleRequest: HandleRequest) {
        const { jovo } = handleRequest;

        if (!jovo) {
            return;
        }

        // (jovo as any).$sentry = this;

        const request = jovo?.$request?.toJSON();

        if (handleRequest.jovo?.constructor.name === 'AlexaSkill') {
            if (request?.request.reason === 'ERROR') {
                this.errorHandler(handleRequest);
            }
        }
    }

    private getExtras(jovo: Jovo): object {
        const request = jovo.$request?.toJSON();
        const extras: any = {
            deviceId: jovo.getDeviceId(),
            hasAudioInterface: jovo.hasAudioInterface(),
            hasScreenInterface: jovo.hasScreenInterface(),
            hasVideoInterface: jovo.hasVideoInterface(),
            sessionData: jovo.$session.$data,
        };

        if (request) {
            extras.context = request.context;
            extras.request = request.request || '';
            extras.sessionId = (request.session || {}).sessionId;
        }

        if (jovo.constructor.name === 'AutopilotBot') {
            extras.rawText = jovo.getRawText();
        }

        return extras;
    }


}
