import * as SentryClient from '@sentry/node';
import { Jovo } from 'jovo-core';
import type { Extras } from '@sentry/types';

export class Sentry {
    jovo: Jovo;
    constructor(jovo: Jovo) {
        this.jovo = jovo;

        if (this.jovo) {
            const pluginConfig = this.jovo.$app.$plugins.get('SentryPlugin')!.config;
            SentryClient.init(pluginConfig);
        }
    }

    captureEvent(event: SentryClient.Event): string {
        return SentryClient.captureEvent(event);
    }

    captureException(exception: any): string {
        return SentryClient.captureException(exception);
    }

    captureMessage(message: string, level?: SentryClient.Severity | undefined): string {
        return SentryClient.captureMessage(message, level);
    }

    handleError(error: Error | undefined) {
        const extras = this.getExtras();

        SentryClient.configureScope((scope: SentryClient.Scope) => {
            scope.setUser({ id: this.jovo.$user.getId() });
            scope.setTag('platform', this.jovo.getPlatformType());
            scope.setTag('locale', this.jovo.getLocale() || '');
            scope.setExtras(extras);
        });

        if (this.jovo.isIntentRequest()) {
            SentryClient.addBreadcrumb({
                category: this.jovo.$type.type,
                data: this.jovo.$inputs,
                message: this.jovo.getIntentName(),
            });
        }

        SentryClient.captureException(error);
    }

    getExtras(): Extras {
        let extras: Extras = {};

        if (this.jovo) {
            const request = this.jovo.$request?.toJSON();
            extras = {
                deviceId: this.jovo.getDeviceId(),
                hasAudioInterface: this.jovo.hasAudioInterface(),
                hasScreenInterface: this.jovo.hasScreenInterface(),
                hasVideoInterface: this.jovo.hasVideoInterface(),
                sessionData: this.jovo.$session.$data,
            };

            if (request) {
                extras.context = request.context;
                extras.request = request.request || '';
                extras.sessionId = (request.session || {}).sessionId;
            }

            if (this.jovo.getRawText) {
                extras.rawText = this.jovo.getRawText();
            }
        }
        return extras;
    }
}