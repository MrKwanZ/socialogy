import 'dotenv/config';

import path from 'path';
import express, {
  ErrorRequestHandler,
  Request,
  Response
} from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import multer, { FileFilterCallback } from 'multer';
import { createHandler, HandlerOptions } from 'graphql-http/lib/use/express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';

import graphqlSchema from './graphql/schema';
import graphqlResolver from './graphql/resolvers';
import auth from './middleware/auth';
import { clearImage } from './util/file';
import { getRootDir } from './util/paths';
import { AppError } from './types/errors';

const app = express();
const rootDir = getRootDir();
const imagesDir = path.join(rootDir, 'images');

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imagesDir);
  },
  filename: (_req, _file, cb) => {
    cb(null, `${uuidv4()}-.jpg`);
  }
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter }).single('image')
);
app.use('/images', express.static(imagesDir));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided!' });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(201).json({
    message: 'File stored.',
    filePath: path.relative(rootDir, req.file.path).replace('\\', '/')
  });
});

const formatGraphqlError = (
  err: Readonly<GraphQLError | Error>
): GraphQLFormattedError & { status?: number; data?: AppError['data'] } => {
  if (!(err instanceof GraphQLError)) {
    return { message: err.message };
  }

  const originalError = err.originalError;
  if (!originalError) {
    return err;
  }

  const message = err.message || 'An error occurred.';
  const code =
    originalError instanceof AppError ? originalError.code : 500;
  const data =
    originalError instanceof AppError ? originalError.data : undefined;

  return { message, status: code, data };
};

type GraphqlContext = Request & Record<PropertyKey, unknown>;

app.all(
  '/graphql',
  createHandler<GraphqlContext>({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    context: (req) => req.raw as GraphqlContext,
    formatError: ((err) => formatGraphqlError(err)) as HandlerOptions['formatError']
  })
);

const errorHandler: ErrorRequestHandler = (
  error: Error & { statusCode?: number; data?: unknown; code?: number },
  _req,
  res,
  _next
) => {
  console.log(error);
  const status = error.statusCode ?? error.code ?? 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
};

app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT) || 8080;

  mongoose
    .connect(process.env.MONGODB_URI as string)
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((err) => console.log(err));
}

export = app;
