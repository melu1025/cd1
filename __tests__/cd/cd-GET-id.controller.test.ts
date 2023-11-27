import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type CdModel } from '../../src/cd/rest/cd-get.controller.js';
import { type ErrorResponse } from './error-response.js';
import { HttpStatus } from '@nestjs/common';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';
const idNichtVorhanden = '999999';
const idVorhandenETag = '1';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /rest/:id', () => {
    let client: AxiosInstance;

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('CD zu vorhandener ID', async () => {
        // given
        const url = `/${idVorhanden}`;

        // when
        const response: AxiosResponse<CdModel> = await client.get(url);

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        // eslint-disable-next-line no-underscore-dangle
        const selfLink = data._links.self.href;

        // eslint-disable-next-line security-node/non-literal-reg-expr
        expect(selfLink).toMatch(new RegExp(`${url}$`, 'u'));
    });

    test('Keine CD zu nicht-vorhandener ID', async () => {
        // given
        const url = `/${idNichtVorhanden}`;

        // when
        const response: AxiosResponse<ErrorResponse> = await client.get(url);

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, message, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(message).toEqual(expect.stringContaining(message));
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test('CD zu vorhandener ID mit ETag', async () => {
        // given
        const url = `/${idVorhandenETag}`;

        // when
        const response: AxiosResponse<string> = await client.get(url, {
            headers: { 'If-None-Match': '"0"' }, // eslint-disable-line @typescript-eslint/naming-convention
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_MODIFIED);
        expect(data).toBe('');
    });
});
