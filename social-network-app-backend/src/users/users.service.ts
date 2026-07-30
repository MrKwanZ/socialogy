import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      name: data.name,
      password: data.password,
    });
    return this.usersRepository.save(user);
  }

  async updateStatus(userId: string, status: string): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }
    user.status = status;
    return this.usersRepository.save(user);
  }
}
