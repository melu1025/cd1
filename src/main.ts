import {
    DocumentBuilder,
    type SwaggerCustomOptions,
    SwaggerModule,
} from '@nestjs/swagger';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
// relativer Import
import { AppModule } from './app.module.js';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { corsOptions } from './config/cors.options.js';
import { helmetHandlers } from './security/http/helmet.handler.js';
import { nodeConfig } from './config/node.js';
import { paths } from './config/paths.js';

// Destructuring ab ES 2015
const { httpsOptions, port } = nodeConfig;

// "Arrow Function" ab ES 2015
const setupSwagger = (app: INestApplication) => {
    const config = new DocumentBuilder()
        .setTitle('cd')
        .setDescription('Beispiel für Software Engineering')
        .setVersion('2023.10.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    const options: SwaggerCustomOptions = {
        customSiteTitle: 'SWE 23/24',
    };
    SwaggerModule.setup(paths.swagger, app, document, options);
};

// Promise ab ES 2015, vgl: Future in Java
// async/await ab ES 2017, vgl: C#
const bootstrap = async () => {
    const app = await NestFactory.create(AppModule, { httpsOptions }); // "Shorthand Properties" ab ES 2015

    // https://docs.nestjs.com/security/helmet
    // compression von Express fuer GZip-Komprimierung
    // Default "Chunk Size" ist 16 KB: https://github.com/expressjs/compression#chunksize
    app.use(helmetHandlers, compression());

    // https://docs.nestjs.com/techniques/validation
    // https://docs.nestjs.com/exception-filters
    app.useGlobalPipes(new ValidationPipe());

    setupSwagger(app);

    // cors von Express fuer CORS (= cross origin resource sharing)
    app.enableCors(corsOptions);

    await app.listen(port);
};

// Top-level await ab ES 2020
await bootstrap();
