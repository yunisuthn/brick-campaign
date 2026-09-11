import { renderHook } from '@testing-library/react';
import type { ValidationIssue } from 'contracts';
import { useForm } from 'react-hook-form';
import { ApiError } from '../api/client.js';
import { plain } from '../test/text.js';
import { apiFormErrors } from './apiFormErrors.js';

/** A real form, so the helper is read against the shape it meets in a screen. */
const form = renderHook(() => useForm({ defaultValues: { name: '', quantity: '', date: '' } }))
  .result.current;

function refused(...issues: ValidationIssue[]) {
  return apiFormErrors(
    {
      error: new ApiError(400, { code: 'validation_failed', message: 'Validation failed', issues }),
    },
    form,
  );
}

function sentence(issue: ValidationIssue): string {
  return plain(
    refused(issue).fields.name?.message ?? refused(issue).fields.quantity?.message ?? '',
  );
}

describe('apiFormErrors', () => {
  it('says nothing while nothing has been refused', () => {
    expect(apiFormErrors({ error: null }, form)).toEqual({ fields: {}, message: null });
  });

  it('leaves a refusal that is not about the body above the form', () => {
    const error = new ApiError(409, { code: 'campaign_year_taken', message: 'taken' });
    expect(apiFormErrors({ error }, form)).toEqual({
      fields: {},
      message: 'Une campagne existe déjà pour cette année.',
    });
  });

  it('puts each issue on its field and says nothing above the form', () => {
    const result = refused(
      { path: 'name', message: 'Too big', kind: 'too_big', origin: 'string', limit: 120 },
      { path: 'quantity', message: 'Too small', kind: 'too_small', origin: 'int', limit: 0 },
    );
    expect(plain(result.fields.name?.message)).toBe('120 caractères au maximum.');
    expect(result.fields.quantity?.message).toBe('Au moins 1.');
    expect(result.message).toBeNull();
  });

  it('keeps the general sentence when an issue names no field of this form', () => {
    const result = refused({ path: '', message: 'At least one field', kind: 'other' });
    expect(result.fields).toEqual({});
    expect(result.message).toBe('La saisie est incomplète ou mal formée.');
  });

  it('reads a bound the way it was meant', () => {
    expect(
      sentence({ path: 'quantity', message: '', kind: 'too_small', origin: 'int', limit: 39999 }),
    ).toBe('Au moins 40 000.');
    expect(
      sentence({
        path: 'quantity',
        message: '',
        kind: 'too_small',
        origin: 'int',
        limit: 40000,
        inclusive: true,
      }),
    ).toBe('Au moins 40 000.');
    expect(
      sentence({ path: 'name', message: '', kind: 'too_small', origin: 'string', limit: 1 }),
    ).toBe('Ce champ est requis.');
  });

  it('names the type when the value was not of the right one', () => {
    expect(sentence({ path: 'quantity', message: '', kind: 'invalid_type', origin: 'int' })).toBe(
      'Un nombre entier est attendu.',
    );
    expect(sentence({ path: 'name', message: '', kind: 'invalid_format' })).toBe(
      'Le format attendu n’est pas respecté.',
    );
  });
});
