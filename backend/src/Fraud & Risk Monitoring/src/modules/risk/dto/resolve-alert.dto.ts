import { IsString, IsEnum, MinLength, Length } from "class-validator";
import { AlertActionType } from "../enums";

export class ResolveAlertDto {
  @IsString()
  @MinLength(20)
  resolution: string;

  @IsEnum(AlertActionType)
  action: AlertActionType;
}
