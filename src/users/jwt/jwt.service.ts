import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { ConfigService, ConfigModule } from '@nestjs/config';


export interface JwtPayload {
    sub: string;
    email: string;
    type: string;
    iat: number;
    exp: number;
}

@Injectable()
export class JwtService {

    constructor(
        private readonly jwtService: NestJwtService,
        private readonly configService: ConfigService
    ) { }

    generateToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            type: user.type_utilisateur,
        };

        return this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN') || '2h',
        });
    }

    verifyToken(token: string): JwtPayload {
        try {
            return this.jwtService.verify(token);
        } catch (err) {
            throw new UnauthorizedException('Token invalide ou expiré');
        }
    }

    decodeToken(token: string): any {
        return this.jwtService.decode(token);
    }
}
