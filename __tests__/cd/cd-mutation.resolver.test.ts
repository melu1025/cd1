import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type GraphQLRequest } from '@apollo/server';
import { type GraphQLResponseBody } from './cd-query.resolver.test.js';
import { HttpStatus } from '@nestjs/common';
import { loginGraphQL } from '../login.js';

// eslint-disable-next-line jest/no-export
export type GraphQLQuery = Pick<GraphQLRequest, 'query'>;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Mutations', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    // -------------------------------------------------------------------------
    test('Neue CD', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            isrc: "DEEGM7234823",
                            bewertung: 5,
                            genre: HIPHOP,
                            preis: 33.33,
                            verfuegbar: true,
                            erscheinungsdatum: "2022-03-03",
                            titel: "To Pimp a Butterfly",
                            interpret: "Kendrick Lamar",
                            laenge: 53.2,
                            lieder: [
                                {
                                    liedTitel: "King Kunta",
                                    liedLaenge: 3.42,
                                },
                            ],
                        }
                    ) {
                        id
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); // eslint-disable-line sonarjs/no-duplicate-string
        expect(data.data).toBeDefined();

        const { create } = data.data!;

        // Der Wert der Mutation ist die generierte ID
        expect(create).toBeDefined();
        expect(create.id).toBeGreaterThan(0);
    });

    // -------------------------------------------------------------------------
    // eslint-disable-next-line max-lines-per-function
    test('CD mit ungueltigen Werten neu anlegen', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
            mutation {
                create(
                  input: {
                    isrc: "falsch",
                    bewertung: -5,
                    genre: POP,
                    preis: -33.33,
                    verfuegbar: true,
                    erscheinungsdatum: "202",
                    titel: "DAMN",
                    interpret: "Kendrick Lamar",
                    laenge: 43,
                    lieder: [{
                         liedTitel: "DNA",
                         liedLaenge: 2.5,
                          },],
                  }
                ) {
                    id
                }
              }
                
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^isrc /u),
            expect.stringMatching(/^bewertung /u),
            expect.stringMatching(/^preis /u),
            expect.stringMatching(/^erscheinungsdatum /u),
        ];

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.create).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;

        expect(error).toBeDefined();

        const { message } = error;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    // -------------------------------------------------------------------------
    test('Neues Buch nur als "admin"/"fachabteilung"', async () => {
        // given
        const token = await loginGraphQL(client, 'adriana.alpha', 'p');
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            isrc: "GBEGM724823",
                            bewertung: 5,
                            genre: HIPHOP,
                            preis: 33.33,
                            verfuegbar: true,
                            erscheinungsdatum: "2022-03-03",
                            titel: "DAMN",
                            interpret: "Kendrick Lamar",
                            laenge: 54.5,
                            lieder: [
                                {
                                    liedTitel: "DNA",
                                    liedLaenge: 32.5,
                                },
                            ],
                        }
                    ) {
                        id
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, extensions } = error;

        expect(message).toBe('Forbidden resource');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });
});
