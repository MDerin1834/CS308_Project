import React from 'react';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthProvider';
import WishlistProvider from '../contexts/WishlistContext';
import ProductDisplay from '../shop/ProductDisplay';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockApiPost = vi.fn();
const mockApiGet = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/client', () => ({
  __esModule: true,
  default: {
    post: (...args) => mockApiPost(...args),
    get: (...args) => mockApiGet(...args),
  },
}));

const createMockStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

const baseItem = {
  id: 'p1',
  name: 'Test Product',
  price: 25,
  quantity: 1,
  stock: 5,
  seller: 'Tester',
  description: 'Nice item',
  img: 'img.png',
};

const renderWithAuth = (ui, value) =>
  render(
    <AuthContext.Provider value={value}>
      <WishlistProvider>{ui}</WishlistProvider>
    </AuthContext.Provider>
  );

describe('ProductDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage = createMockStorage();
    globalThis.alert = vi.fn();
    mockApiGet.mockResolvedValue({ status: 200, data: { items: [] } });
  });

  afterEach(() => {
    cleanup();
  });

  it('prevents adding to cart without selecting a color', async () => {
    renderWithAuth(<ProductDisplay item={baseItem} />, { user: null });

    const form = screen.getByRole('button', { name: /add to cart/i }).closest('form');
    fireEvent.submit(form);

    expect(globalThis.alert).toHaveBeenCalledWith('Please select a color before adding to cart.');
    expect(localStorage.getItem('cart')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('stores guest cart and alerts when user is not logged in', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ProductDisplay item={baseItem} />, { user: null });

    await user.selectOptions(screen.getByRole('combobox'), 'Red');
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    const cart = JSON.parse(localStorage.getItem('cart'));
    expect(cart).toEqual([
      expect.objectContaining({
        id: 'p1',
        name: 'Test Product',
        price: 25,
        quantity: 1,
      }),
    ]);
    expect(globalThis.alert).toHaveBeenCalledWith('Added to cart. Please sign in to checkout.');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('adds to cart via API and navigates to checkout when user clicks checkout', async () => {
    mockApiPost.mockResolvedValue({ status: 200, data: {} });
    const user = userEvent.setup();
    renderWithAuth(<ProductDisplay item={baseItem} />, { user: { id: 'u1', email: 'user@example.com' } });

    await user.selectOptions(screen.getByRole('combobox'), 'Blue');
    await user.click(screen.getByRole('button', { name: /check out/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/cart',
        { productId: 'p1', quantity: 1 },
        { validateStatus: expect.any(Function) },
      );
      expect(globalThis.alert).toHaveBeenCalledWith('Added to cart');
      expect(mockNavigate).toHaveBeenCalledWith('/cart-page');
    });
  });
});
