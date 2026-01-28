import { Injectable } from '@nestjs/common';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ANALYTICS_CONSTANTS, ERROR_MESSAGES } from '../constants/analytics.constants';

/**
 * Custom validator for date ranges
 * Ensures end date is after start date and range is within limits
 */
@ValidatorConstraint({ name: 'DateRangeValidator', async: false })
@Injectable()
export class DateRangeValidator implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const object = args.object as any;
    const startDate = object.startDate;

    if (!startDate || !endDate) {
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // Check if end is after start
    if (end <= start) {
      return false;
    }

    // Check if range is within limits
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > ANALYTICS_CONSTANTS.MAX_DATE_RANGE_DAYS) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as any;
    const startDate = object.startDate;
    const endDate = args.value;

    if (!startDate || !endDate) {
      return 'Both start date and end date are required';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return ERROR_MESSAGES.INVALID_DATE_RANGE;
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > ANALYTICS_CONSTANTS.MAX_DATE_RANGE_DAYS) {
      return ERROR_MESSAGES.DATE_RANGE_TOO_LARGE;
    }

    return 'Invalid date range';
  }
}
