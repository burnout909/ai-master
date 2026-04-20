import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GuidanceScale from './GuidanceScale';

describe('GuidanceScale', () => {
  it('renders guidance scale slider', () => {
    render(<GuidanceScale />);
    const slider = screen.getByRole('slider', { name: /guidance scale/i });
    expect(slider).toBeDefined();
  });

  it('toggle Show both source distributions flips state', () => {
    render(<GuidanceScale />);
    const toggle = screen.getByRole('checkbox', { name: /show both source distributions/i });
    expect((toggle as HTMLInputElement).checked).toBe(false);
    fireEvent.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(true);
  });
});
