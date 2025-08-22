import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { UserType } from '../entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (user.type_utilisateur !== UserType.ADMIN) {
      throw new ForbiddenException('Accès interdit - Droits administrateur requis');
    }

    return true;
  }
}
