import {
  IsString,
  IsEnum,
  IsObject,
  IsBoolean,
  IsOptional,
  MinLength,
} from "class-validator";
import { RiskRuleType, RiskSeverity } from "../enums";
import { RiskCondition } from "../interfaces";

export class CreateRiskRuleDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsEnum(RiskRuleType)
  ruleType: RiskRuleType;

  @IsObject()
  conditions: RiskCondition;

  @IsEnum(RiskSeverity)
  severity: RiskSeverity;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  autoBlock?: boolean;
}
