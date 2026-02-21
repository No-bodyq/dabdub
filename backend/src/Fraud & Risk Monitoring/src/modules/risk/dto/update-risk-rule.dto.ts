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
import { PartialType } from "@nestjs/mapped-types";
import { CreateRiskRuleDto } from "./create-risk-rule.dto";

export class UpdateRiskRuleDto extends PartialType(CreateRiskRuleDto) {}
