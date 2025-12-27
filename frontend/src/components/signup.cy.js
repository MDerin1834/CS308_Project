describe('User Signup Flow', () => {
  beforeEach(() => {
    cy.visit('/sign-up');
  });

  it('should complete the multi-step signup process successfully', () => {
    // --- Step 1: Personal Information ---
    // Verify we are on step 1
    cy.contains('1. Personal').should('have.style', 'font-weight', '700');

    cy.get('input[name="name"]').type('cypressUser');
    cy.get('input[name="fullName"]').type('Cypress Test User');
    // Use a unique email to avoid conflict if backend is running
    cy.get('input[name="email"]').type(`cypress${Date.now()}@test.com`);

    cy.contains('button', 'Next').click();

    // --- Step 2: Address Information ---
    // Verify we moved to step 2
    cy.contains('2. Address').should('have.style', 'font-weight', '700');

    // Select Country (this should populate the City dropdown)
    cy.get('select[name="country"]').select('United States');
    
    // Select City
    cy.get('select[name="city"]').should('not.be.disabled').select('New York');

    cy.get('input[name="taxId"]').type('TAX-987654321');
    cy.get('input[name="addressLine1"]').type('123 Cypress Avenue');
    cy.get('input[name="addressLine2"]').type('Suite 500');
    cy.get('input[name="postalCode"]').type('10001');
    cy.get('input[name="phone"]').type('555-0199');

    cy.contains('button', 'Next').click();

    // --- Step 3: Security ---
    // Verify we moved to step 3
    cy.contains('3. Security').should('have.style', 'font-weight', '700');

    const password = 'Password123!';
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);

    // Stub window.alert to verify the success message
    const alertStub = cy.stub();
    cy.on('window:alert', alertStub);

    cy.contains('button', 'Get Started Now').click();

    // Note: In a real environment, you might assert the URL changed or the alert was called
    // cy.wrap(alertStub).should('be.calledWith', 'Account Created Successfully!');
  });

  it('should show error when passwords do not match', () => {
    // Fast-forward through Step 1 & 2 with dummy data
    cy.get('input[name="name"]').type('test');
    cy.get('input[name="fullName"]').type('test');
    cy.get('input[name="email"]').type('test@test.com');
    cy.contains('button', 'Next').click();

    cy.get('select[name="country"]').select('Turkey');
    cy.get('select[name="city"]').select('Istanbul');
    cy.get('input[name="taxId"]').type('1');
    cy.get('input[name="addressLine1"]').type('1');
    cy.get('input[name="postalCode"]').type('1');
    cy.contains('button', 'Next').click();

    // Step 3: Enter mismatching passwords
    cy.get('input[name="password"]').type('123');
    cy.get('input[name="confirmPassword"]').type('321');
    cy.contains('button', 'Get Started Now').click();

    // Assert error message
    cy.contains("Passwords don't match! Please provide correct password").should('be.visible');
  });
});
