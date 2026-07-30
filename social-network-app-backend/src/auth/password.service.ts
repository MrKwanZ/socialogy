import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  /** Match Express backend: bcryptjs cost factor 12. */
  private readonly saltRounds = 12;

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
