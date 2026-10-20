import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto, LoginResponseDto } from '@clinic/shared-types';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { TENANT_SLUG_KEY } from '../../common/middleware/tenant-resolution.middleware';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cls: ClsService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginRequestDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const slug = this.cls.get<string>(TENANT_SLUG_KEY);
    return this.authService.validateAndLogin(dto, slug);
  }
}
