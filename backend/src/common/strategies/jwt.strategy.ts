import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'voyagex_access_secret'
    });
  }

  validate(payload: { id: string; role: string; email: string }) {
    console.log('JWT Strategy validate called with payload:', payload);
    return payload;
  }
}