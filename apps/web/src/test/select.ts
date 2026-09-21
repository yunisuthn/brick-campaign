import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

/**
 * Opens our own dropdown (form/Select.tsx) by its label and picks the option with the given
 * visible text. Stands in for `user.selectOptions`, which only understands a native <select>.
 */
export async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  optionName: string,
) {
  await user.click(screen.getByLabelText(label));
  await user.click(screen.getByRole('option', { name: optionName }));
}
