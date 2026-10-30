import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { type GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { getRequest } from '@/utils/request-context';
import { getFieldPermissions } from './decorators/field-permission.decorator';

// @nestjs/graphql does not export GqlParamtype; its ARGS member is 3
const GQL_ARGS_PARAMTYPE = 3;

export interface TriggeredFieldGate {
  field: string;
  codes: readonly string[];
}

type RouteArg = { index: number; data?: unknown };

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;

// The @FieldPermission gates this request triggers: REST reads the @Body() payload, GraphQL the @Args() payloads
export function triggeredFieldGates(context: ExecutionContext): TriggeredFieldGate[] {
  const owner = context.getClass();
  const handlerName = context.getHandler().name;
  const routeArgs: Record<string, RouteArg> = Reflect.getMetadata(ROUTE_ARGS_METADATA, owner, handlerName) ?? {};
  const paramTypes: unknown[] = Reflect.getMetadata('design:paramtypes', owner.prototype, handlerName) ?? [];

  const gated = Object.entries(routeArgs)
    .map(([key, arg]) => ({
      paramtype: Number(key.split(':')[0]),
      arg,
      rules: getFieldPermissions(paramTypes[arg.index]),
    }))
    .filter((entry) => entry.rules);
  if (gated.length === 0) return [];

  const isGraphql = context.getType<GqlContextType>() === 'graphql';
  const payloadParamtype = isGraphql ? GQL_ARGS_PARAMTYPE : RouteParamtypes.BODY;
  const source = isGraphql ? GqlExecutionContext.create(context).getArgs() : getRequest(context).body;

  const triggered: TriggeredFieldGate[] = [];
  for (const { paramtype, arg, rules } of gated) {
    if (paramtype !== payloadParamtype || !rules) continue;
    const root = asRecord(source);
    const payload = typeof arg.data === 'string' ? asRecord(root?.[arg.data]) : root;
    if (!payload) continue;
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.when(payload[field], payload)) triggered.push({ field, codes: rule.codes });
    }
  }
  return triggered;
}
