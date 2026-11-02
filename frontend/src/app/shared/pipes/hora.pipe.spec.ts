import { HoraPipe } from './hora.pipe';

describe('HoraPipe', () => {
  it('muestra horas sin segundos', () => {
    const pipe = new HoraPipe();
    expect(pipe.transform('14:20:00')).toBe('14:20');
    expect(pipe.transform(undefined)).toBe('');
  });
});
