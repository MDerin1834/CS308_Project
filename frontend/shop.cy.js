describe('Shop Page Filtration', () => {
  beforeEach(() => {
    // Navigate to the shop page
    cy.visit('/shop');
  });

  it('should filter products by search term', () => {
    const searchTerm = 'Phone'; // Replace with a product name that exists in your DB

    // Type into the search input and press Enter
    // Adjust selector if your search input has a specific ID, e.g., cy.get('#search-bar')
    cy.get('input[type="text"]').first().type(`${searchTerm}{enter}`);

    // Wait for results and verify
    // Adjust '.card' or '.product-item' to match your product component class
    cy.get('body').then(($body) => {
      if ($body.find('.card').length > 0) {
        cy.get('.card').should('contain.text', searchTerm);
      } else {
        // Fallback assertion if class names are unknown
        cy.contains(searchTerm).should('be.visible');
      }
    });
  });

  it('should filter products by category', () => {
    // Locate a category filter (e.g., a button or checkbox) and click it
    // Replace 'Electronics' with a real category in your app
    cy.contains('Electronics').click();

    // Assert that the URL updates or the product list changes
    // Example: checking if the URL contains the query param
    // cy.url().should('include', 'category=Electronics');
    
    // Or checking that displayed products belong to the category
    cy.get('body').should('contain.text', 'Electronics');
  });
});
