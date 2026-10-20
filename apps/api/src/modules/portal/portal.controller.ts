import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { TelemedicineService, TelemedViewer } from '../telemedicine/telemedicine.service';
import { MeasurementsService } from '../medical-records/measurements.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import {
  BookAppointmentDto,
  PostSignalDto,
} from '@clinic/shared-types';

/**
 * Authenticated patient-portal API. JwtTenantGuard binds the tenant from the
 * patient JWT; the service asserts `type === 'patient'` so staff tokens (or
 * any non-patient token) are rejected with 403. No permission guard here —
 * patients have no permission grants; the patient identity is the scope.
 */
@Controller('portal')
@UseGuards(JwtTenantGuard)
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly telemedicineService: TelemedicineService,
    private readonly measurementsService: MeasurementsService,
  ) {}

  private ctx(req: any): { clinicId: string; patientId: string; viewer: TelemedViewer } {
    const u = req.user;
    if (u?.type !== 'patient' || !u.clinic_id || !u.patient_id) {
      // Staff/platform tokens fail here — the portal is patient-scoped only.
      throw new ForbiddenException('Patient portal access required');
    }
    return {
      clinicId: u.clinic_id,
      patientId: u.patient_id,
      viewer: { type: 'patient', id: u.patient_id },
    };
  }

  // ─── PROFILE ───────────────────────────────────────────────────────────────

  @Get('me')
  me(@Req() req: any) {
    const { clinicId, patientId } = this.ctx(req);
    return this.portalService.getMe(clinicId, patientId);
  }

  // ─── DIRECTORY (for booking) ───────────────────────────────────────────────

  @Get('providers')
  providers(@Req() req: any) {
    const { clinicId } = this.ctx(req);
    return this.portalService.listProviders(clinicId);
  }

  @Get('services')
  services(@Req() req: any) {
    const { clinicId } = this.ctx(req);
    return this.portalService.listServices(clinicId);
  }

  // ─── APPOINTMENTS ──────────────────────────────────────────────────────────

  @Get('appointments')
  appointments(@Query('scope') scope: string | undefined, @Req() req: any) {
    const { clinicId, patientId } = this.ctx(req);
    return this.portalService.listAppointments(clinicId, patientId, scope ?? 'upcoming');
  }

  @Post('appointments')
  book(@Body() dto: BookAppointmentDto, @Req() req: any) {
    const { clinicId, patientId } = this.ctx(req);
    return this.portalService.book(clinicId, patientId, dto);
  }

  // ─── RECORDS ───────────────────────────────────────────────────────────────

  @Get('prescriptions')
  prescriptions(@Req() req: any) {
    const { clinicId, patientId } = this.ctx(req);
    return this.portalService.listPrescriptions(clinicId, patientId);
  }

  @Get('lab-results')
  labResults(@Req() req: any) {
    const { clinicId, patientId } = this.ctx(req);
    return this.portalService.listLabResults(clinicId, patientId);
  }

  @Get('invoices')
  invoices(@Req() req: any) {
    const { clinicId, patientId } = this.ctx(req);
    return this.portalService.listInvoices(clinicId, patientId);
  }

  // ─── VITALS (patient's own measurement trends) ────────────────────

  @Get('vitals')
  vitals(@Query('days') days: string | undefined, @Req() req: any) {
    const { clinicId, patientId } = this.ctx(req);
    return this.measurementsService.trends(clinicId, patientId, { days });
  }

  // ─── TELEMEDICINE ROOM (patient side) ──────────────────────────────────────

  @Get('rooms/:appointmentId')
  roomState(@Param('appointmentId') appointmentId: string, @Req() req: any) {
    const { clinicId, viewer } = this.ctx(req);
    return this.telemedicineService.getRoomState(clinicId, appointmentId, viewer);
  }

  @Post('rooms/:appointmentId/join')
  join(@Param('appointmentId') appointmentId: string, @Req() req: any) {
    const { clinicId, viewer } = this.ctx(req);
    return this.telemedicineService.join(clinicId, appointmentId, viewer);
  }

  @Post('rooms/:appointmentId/leave')
  leave(@Param('appointmentId') appointmentId: string, @Req() req: any) {
    const { clinicId, viewer } = this.ctx(req);
    return this.telemedicineService.leave(clinicId, appointmentId, viewer);
  }

  @Get('rooms/:appointmentId/signals')
  listSignals(
    @Param('appointmentId') appointmentId: string,
    @Query('after') after: string | undefined,
    @Req() req: any,
  ) {
    const { clinicId, viewer } = this.ctx(req);
    return this.telemedicineService.listSignals(
      clinicId,
      appointmentId,
      viewer,
      Number(after ?? 0),
    );
  }

  @Post('rooms/:appointmentId/signals')
  postSignal(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: PostSignalDto,
    @Req() req: any,
  ) {
    const { clinicId, viewer } = this.ctx(req);
    return this.telemedicineService.postSignal(clinicId, appointmentId, viewer, dto);
  }
}
