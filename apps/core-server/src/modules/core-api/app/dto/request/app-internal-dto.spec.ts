import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateAppInternalDto } from './create-app-internal.dto';
import { UpdateAppInternalDto } from './update-app-internal.dto';

describe('app internal DTOs', () => {
  describe('UpdateAppInternalDto.allowedOrigins', () => {
    const errorsFor = (allowedOrigins: unknown) =>
      validateSync(plainToInstance(UpdateAppInternalDto, { allowedOrigins })).map((error) => error.property);

    it('accepts https origins and http on localhost', () => {
      expect(errorsFor(['https://desitaakat.com', 'http://localhost:3000'])).toEqual([]);
    });

    it('refuses an origin with a path, or plain http on a public host', () => {
      expect(errorsFor(['https://desitaakat.com/shop'])).toEqual(['allowedOrigins']);
      expect(errorsFor(['http://desitaakat.com'])).toEqual(['allowedOrigins']);
    });

    it('refuses more than 20 origins', () => {
      const many = Array.from({ length: 21 }, (_, i) => `https://shop${i}.example`);
      expect(errorsFor(many)).toEqual(['allowedOrigins']);
    });
  });

  it('validates allowedOrigins on create too', () => {
    const errors = validateSync(
      plainToInstance(CreateAppInternalDto, {
        name: 'Shop',
        type: 'GRAPHQL',
        allowedOrigins: ['https://shop.example/x'],
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(['allowedOrigins']);
  });
});
