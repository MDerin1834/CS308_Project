import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Search from '../shop/Search';

const products = [
  { id: 1, name: 'Phone Case', price: 10, img: 'case.png' },
  { id: 2, name: 'Laptop Bag', price: 30, img: 'bag.png' },
  { id: 3, name: 'Smartphone', price: 500, img: 'phone.png' },
];

describe('Search', () => {
  afterEach(() => {
    cleanup();
  });

  it('filters products by search term and renders matching links', async () => {
    const setSearchTerm = vi.fn();
    render(
      <MemoryRouter>
        <Search products={products} searchTerm="phone" setSearchTerm={setSearchTerm} />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/phone case/i).some((el) => el.closest('a')?.getAttribute('href') === '/shop/1')).toBe(true);
    expect(screen.getAllByText(/smartphone/i).some((el) => el.closest('a')?.getAttribute('href') === '/shop/3')).toBe(true);
  });

  it('calls setSearchTerm as the user types and hides results when empty', async () => {
    const user = userEvent.setup();
    const setSearchTerm = vi.fn();
    render(
      <MemoryRouter>
        <Search products={products} searchTerm="" setSearchTerm={setSearchTerm} />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText(/search/i), 'lap');
    expect(setSearchTerm.mock.calls.map(([arg]) => arg)).toEqual(['l', 'a', 'p']);

    // With empty searchTerm, no result links are rendered
    expect(screen.queryByRole('link')).toBeNull();
  });
});
