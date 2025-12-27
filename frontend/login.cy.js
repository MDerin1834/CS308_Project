describe('Login Functionality', () => {
  beforeEach(() => {
    // Navigate to the login page before each test
    // Ensure this route matches your React Router path for login
    cy.visit('/login');
  });

  it('should display the login form correctly', () => {
    cy.get('form').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show an error message with invalid credentials', () => {
    cy.get('input[type="email"]').type('wronguser@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Adjust the text below to match your actual error message
    cy.contains(/invalid|incorrect|fail/i).should('be.visible');
  });

  it('should redirect to home on successful login', () => {
    // Use a valid test user here
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Assert that the URL changes or a welcome message appears
    cy.url().should('not.include', '/login');
  });
});
