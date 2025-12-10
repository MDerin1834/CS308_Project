import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthProvider';
import Login from '../components/Login';
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

const submitLoginForm = async (user, { email = 'login@example.com', password = 'Password123!' } = {}) => {
  const emailInput = screen.getByPlaceholderText(/email address/i);
  await user.type(emailInput, email);
  await user.type(screen.getByPlaceholderText(/password \*/i), password);
  const form = emailInput.closest('form');
  fireEvent.submit(form);
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage = createMockStorage();
    mockLocationValue = { state: { from: { pathname: '/' } } };
  });

  afterEach(() => {
    cleanup();
  });

  it('shows backend error messages when login fails', async () => {
    const login = vi.fn().mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
    });
    const user = userEvent.setup();

    renderWithAuth(<Login />, { login, signUpWithGmail: vi.fn() });

    await submitLoginForm(user, {
      email: 'fail@example.com',
      password: 'WrongPass!',
    });

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('fail@example.com', 'WrongPass!');
    });
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('stores credentials and navigates after successful login', async () => {
    const login = vi.fn().mockResolvedValue({
      success: true,
      message: 'Welcome back',
      user: { id: '123', email: 'success@example.com', role: 'customer' },
      token: 'token-123',
    });
    const user = userEvent.setup();
    mockLocationValue = { state: { from: { pathname: '/account' } } };
    localStorage.setItem('redirectAfterLogin', '/checkout');

    renderWithAuth(<Login />, { login, signUpWithGmail: vi.fn() });

    await submitLoginForm(user, {
      email: 'success@example.com',
      password: 'Password123!',
    });

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('success@example.com', 'Password123!');
      expect(localStorage.getItem('token')).toBe('token-123');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(
        expect.objectContaining({ email: 'success@example.com', role: 'customer' }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/checkout', { replace: true });
      expect(localStorage.getItem('redirectAfterLogin')).toBeNull();
    });
  });
});
