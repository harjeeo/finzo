import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_ACCOUNTS } from '../accounting/default-accounts.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './types/jwt-payload.type.js';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const { user, business } = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
        },
      });

      const createdBusiness = await tx.business.create({
        data: {
          name: dto.businessName,
        },
      });

      await tx.membership.create({
        data: {
          userId: createdUser.id,
          businessId: createdBusiness.id,
          role: 'OWNER',
        },
      });

      await tx.branch.create({
        data: {
          businessId: createdBusiness.id,
          name: 'Main Branch',
          isDefault: true,
        },
      });

      await tx.account.createMany({
        data: DEFAULT_ACCOUNTS.map((a) => ({
          businessId: createdBusiness.id,
          code: a.code,
          name: a.name,
          type: a.type,
          isSystem: true,
        })),
      });

      return { user: createdUser, business: createdBusiness };
    });

    return this.buildTokens({
      sub: user.id,
      email: user.email,
      businessId: business.id,
      role: 'OWNER',
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const primaryMembership = user.memberships[0];

    return this.buildTokens({
      sub: user.id,
      email: user.email,
      businessId: primaryMembership?.businessId ?? null,
      role: primaryMembership?.role ?? null,
    });
  }

  private buildTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
      ) as SignOptions['expiresIn'],
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) as SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }
}
