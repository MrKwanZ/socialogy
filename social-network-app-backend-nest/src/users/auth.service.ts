import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import validator from 'validator';
import { ValidationErrorItem } from '../common/errors/app.error';
import { raiseAppError } from '../common/errors/raise-app-error';
import { PasswordService } from '../auth/password.service';
import { GqlContext, JwtPayload } from '../auth/auth.types';
import { TypedConfigService } from '../config/typed-config.service';
import { UsersService } from './users.service';
import { UserInputData } from './graphql/user-input.input';
import { UserType } from './graphql/user.type';
import { AuthDataType } from './graphql/auth-data.type';
import { toUserType } from '../common/mappers/graphql.mappers';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: TypedConfigService,
  ) {}

  async createUser(userInput: UserInputData): Promise<UserType> {
    const errors: ValidationErrorItem[] = [];

    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'E-Mail is invalid.' });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password too short!' });
    }

    if (errors.length > 0) {
      raiseAppError('Invalid input.', 422, errors);
    }

    const existingUser = await this.usersService.findByEmail(userInput.email);
    if (existingUser) {
      raiseAppError('User exists already!');
    }

    const hashedPassword = await this.passwordService.hash(userInput.password);
    const created = await this.usersService.create({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    });

    return toUserType(created);
  }

  async login(email: string, password: string): Promise<AuthDataType> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      raiseAppError('User not found.', 401);
    }

    const isEqual = await this.passwordService.verify(password, user.password);
    if (!isEqual) {
      raiseAppError('Password is incorrect.', 401);
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    const authConfig = this.config.get('auth', { infer: true })!;
    const token = await this.jwtService.signAsync(payload, {
      secret: authConfig.jwt.secret,
      expiresIn: authConfig.jwt
        .expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    return { token, userId: user.id };
  }

  async currentUser(ctx: GqlContext): Promise<UserType> {
    const userId = this.requireAuth(ctx);
    const user = await this.usersService.findById(userId);
    if (!user) {
      raiseAppError('No user found!', 404);
    }
    return toUserType(user);
  }

  async updateStatus(status: string, ctx: GqlContext): Promise<UserType> {
    const userId = this.requireAuth(ctx);
    const saved = await this.usersService.updateStatus(userId, status);
    if (!saved) {
      raiseAppError('No user found!', 404);
    }
    return toUserType(saved);
  }

  requireAuth(ctx: GqlContext): string {
    if (!ctx.isAuth || !ctx.userId) {
      raiseAppError('Not authenticated!', 401);
    }
    return ctx.userId;
  }
}
