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
      console.error('[LDAP Strategy] Token no proporcionado', {
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 20),
        hasQueryToken: !!req.query?.token,
        hasBodyToken: !!req.body?.token,
        method: req.method,
        path: req.path,
        url: req.url,
      });
      throw new UnauthorizedException('Token no proporcionado');
    }

    console.log('[LDAP Strategy] Validando token LDAP', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      url: this.ldapValidateUrl,
      method: req.method,
      path: req.path,
    });

    // Validar el token contra el endpoint LDAP
    try {
      // Intentar primero con jwt_token en el body (formato del frontend)
      const requestBody = { jwt_token: token };
      console.log('[LDAP Strategy] Enviando request al endpoint LDAP', {
        url: this.ldapValidateUrl,
        method: 'POST',
        bodyKeys: Object.keys(requestBody),
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 30) + '...',
      });

      const response = await fetch(this.ldapValidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { rawResponse: responseText };
      }

      const isTokenValid = (response: Response, result: any): boolean => {
        if (response.ok) {
          if (response.status === 200 && !result.error) {
            return true;
          }
        }

        return false;
      };

      if (!isTokenValid(response, result)) {
        console.error(
          '[LDAP Strategy] Respuesta del endpoint LDAP indica token inválido',
          {
            status: response.status,
            statusText: response.statusText,
            url: this.ldapValidateUrl,
            response: result,
            responseText: responseText,
            tokenPrefix: token.substring(0, 30) + '...',
            requestBody: requestBody,
          },
        );

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
          console.log(`[LDAP Strategy] Intentando con formato: ${format.name}`);
          try {
            const altResponse = await fetch(this.ldapValidateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(format.headers || {}),
              },
              body: JSON.stringify(format.body || {}),
            });

            const altResponseText = await altResponse.text();
            let altResult: any;
            try {
              altResult = JSON.parse(altResponseText);
            } catch (e) {
              altResult = { rawResponse: altResponseText };
            }

            if (isTokenValid(altResponse, altResult)) {
              console.log(
                `[LDAP Strategy] Token válido usando formato: ${format.name}`,
              );
              return await this.createOrUpdateUser(token);
            } else {
              console.error(
                `[LDAP Strategy] Falló con formato ${format.name}`,
                {
                  status: altResponse.status,
                  response: altResult,
                },
              );
            }
          } catch (formatError) {
            console.error(`[LDAP Strategy] Error con formato ${format.name}`, {
              error:
                formatError instanceof Error
                  ? formatError.message
                  : String(formatError),
            });
          }
        }

        throw new UnauthorizedException('Token LDAP inválido');
      }

      console.log('[LDAP Strategy] Token LDAP válido', {
        result,
        tokenPrefix: token.substring(0, 20) + '...',
      });

      // Decodificar el JWT sin verificar la firma (el endpoint ya lo validó)
      let payload: any;
      try {
        payload = this.decodeJwtPayload(token);
        console.log('[LDAP Strategy] JWT decodificado exitosamente', {
          email: payload.email,
          name: payload.name,
          role: payload.role,
        });
      } catch (error) {
        console.error('[LDAP Strategy] Error al decodificar JWT', {
          error: error instanceof Error ? error.message : String(error),
          tokenPrefix: token.substring(0, 20) + '...',
        });
        throw error;
      }

      return await this.createOrUpdateUser(token);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[LDAP Strategy] Error inesperado validando token LDAP', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'no token',
        url: this.ldapValidateUrl,
        method: req.method,
        path: req.path,
      });
      throw new UnauthorizedException('Error al validar token LDAP');
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
        console.error('[LDAP Strategy] Token JWT con formato inválido', {
          partsCount: parts.length,
          tokenPrefix: token.substring(0, 50) + '...',
        });
        throw new Error('Token JWT inválido: número de partes incorrecto');
      }

      // Decodificar el payload (segunda parte)
      const payload = parts[1];
      let decoded: string;
      try {
        decoded = Buffer.from(payload, 'base64url').toString('utf-8');
      } catch (e) {
        console.error(
          '[LDAP Strategy] Error decodificando base64url del payload',
          {
            error: e instanceof Error ? e.message : String(e),
            payloadPrefix: payload.substring(0, 50) + '...',
          },
        );
        throw new Error('Error al decodificar base64url del payload');
      }

      try {
        return JSON.parse(decoded);
      } catch (e) {
        console.error('[LDAP Strategy] Error parseando JSON del payload', {
          error: e instanceof Error ? e.message : String(e),
          decodedPrefix: decoded.substring(0, 100) + '...',
        });
        throw new Error('Error al parsear JSON del payload');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error('[LDAP Strategy] Error al decodificar token JWT', {
        error: errorMessage,
        tokenPrefix: token.substring(0, 50) + '...',
      });
      throw new UnauthorizedException(
        `Error al decodificar token JWT: ${errorMessage}`,
      );
    }
  }
}
