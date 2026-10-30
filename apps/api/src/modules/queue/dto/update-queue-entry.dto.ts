import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateQueueEntryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  practitioner?: string;

  @IsString()
  @IsOptional()
  doctorNotes?: string;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
}
