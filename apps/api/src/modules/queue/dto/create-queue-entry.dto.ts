import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQueueEntryDto {
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsNotEmpty()
  patientName: string;

  @IsString()
  @IsNotEmpty()
  patientPhone: string;

  @IsString()
  @IsOptional()
  patientNumber?: string;

  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsString()
  @IsNotEmpty()
  serviceCategory: string;

  @IsString()
  @IsOptional()
  packageName?: string;

  @IsInt()
  @IsOptional()
  packageSessionNumber?: number;

  @IsInt()
  @IsOptional()
  packageTotalSessions?: number;

  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsBoolean()
  isPaid: boolean;

  @IsString()
  @IsNotEmpty()
  scheduledTime: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  practitioner?: string;

  @IsString()
  @IsOptional()
  doctorNotes?: string;
}
