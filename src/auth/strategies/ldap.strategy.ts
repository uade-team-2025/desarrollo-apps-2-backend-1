import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { User } from '../../users/user.schema';
import { UserService } from '../../users/user/user.service';

@Injectable()
export class LdapStrategy extends PassportStrategy(Strategy, 'ldap') {
  private readonly ldapValidateUrl: string;

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super();
    this.ldapValidateUrl =
      configService.get<string>('LDAP_VALIDATE_URL') ||
      'http://ec2-13-217-71-142.compute-1.amazonaws.com:8081/v1/auth/validate';
  }

  async validate(req: Request): Promise<any> {
    // Extraer el token del header Authorization o query parameter
    let token: string | null = null;

    // Intentar obtener del header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Si no está en el header, intentar del query parameter
    if (!token && req.query?.token) {
      token = req.query.token as string;
    }

    // Si no está en el query, intentar del body
    if (!token && req.body?.token) {
      token = req.body.token;
    }

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    // Validar el token contra el endpoint LDAP
    try {
      // Intentar primero con jwt_token en el body (formato del frontend)
      const requestBody = { jwt_token: token };

      const response = await fetch(this.ldapValidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result: any = await response.json().catch(() => ({}));

      const isTokenValid = (response: Response, result: any): boolean => {
        if (response.ok) {
          if (response.status === 200 && !result.error) {
            return true;
          }
        }

        return false;
      };

      if (!isTokenValid(response, result)) {
        // Intentar con diferentes formatos
        const alternativeFormats = [
          { name: 'token en body', body: { token: token } },
          {
            name: 'Authorization header',
            headers: { Authorization: `Bearer ${token}` },
            body: {},
          },
        ];

        for (const format of alternativeFormats) {
          try {
            const altResponse = await fetch(this.ldapValidateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(format.headers || {}),
              },
              body: JSON.stringify(format.body || {}),
            });

            const altResult: any = await altResponse.json().catch(() => ({}));

            if (isTokenValid(altResponse, altResult)) {
              return await this.createOrUpdateUser(token);
            } else {
              // Si no es válido, continuar probando con otros formatos
            }
          } catch (formatError) {
            // Ignorar errores específicos de formato y continuar
          }
        }

        throw new UnauthorizedException('Token LDAP inválido');
      }

      // Decodificar el JWT sin verificar la firma (el endpoint ya lo validó)
      let payload: any;
      payload = this.decodeJwtPayload(token);

      return await this.createOrUpdateUser(token);
    } catch (error) {
      throw error instanceof UnauthorizedException
        ? error
        : new UnauthorizedException('Error al validar token LDAP');
    }
  }

  /**
   * Crea o actualiza un usuario basándose en el token JWT
   */
  private async createOrUpdateUser(token: string): Promise<User> {
    const payload = this.decodeJwtPayload(token);
    let user = await this.userService.findByEmail(payload.email);

    if (!user) {
      // Crear nuevo usuario desde LDAP
      const newUser: Partial<User> = {
        name: payload.name || payload.email,
        email: payload.email,
        role: payload.role || 'user',
        isGoogleUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      user = await this.userService.create(newUser as User);
    } else {
      // Actualizar información del usuario si es necesario
      user = await this.userService.update((user as any)._id.toString(), {
        ...user,
        name: payload.name || user.name,
        updatedAt: new Date(),
      });
    }

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Decodifica el payload de un JWT sin verificar la firma
   */
  private decodeJwtPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido: número de partes incorrecto');
      }

      // Decodificar el payload (segunda parte)
      const payload = parts[1];
      let decoded: string;
      decoded = Buffer.from(payload, 'base64url').toString('utf-8');

      return JSON.parse(decoded);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new UnauthorizedException(
        `Error al decodificar token JWT: ${errorMessage}`,
      );
    }
  }
}
