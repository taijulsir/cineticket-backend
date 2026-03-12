import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google ID token obtained from the frontend Google Sign-In flow',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsString()
  @MinLength(10)
  googleToken!: string;
}
