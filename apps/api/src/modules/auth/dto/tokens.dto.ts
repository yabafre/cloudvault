import { ApiProperty } from '@nestjs/swagger';

export class TokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  refreshToken: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: TokensDto })
  tokens: TokensDto;
}
