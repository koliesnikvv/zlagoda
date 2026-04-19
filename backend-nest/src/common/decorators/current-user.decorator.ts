import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  user_id: string;
  role: 'Manager' | 'Cashier';
  email: string;
  name: string;
  surname: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
