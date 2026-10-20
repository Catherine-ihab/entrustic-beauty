import { Controller, Post, Body } from '@nestjs/common';
import { PortalService } from './portal.service';
import { RequestPortalCodeDto, VerifyPortalCodeDto } from '@clinic/shared-types';

/**
 * Public patient-portal authentication (no guards — the OTP is the proof).
 * The console messaging driver returns a `devCode` so demos/E2E can complete
 * login without real SMS delivery.
 */
@Controller('portal/auth')
export class PortalAuthController {
  constructor(private readonly portalService: PortalService) {}

  @Post('request-code')
  requestCode(@Body() dto: RequestPortalCodeDto) {
    return this.portalService.requestCode(dto);
  }

  @Post('verify')
  verify(@Body() dto: VerifyPortalCodeDto) {
    return this.portalService.verify(dto);
  }
}
