import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/prisma';
import { RegisterDto } from './dto';
import { AuthProvider } from '@prisma/client';

interface GoogleUserData {
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        provider: AuthProvider.LOCAL,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return { user, tokens };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }

  async login(user: { id: string; email: string }) {
    const tokens = await this.generateTokens(user.id, user.email);

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return { user: fullUser, tokens };
  }

  async validateGoogleUser(data: GoogleUserData) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { provider: AuthProvider.GOOGLE, providerId: data.providerId },
          { email: data.email },
        ],
      },
    });

    if (user) {
      // Update existing user with Google info if they signed up with email first
      if (user.provider === AuthProvider.LOCAL) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            provider: AuthProvider.GOOGLE,
            providerId: data.providerId,
            avatar: data.avatar || user.avatar,
            emailVerified: true,
          },
        });
      }
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          provider: AuthProvider.GOOGLE,
          providerId: data.providerId,
          emailVerified: true,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }

  async googleLogin(user: { id: string; email: string }) {
    return this.login(user);
  }

  async refreshTokens(userId: string, oldRefreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { token: oldRefreshToken },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return { user, tokens };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Revoke specific refresh token
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresIn as `${number}m`,
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    // Encode refresh token in JWT for validation
    const signedRefreshToken = this.jwtService.sign(
      { sub: userId, email, token: refreshToken },
      { expiresIn: `${this.REFRESH_TOKEN_EXPIRY_DAYS}d` as `${number}d` },
    );

    return {
      accessToken,
      refreshToken: signedRefreshToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
