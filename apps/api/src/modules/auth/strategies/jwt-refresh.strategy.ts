import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '@/prisma';

// Custom extractor that checks cookie first, then body
function extractRefreshToken(req: Request): string | null {
  // First try to get from cookie
  if (req.cookies?.refreshToken) {
    return req.cookies.refreshToken;
  }
  // Fallback to body for backwards compatibility
  if (req.body?.refreshToken) {
    return req.body.refreshToken;
  }
  return null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extractRefreshToken,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string; token: string }) {
    // The payload.token contains the UUID stored in the database
    const tokenUuid = payload.token;

    if (!tokenUuid) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenUuid },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (storedToken.userId !== payload.sub) {
      throw new UnauthorizedException('Token mismatch');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      refreshToken: tokenUuid,
    };
  }
}
