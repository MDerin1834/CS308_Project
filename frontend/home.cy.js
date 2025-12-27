describe('Home Page E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the application successfully', () => {
    cy.get('body').should('be.visible');
  });
});
