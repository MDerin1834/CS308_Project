import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthProvider';
import Signup from '../components/Signup';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
let mockLocationValue = { state: { from: { pathname: '/' } } };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocationValue,
  };
});

const renderWithAuth = (ui, value) =>
  render(<AuthContext.Provider value={value}>{ui}</AuthContext.Provider>);

const createMockStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

const fillSignupForm = async (
  user,
  {
    name,
    email,
    password,
    confirmPassword,
    fullName = 'Full Name',
    taxId = 'TAX-123',
    addressLine1 = 'Street 1',
    addressLine2 = 'Apt 1',
    city = 'Istanbul',
    country = 'TR',
    postalCode = '34000',
    phone = '5555555',
  },
) => {
  await user.clear(screen.getByPlaceholderText(/user name/i));
  await user.type(screen.getByPlaceholderText(/user name/i), name);
  await user.type(screen.getByPlaceholderText(/full name/i), fullName);
  await user.type(screen.getByPlaceholderText(/email/i), email);
  await user.type(screen.getByPlaceholderText(/tax id/i), taxId);
  await user.type(screen.getByPlaceholderText(/address line 1/i), addressLine1);
  if (addressLine2) {
    await user.type(screen.getByPlaceholderText(/address line 2/i), addressLine2);
  }
  await user.type(screen.getByPlaceholderText(/city/i), city);
  await user.type(screen.getByPlaceholderText(/country/i), country);
  await user.type(screen.getByPlaceholderText(/postal code/i), postalCode);
  await user.type(screen.getByPlaceholderText(/phone/i), phone);
  await user.type(screen.getByPlaceholderText(/^password/i), password);
  await user.type(screen.getByPlaceholderText(/confirm password/i), confirmPassword);
  await user.click(screen.getByRole('button', { name: /get started now/i }));
};

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage = createMockStorage();
    globalThis.alert = vi.fn();
    mockLocationValue = { state: { from: { pathname: '/' } } };
  });

  afterEach(() => {
    cleanup();
  });

  it('blocks submission when passwords do not match', async () => {
    const registerUser = vi.fn();
    renderWithAuth(<Signup />, { registerUser, signUpWithGmail: vi.fn() });
    const user = userEvent.setup();

    await fillSignupForm(user, {
      name: 'Jane Tester',
      email: 'jane@example.com',
      password: 'Password123!',
      confirmPassword: 'Mismatch000!',
    });

    expect(registerUser).not.toHaveBeenCalled();
    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
  });

  it('requires a non-empty trimmed name', async () => {
    const registerUser = vi.fn();
    renderWithAuth(<Signup />, { registerUser, signUpWithGmail: vi.fn() });
    const user = userEvent.setup();

    await fillSignupForm(user, {
      name: '   ',
      email: 'trim@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(registerUser).not.toHaveBeenCalled();
    expect(await screen.findByText(/user name is required/i)).toBeInTheDocument();
  });

  it('shows backend error messages when registration fails', async () => {
    const registerUser = vi.fn().mockResolvedValue({
      success: false,
      message: 'Email already in use',
    });
    renderWithAuth(<Signup />, { registerUser, signUpWithGmail: vi.fn() });
    const user = userEvent.setup();

    await fillSignupForm(user, {
      name: 'Backend Failure',
      email: 'existing@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(registerUser).toHaveBeenCalledWith(
      'Backend Failure',
      'existing@example.com',
      'Password123!',
      expect.any(Object),
    );
    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows success feedback and navigates back after a successful registration', async () => {
    const registerUser = vi.fn().mockResolvedValue({
      success: true,
      message: 'Custom success message',
    });
    mockLocationValue = { state: { from: { pathname: '/dashboard' } } };
    const user = userEvent.setup();
    renderWithAuth(<Signup />, { registerUser, signUpWithGmail: vi.fn() });

    await fillSignupForm(user, {
      name: ' John Doe ',
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(registerUser).toHaveBeenCalledWith(
      'John Doe',
      'john@example.com',
      'Password123!',
      expect.objectContaining({
        taxId: 'TAX-123',
        homeAddress: expect.objectContaining({
          addressLine1: 'Street 1',
          city: 'Istanbul',
          country: 'TR',
          postalCode: '34000',
        }),
      }),
    );
    expect(globalThis.alert).toHaveBeenCalledWith('Custom success message');

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      },
      { timeout: 2500 },
    );
  });
});
