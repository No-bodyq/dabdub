import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>(
      "permission",
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not found in request");
    }

    // Mock permission check - in production, check against actual user permissions
    const userPermissions = user.permissions || [];

    if (!userPermissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `You do not have permission: ${requiredPermission}`,
      );
    }

    return true;
  }
}
