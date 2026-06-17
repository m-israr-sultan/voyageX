import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health(): Record<string, string> {
    return { message: 'VoyageX backend running' };
  }
}
