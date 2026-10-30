import 'reflect-metadata';
import { Body, type ExecutionContext } from '@nestjs/common';
import { Args } from '@nestjs/graphql';
import { FieldPermission } from './decorators/field-permission.decorator';
import { triggeredFieldGates } from './field-gates';

class CreateThingDto {
  name?: string;

  @FieldPermission(['offerings.add', 'offerings.variants.add'], (value) => value === true)
  createOffering!: boolean;

  @FieldPermission(['things.approve'])
  approvedBy?: string | null;
}

class CreateChildThingDto extends CreateThingDto {
  @FieldPermission(['things.discount'], (value, payload) => Number(value) > 10 && payload.name !== 'free')
  discount?: number;
}

class ThingsController {
  create(@Body() _dto: CreateThingDto) {}
  createChild(@Body() _dto: CreateChildThingDto) {}
}

class ThingsResolver {
  createThing(@Args('input') _input: CreateThingDto) {}
}

const httpContext = (handler: keyof ThingsController, body: unknown) =>
  ({
    getClass: () => ThingsController,
    getHandler: () => ThingsController.prototype[handler],
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ body }) }),
  }) as unknown as ExecutionContext;

const graphqlContext = (args: Record<string, unknown>) =>
  ({
    getClass: () => ThingsResolver,
    getHandler: () => ThingsResolver.prototype.createThing,
    getType: () => 'graphql',
    getArgs: () => [undefined, args, {}, {}],
  }) as unknown as ExecutionContext;

describe('triggeredFieldGates', () => {
  it('triggers nothing when no gated field is sent', () => {
    expect(triggeredFieldGates(httpContext('create', { name: 'x' }))).toEqual([]);
  });

  it('runs the condition against the raw value', () => {
    expect(triggeredFieldGates(httpContext('create', { createOffering: false }))).toEqual([]);
    expect(triggeredFieldGates(httpContext('create', { createOffering: true }))).toEqual([
      { field: 'createOffering', codes: ['offerings.add', 'offerings.variants.add'] },
    ]);
  });

  it('defaults to "sent and not null/false" when no condition is given', () => {
    expect(triggeredFieldGates(httpContext('create', { approvedBy: null }))).toEqual([]);
    expect(triggeredFieldGates(httpContext('create', { approvedBy: 'u1' }))).toEqual([
      { field: 'approvedBy', codes: ['things.approve'] },
    ]);
  });

  it('inherits parent gates and passes the whole payload to the condition', () => {
    expect(triggeredFieldGates(httpContext('createChild', { discount: 20, name: 'free' }))).toEqual([]);
    expect(triggeredFieldGates(httpContext('createChild', { discount: 20, createOffering: true }))).toEqual([
      { field: 'createOffering', codes: ['offerings.add', 'offerings.variants.add'] },
      { field: 'discount', codes: ['things.discount'] },
    ]);
  });

  it('reads the named GraphQL argument', () => {
    expect(triggeredFieldGates(graphqlContext({ input: { createOffering: true } }))).toEqual([
      { field: 'createOffering', codes: ['offerings.add', 'offerings.variants.add'] },
    ]);
    expect(triggeredFieldGates(graphqlContext({ input: { createOffering: false } }))).toEqual([]);
  });

  it('ignores handlers without gated payloads', () => {
    const context = {
      getClass: () => class {},
      getHandler: () => () => undefined,
    } as unknown as ExecutionContext;
    expect(triggeredFieldGates(context)).toEqual([]);
  });
});
