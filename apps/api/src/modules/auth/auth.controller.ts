import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, TokensDto } from './dto';
import { LocalAuthGuard, JwtAuthGuard, JwtRefreshGuard, GoogleAuthGuard } from './guards';
import { Public, CurrentUser } from './decorators';
import { ConfigService } from '@nestjs/config';

// Cookie configuration
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Use 'lax' for cross-origin requests between frontend (3000) and backend (4000)
  // 'strict' blocks cookies on cross-origin requests which breaks refresh token flow
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
};

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: string;
  emailVerified: boolean;
  createdAt: Date;
}

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

interface RequestWithRefresh extends Request {
  user: {
    sub: string;
    email: string;
    refreshToken: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return result;
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return result;
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokens(@Req() req: RequestWithRefresh, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshTokens(req.user.sub, req.user.refreshToken);

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken;

    // Clear the cookie
    res.clearCookie('refreshToken', { path: '/' });

    return this.authService.logout(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  // Google OAuth routes
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: RequestWithUser & { query: { state?: string } }, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    // Redirect to frontend with access token only (refresh token is in cookie)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUrl = new URL('/auth/callback', frontendUrl);
    redirectUrl.searchParams.set('accessToken', result.tokens.accessToken);

    // Preserve OAuth state for CSRF protection
    const state = req.query.state;
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return res.redirect(redirectUrl.toString());
  }
}
