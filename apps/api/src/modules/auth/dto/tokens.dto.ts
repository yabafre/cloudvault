export class TokensDto {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: string;
  emailVerified: boolean;
  createdAt: Date;
}

export class AuthResponseDto {
  user: UserResponseDto;
  tokens: TokensDto;
}
