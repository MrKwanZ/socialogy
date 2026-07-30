import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { TypedConfigService } from './config/typed-config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const config = app.get(TypedConfigService);
  const appConfig = config.get('app', { infer: true })!;
  const imagesDir = join(process.cwd(), appConfig.uploadPath);

  mkdirSync(imagesDir, { recursive: true });
  app.useStaticAssets(imagesDir, {
    prefix: `/${appConfig.uploadPath}`,
  });

  app.enableCors({
    origin:
      appConfig.corsOrigin === '*'
        ? true
        : appConfig.corsOrigin.split(',').map((origin) => origin.trim()),
    methods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Auth/post inputs use manual validation messages for the API contract.
      // whitelist would strip undecorated GraphQL InputType fields.
      whitelist: false,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(appConfig.port);
  logger.log(`Nest backend listening on http://localhost:${appConfig.port}`);
  logger.log(`GraphQL endpoint: http://localhost:${appConfig.port}/graphql`);
  logger.log(`Health endpoint: http://localhost:${appConfig.port}/health`);
  logger.log(
    `Upload endpoint: PUT http://localhost:${appConfig.port}/post-image`,
  );
}

void bootstrap();
